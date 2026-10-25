// 地球online：Cloudflare Worker + Durable Objects；Supabase 為世界資料提供跨房間重啟備份。
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return Response.json({ ok: true, app: '地球online', supabaseConfigured: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) });
    if (url.pathname === '/ws') {
      const room = (url.searchParams.get('room') || 'lobby').toLowerCase().replace(/[^a-z0-9_\-\u4e00-\u9fa5]/g, '').slice(0, 24) || 'lobby';
      return env.ROOM.get(env.ROOM.idFromName(room)).fetch(req);
    }
    return env.ASSETS.fetch(req);
  }
};

export class Room {
  constructor(state, env) {
    this.state = state; this.env = env;
    state.blockConcurrencyWhile(async () => {
      let seed = await state.storage.get('seed');
      if (seed == null) { seed = (Math.random() * 2147483646 | 0) + 1; await state.storage.put({ seed, hs: Math.random() * 1000 }); }
      this.seed = seed; this.hs = await state.storage.get('hs');
      this.edits = await state.storage.list({ prefix: 'e:' });
      this.remoteLoaded = false; this.persisting = false; this.persistQueued = false;
    });
  }
  players(excludeId) { return this.state.getWebSockets().map(w => w.deserializeAttachment()).filter(p => p && p.id !== excludeId); }
  host(excludeId) { const p = this.players(excludeId).sort((a,b) => a.t-b.t)[0]; return p && p.id; }
  broadcast(m, except) { const s=JSON.stringify(m); for (const w of this.state.getWebSockets()) if(w!==except){try{w.send(s)}catch(e){}} }

