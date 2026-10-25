(()=>{'use strict';
const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d');
const N=17,HMAX=9,KEY=(x,y,z)=>x+','+y+','+z;
let W=innerWidth,H=innerHeight,dpr=1,scale=1,rot=0,panX=0,panY=20,tool='lower',brush=1,paused=false,speed=1,weather=0,day=1,hour=8,evap=0,drained=0,harvest=0,audioOn=true;
let blocks=new Map(),fluids=new Map(),moist=new Map(),falling=[],objects=[],last=performance.now(),drag=null;
const colors={grass:'#65a34e',dirt:'#936039',sand:'#d8c17a',stone:'#82898c',deep:'#48525c',bedrock:'#303941'};
const wx=[{n:'晴天',i:'☀️',e:.0005},{n:'酷暑',i:'🔥',e:.0015},{n:'陰天',i:'☁️',e:.0002},{n:'小雨',i:'🌧️',e:.0004},{n:'暴雨',i:'🌩️',e:.0002}];
const inside=(x,y,z)=>x>=0&&x<N&&z>=0&&z<N&&y>=0&&y<HMAX;
const get=(x,y,z)=>blocks.get(KEY(x,y,z));
const waterAt=(x,y,z)=>fluids.get(KEY(x,y,z))||0;
function put(x,y,z,t){if(inside(x,y,z))blocks.set(KEY(x,y,z),t)}
function remove(x,y,z){blocks.delete(KEY(x,y,z))}
function init(){blocks.clear();fluids.clear();moist.clear();falling=[];objects=[];for(let z=0;z<N;z++)for(let x=0;x<N;x++){let top=3+Math.round(1.2*Math.sin(x*.43)+Math.cos(z*.39));top=Math.max(2,Math.min(6,top));for(let y=0;y<=top;y++)put(x,y,z,y===0?'bedrock':y===top?'grass':y>=top-2?'dirt':y>=2?'stone':'deep');}
 // A small natural cave pocket, connected to the surface by a narrow shaft.
 for(let x=7;x<=9;x++)for(let z=7;z<=9;z++)remove(x,2,z);
 remove(8,3,8);ui();draw();}
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=visualViewport?visualViewport.height:innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);draw()}addEventListener('resize',resize);if(visualViewport)visualViewport.addEventListener('resize',resize);
function project(x,y,z){let a=x-(N-1)/2,b=z-(N-1)/2,ca=Math.cos(rot),sa=Math.sin(rot),rx=a*ca-b*sa,rz=a*sa+b*ca,u=Math.min(W/(N*1.15),H/(N*.85))*scale;return[W/2+panX+(rx-rz)*u*.5,H*.55+panY+(rx+rz)*u*.25-y*u*.5]}
function face(points,color,stroke='#17241f66'){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=stroke;ctx.stroke()}
function cubeFaces(x,y,z,type){let p000=project(x,y,z),p100=project(x+1,y,z),p110=project(x+1,y,z+1),p010=project(x,y,z+1),p001=project(x,y+1,z),p101=project(x+1,y+1,z),p111=project(x+1,y+1,z+1),p011=project(x,y+1,z+1);let c=colors[type]||colors.dirt;
 if(!get(x,y+1,z))face([p001,p101,p111,p011],type==='grass'?'#6eaf4c':c);
 if(!get(x+1,y,z))face([p100,p110,p111,p101],shade(c,.72));
 if(!get(x,y,z+1))face([p010,p110,p111,p011],shade(c,.56));
 // Water overlays visible cell top.
 let w=waterAt(x,y+1,z);if(w>.04&&!get(x,y+1,z))face([project(x,y+1+w*.75,z),project(x+1,y+1+w*.75,z),project(x+1,y+1+w*.75,z+1),project(x,y+1+w*.75,z+1)],'rgba(43,163,222,.72)','#b8edff66');
}
function shade(hex,f){let n=parseInt(hex.slice(1),16),r=Math.max(0,Math.min(255,((n>>16)&255)*f|0)),g=Math.max(0,Math.min(255,((n>>8)&255)*f|0)),b=Math.max(0,Math.min(255,(n&255)*f|0));return 'rgb('+r+','+g+','+b+')'}
function draw(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,weather===4?'#536b80':'#9ccbd2');g.addColorStop(1,'#d9e3c6');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 let list=[];for(let [k,t] of blocks){let [x,y,z]=k.split(',').map(Number);list.push({x,y,z,t,d:project(x+.5,y+.5,z+.5)[1]})}list.sort((a,b)=>a.d-b.d);
 for(let b of list)cubeFaces(b.x,b.y,b.z,b.t);
 for(let f of falling){let p=project(f.x+.5,f.y+.5,f.z+.5),u=Math.min(W/(N*1.15),H/(N*.85))*scale;ctx.fillStyle=colors[f.t]||colors.dirt;ctx.fillRect(p[0]-u*.2,p[1]-u*.2,u*.4,u*.4)}
 for(let [k,w] of fluids){if(w<.04)continue;let [x,y,z]=k.split(',').map(Number);if(!get(x,y,z)){let p=[project(x,y+w*.8,z),project(x+1,y+w*.8,z),project(x+1,y+w*.8,z+1),project(x,y+w*.8,z+1)];face(p,'rgba(43,163,222,.72)','#b8edff55')}}
 if(weather>=3){ctx.strokeStyle='#e4f7ff88';for(let i=0;i<weather===4?90:35;i++){let x=(i*97+performance.now()*.2)%W,y=(i*61+performance.now()*.5)%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+9);ctx.stroke()}}
 const total=[...fluids.values()].reduce((a,b)=>a+b,0);setText('waterVol',total.toFixed(1));setText('evapVol',evap.toFixed(1));setText('drainVol',drained.toFixed(1));setText('harvest',harvest);setText('moisture',Math.round([...moist.values()].reduce((a,b)=>a+b,0)/Math.max(1,moist.size)*100)||35)}
function setText(id,t){let e=document.getElementById(id);if(e)e.textContent=t}
function toast(s){let e=document.getElementById('toast');if(e){e.textContent=s;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1700)}}
function ui(){setText('day','第 '+day+' 日');let t=String(hour|0).padStart(2,'0')+':'+String(Math.floor(hour%1*60)).padStart(2,'0');setText('clock',t);setText('timeLabel',t);let tm=document.getElementById('time');if(tm)tm.value=hour;let wb=document.getElementById('weatherBtn');if(wb)wb.textContent=wx[weather].i+' '+wx[weather].n+' ↻';setText('weatherText',wx[weather].i+' '+wx[weather].n)}
function pick(px,py){let best=null,bd=1e9;for(let [k,t] of blocks){let [x,y,z]=k.split(',').map(Number);let p=project(x+.5,y+.5,z+.5),d=(p[0]-px)**2+(p[1]-py)**2;if(d<bd){bd=d;best={x,y,z,t}}}return bd<Math.min(W,H)**2*.018?best:null}
function dig(b){if(!b)return;remove(b.x,b.y,b.z);if(['dirt','sand','stone'].includes(b.t))falling.push({x:b.x,y:b.y,z:b.z,t:b.t,vy:0,life:1});if(b.t==='grass')put(b.x,b.y-1,b.z,'dirt');toast('挖除 '+b.t+' 方塊');draw()}
function place(b){if(!b)return;let x=b.x,y=b.y+1,z=b.z;if(!inside(x,y,z))return;put(x,y,z,'dirt');toast('放置泥土方塊');draw()}
function actAt(px,py){let b=pick(px,py);if(!b)return;if(tool==='lower'||tool==='remove')dig(b);else if(tool==='raise')place(b);else if(tool==='inspect')toast(b.t+' 方塊｜高度 '+b.y);else if(tool==='level'){for(let x=0;x<N;x++)for(let z=0;z<N;z++){let top=topBlock(x,z);if(top&&top.y>b.y)remove(x,top.y,z);else if(top&&top.y<b.y)put(x,b.y,z,'grass')}draw()}else if(tool==='source'){fluids.set(KEY(b.x,b.y+1,b.z),1);toast('已放置水源')}else if(tool==='drain'){fluids.delete(KEY(b.x,b.y+1,b.z));drained++;toast('已排水')}else if(tool==='rain'){weather=3;toast('開始降雨')}else if(tool==='remove'){dig(b)}}
function topBlock(x,z){for(let y=HMAX-1;y>=0;y--){let t=get(x,y,z);if(t)return{x,y,z,t}}return null}
function physics(dt){let step=Math.min(.08,dt)*speed;
 // Gravity: unsupported loose blocks fall one voxel at a time and may land on cave roofs/floors.
 for(let z=0;z<N;z++)for(let x=0;x<N;x++)for(let y=1;y<HMAX;y++){let t=get(x,y,z);if(!t||!['sand','dirt'].includes(t)||get(x,y-1,z))continue;let below=waterAt(x,y-1,z);if(Math.random()<Math.min(.9,step*8)){remove(x,y,z);if(below>.1)fluids.set(KEY(x,y-1,z),Math.max(0,below-.2));else put(x,y-1,z,t);}}
 // Water gravity first, then horizontal equalisation. Delta transfers avoid scan-order bias.
 let delta=new Map();const add=(k,v)=>delta.set(k,(delta.get(k)||0)+v);
 for(let [k,vol] of [...fluids]){let [x,y,z]=k.split(',').map(Number);if(vol<=.015){fluids.delete(k);continue}let down=KEY(x,y-1,z);if(y>0&&!get(x,y-1,z)){let move=Math.min(vol,.35*step*10);add(k,-move);add(down,move);continue}
  let candidates=[[x+1,y,z],[x-1,y,z],[x,y,z+1],[x,y,z-1]].filter(a=>inside(...a)&&!get(...a)).map(a=>({a,k:KEY(...a),v:waterAt(...a)})).sort((a,b)=>a.v-b.v);
  if(candidates.length&&vol>candidates[0].v+.12){let n=candidates[0],move=Math.min((vol-n.v)*.22,step*1.4,.16);add(k,-move);add(n.k,move);
   // Water hitting an exposed dirt wall erodes it slowly, opening notches and eventually passages.
   let [nx,ny,nz]=n.a;for(let [dx,dy,dz] of [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]]){let ex=nx+dx,ey=ny+dy,ez=nz+dz,et=get(ex,ey,ez);if(et==='dirt'&&move>.045&&Math.random()<step*.22){remove(ex,ey,ez);falling.push({x:ex,y:ey,z:ez,t:'dirt',vy:0,life:1});break}}
  }
  let evapAmt=Math.min(vol,wx[weather].e*step);add(k,-evapAmt);evap+=evapAmt;
 }
 for(let [k,d] of delta){let v=Math.max(0,Math.min(1,waterAt(...k.split(',').map(Number))+d));if(v<.015)fluids.delete(k);else fluids.set(k,v)}
 // Falling debris animation.
 for(let i=falling.length-1;i>=0;i--){let f=falling[i];f.vy-=step*7;f.y+=f.vy*step;let below=Math.floor(f.y-.15);if(below>=0&&get(f.x,below,f.z)){if(inside(f.x,Math.max(0,below+1),f.z)&&!get(f.x,below+1,f.z))put(f.x,below+1,f.z,f.t);falling.splice(i,1)}else if(f.y<=0){put(f.x,0,f.z,f.t);falling.splice(i,1)}else if(f.life--<0)falling.splice(i,1)}
 if(weather>=3&&Math.random()<step*20){let x=Math.random()*N|0,z=Math.random()*N|0,b=topBlock(x,z);if(b){let k=KEY(x,b.y+1,z);if(!get(x,b.y+1,z))fluids.set(k,Math.min(1,waterAt(x,b.y+1,z)+.12))}}
}
function save(){localStorage.setItem('digflow-voxel-save',JSON.stringify({blocks:[...blocks],fluids:[...fluids],weather,day,hour,evap,drained,harvest}));toast('方塊世界已存檔')}
function load(){try{let s=JSON.parse(localStorage.getItem('digflow-voxel-save'));blocks=new Map(s.blocks);fluids=new Map(s.fluids);weather=s.weather;day=s.day;hour=s.hour;evap=s.evap;drained=s.drained;harvest=s.harvest;ui();draw();toast('讀檔完成')}catch(e){toast('找不到存檔')}}
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,moved:false,button:e.button};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;let dx=e.clientX-drag.px,dy=e.clientY-drag.py;if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>5)drag.moved=true;if(drag.moved){if(drag.button===2){panX+=dx;panY+=dy}else{rot+=dx*.008;panY+=dy*.18}drag.px=e.clientX;drag.py=e.clientY;draw()}});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved)actAt(e.clientX,e.clientY);drag=null});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{scale=Math.max(.55,Math.min(2.2,scale*(e.deltaY>0?.92:1.08)));draw();e.preventDefault()},{passive:false});
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(v=>v.classList.toggle('active',v.dataset.tool===tool));toast('工具：'+b.textContent)}));
document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{speed=+b.dataset.speed;document.querySelectorAll('[data-speed]').forEach(v=>v.classList.toggle('active',v===b))}));
let weatherBtn=document.querySelector('#weatherBtn');if(weatherBtn)weatherBtn.onclick=()=>{weather=(weather+1)%wx.length;ui();draw()};
let pauseBtn=document.querySelector('#pause');if(pauseBtn)pauseBtn.onclick=()=>{paused=!paused;pauseBtn.textContent=paused?'▶':'Ⅱ'};
let tm=document.querySelector('#time');if(tm)tm.oninput=e=>{hour=+e.target.value;ui()};
document.querySelectorAll('#rain,#rain2').forEach(b=>b.onclick=()=>{weather=3;ui();toast('降雨中')});
document.querySelectorAll('#fill,#fill2').forEach(b=>b.onclick=()=>{for(let x=0;x<N;x++)for(let z=0;z<N;z++){let t=topBlock(x,z);if(t)fluids.set(KEY(x,t.y+1,z),Math.min(1,waterAt(x,t.y+1,z)+.12))}draw();toast('地表補水')});
document.querySelectorAll('#save,#save2').forEach(b=>b.onclick=save);document.querySelectorAll('#load,#load2').forEach(b=>b.onclick=load);
let reset=document.querySelector('#reset');if(reset)reset.onclick=()=>{if(confirm('重置方塊世界？'))init()};
let more=document.querySelector('#moreToggle'),moreTools=document.querySelector('#moreTools');if(more&&moreTools)more.onclick=()=>moreTools.classList.toggle('open');
let audio=document.querySelector('#audio');if(audio)audio.onclick=()=>{audioOn=!audioOn;audio.textContent=audioOn?'🔊 音效':'🔇 靜音'};
function tick(now){let dt=Math.min(.1,(now-last)/1000);last=now;if(!paused){hour+=dt*.18*speed;if(hour>=24){hour-=24;day++;weather=Math.random()*wx.length|0;ui()}physics(dt)}ui();draw();requestAnimationFrame(tick)}
init();resize();requestAnimationFrame(tick);
})();