  async loadRemoteWorld() {
    if (this.remoteLoaded) return;
    this.remoteLoaded = true;
    const base=this.env.SUPABASE_URL, key=this.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!base || !key || !this.room) return;
    try {
      const res=await fetch(`${base.replace(/\/$/,'')}/rest/v1/earth_online_worlds?room_id=eq.${encodeURIComponent(this.room)}&select=world_data&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
      if(!res.ok){console.error('Supabase read failed',res.status);return;}
      const rows=await res.json(), world=rows[0]?.world_data;
      if(!world || typeof world!=='object'){await this.persistRemote();return;}
      if(Number.isInteger(world.seed)){this.seed=world.seed;await this.state.storage.put('seed',world.seed)}
      if(Number.isFinite(world.hs)){this.hs=world.hs;await this.state.storage.put('hs',world.hs)}
      if(Array.isArray(world.edits)){
        const puts={};
        for(const e of world.edits.slice(0,100000)){
          if(!Array.isArray(e)||e.length!==4||!e.every(Number.isInteger))continue;
          const [x,y,z,v]=e;
          if(Math.abs(x)<=100000&&Math.abs(z)<=100000&&y>=0&&y<=63&&v>=0&&(v&63)<=19)puts[`e:${x},${y},${z}`]=v;
        }
        const old=await this.state.storage.list({prefix:'e:'}), remove=[...old.keys()].filter(k=>!(k in puts));
        for(let i=0;i<remove.length;i+=100)await this.state.storage.delete(remove.slice(i,i+100));
        const keys=Object.keys(puts);
        for(let i=0;i<keys.length;i+=100)await this.state.storage.put(Object.fromEntries(keys.slice(i,i+100).map(k=>[k,puts[k]])));
        this.edits=await this.state.storage.list({prefix:'e:'});
      }
    } catch(e){console.error('Supabase read failed',String(e))}
  }
  queueRemotePersist(){
    this.persistQueued=true;if(this.persisting)return;this.persisting=true;
    const run=async()=>{while(this.persistQueued){this.persistQueued=false;await this.persistRemote()}this.persisting=false};
    run().catch(e=>{this.persisting=false;console.error('Supabase save failed',String(e))});
  }
  async persistRemote(){
    const base=this.env.SUPABASE_URL,key=this.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!base||!key||!this.room)return;
    try{
      const edits=[...this.edits.entries()].slice(0,100000).map(([k,v])=>{const [x,y,z]=k.slice(2).split(',').map(Number);return [x,y,z,v]});
      const res=await fetch(`${base.replace(/\/$/,'')}/rest/v1/earth_online_worlds?on_conflict=room_id`,{
        method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify({room_id:this.room,world_data:{seed:this.seed,hs:this.hs,edits},updated_at:new Date().toISOString()})
      });
      if(!res.ok)console.error('Supabase save failed',res.status,(await res.text()).slice(0,200));
    }catch(e){console.error('Supabase save failed',String(e))}
  }
  async fetch(req){
    if(req.headers.get('Upgrade')!=='websocket')return new Response('需要 WebSocket',{status:426});
    const url=new URL(req.url),name=(url.searchParams.get('name')||'玩家').slice(0,16);
    this.room=(url.searchParams.get('room')||'lobby').toLowerCase().replace(/[^a-z0-9_\-\u4e00-\u9fa5]/g,'').slice(0,24)||'lobby';
    await this.loadRemoteWorld();
    const [client,server]=Object.values(new WebSocketPair());
    if(this.state.getWebSockets().length>=16){server.accept();server.close(1013,'房間已滿');return new Response(null,{status:101,webSocket:client})}
    this.state.acceptWebSocket(server);
    const me={id:crypto.randomUUID().slice(0,8),name,x:8.5,y:80,z:8.5,yaw:0,pitch:0,t:Date.now()};
    server.serializeAttachment(me);
    const edits=[];for(const [k,v] of this.edits){const [x,y,z]=k.slice(2).split(',').map(Number);edits.push([x,y,z,v])}
    server.send(JSON.stringify({t:'init',id:me.id,seed:this.seed,hs:this.hs,now:Date.now(),host:this.host(),players:this.players(me.id),edits}));
    this.broadcast({t:'join',id:me.id,name},server);
    return new Response(null,{status:101,webSocket:client});
  }
  async webSocketMessage(ws,data){
    if(typeof data!=='string'||data.length>20000)return;
    let m;try{m=JSON.parse(data)}catch(e){return}
    const me=ws.deserializeAttachment();if(!me)return;
    if(m.t==='pos'){
      const n=v=>Number.isFinite(v)?v:0;Object.assign(me,{x:n(m.x),y:n(m.y),z:n(m.z),yaw:n(m.yaw),pitch:n(m.pitch)});ws.serializeAttachment(me);
      this.broadcast({t:'pos',id:me.id,x:me.x,y:me.y,z:me.z,yaw:me.yaw,pitch:me.pitch},ws);
    }else if(m.t==='blk'&&Array.isArray(m.e)){
      const ok=[],puts={},transient=[9,11,13];
      for(const e of m.e.slice(0,200)){
        if(!Array.isArray(e))continue;const [x,y,z,v,old]=e;
        if(![x,y,z,v].every(Number.isInteger)||Math.abs(x)>100000||Math.abs(z)>100000||y<0||y>63||v<0||(v&63)>19)continue;
        ok.push([x,y,z,v]);
        if(!transient.includes(v&63)&&!transient.includes(old)&&this.edits.size<100000){const k='e:'+x+','+y+','+z;this.edits.set(k,v);puts[k]=v}
      }
      if(ok.length){this.broadcast({t:'blk',e:ok},ws);const ks=Object.keys(puts);for(let i=0;i<ks.length;i+=100)await this.state.storage.put(Object.fromEntries(ks.slice(i,i+100).map(k=>[k,puts[k]])));if(ks.length)this.queueRemotePersist()}
    }else if(m.t==='admin_auth'&&typeof m.token==='string'){
      const ok=!!this.env.ADMIN_TOKEN&&m.token.length<=256&&m.token===this.env.ADMIN_TOKEN;
      if(ok){me.admin=true;ws.serializeAttachment(me)}ws.send(JSON.stringify({t:'admin_auth',ok}));
    }else if(m.t==='admin'&&me.admin===true&&typeof m.action==='string'){
      if(m.action==='announce'&&typeof m.message==='string'){const message=m.message.trim().slice(0,180);if(message)this.broadcast({t:'chat',id:'SERVER',name:'📢 管理員公告',m:message})}
      else if(m.action==='kick'&&typeof m.id==='string'&&m.id!==me.id){for(const peer of this.state.getWebSockets()){const target=peer.deserializeAttachment();if(target&&target.id===m.id){peer.send(JSON.stringify({t:'kicked',reason:'管理員已將你移出房間'}));peer.close(4001,'Kicked by admin');break}}}
      else if(m.action==='status')ws.send(JSON.stringify({t:'admin_status',players:this.players().map(p=>({id:p.id,name:p.name,admin:!!p.admin}))}));
    }else if(m.t==='chat'&&typeof m.m==='string')this.broadcast({t:'chat',id:me.id,name:me.name,m:m.m.slice(0,120)},ws);
  }
  webSocketClose(ws,code,reason){const me=ws.deserializeAttachment();try{ws.close(code,reason)}catch(e){}if(me){this.broadcast({t:'leave',id:me.id},ws);this.broadcast({t:'host',id:this.host(me.id)},ws)}}
  webSocketError(ws){this.webSocketClose(ws,1011,'error')}
}
