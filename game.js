(()=>{'use strict';const c=document.querySelector('#world'),ctx=c.getContext('2d');let W,H,dpr=1;const N=17,half=8;let heights=[],water=[],moist=[],objects=[],weather=0,day=1,hour=8,speed=1,paused=false,audioOn=true,harvest=0,evap=0,drained=0,tool='lower',brush=1,scale=1,rot=0,panX=0,panY=15,drag=null,last=performance.now();const wx=[{n:'晴天',i:'☀️',e:.0008,r:0,s:'#9ccbd2'},{n:'酷暑',i:'🔥',e:.002,r:0,s:'#d9bd87'},{n:'陰天',i:'☁️',e:.00015,r:0,s:'#7e9ca7'},{n:'小雨',i:'🌧️',e:.0003,r:.002,s:'#789eac'},{n:'暴雨',i:'🌩️',e:.0002,r:.01,s:'#526f83'}];function ix(x,z){return z*N+x}function ok(x,z){return x>=0&&z>=0&&x<N&&z<N}function init(){heights=[];water=[];moist=[];for(let z=0;z<N;z++)for(let x=0;x<N;x++){heights.push(.3+Math.sin(x*.43)*.25+Math.cos(z*.39)*.22);water.push(0);moist.push(.35)}objects=[];weather=0;day=1;hour=8;harvest=evap=drained=0;scale=1;rot=0;panX=0;panY=15;ui();draw()}function resize(){dpr=Math.min(devicePixelRatio||1,2);W=document.documentElement.clientWidth||innerWidth;H=visualViewport?Math.round(visualViewport.height):innerHeight;c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);draw()}addEventListener('resize',resize);if(visualViewport)visualViewport.addEventListener('resize',resize);function proj(x,z,y=0){let a=x-half,b=z-half,ca=Math.cos(rot),sa=Math.sin(rot),rx=a*ca-b*sa,rz=a*sa+b*ca,u=Math.min(W/(N*1.25),H/(N*.85))*scale;return[W/2+panX+(rx-rz)*u*.5,H*.52+panY+(rx+rz)*u*.25-y*u*.65]}function tile(x,z,y){return[proj(x,z,y),proj(x+1,z,y),proj(x+1,z+1,y),proj(x,z+1,y)]}function poly(p,f,s){ctx.beginPath();ctx.moveTo(...p[0]);p.slice(1).forEach(v=>ctx.lineTo(...v));ctx.closePath();ctx.fillStyle=f;ctx.fill();if(s){ctx.strokeStyle=s;ctx.stroke()}}function draw(){if(!ctx)return;let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,wx[weather].s);g.addColorStop(1,'#d9e3c6');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);let cells=[];for(let z=0;z<N;z++)for(let x=0;x<N;x++)cells.push({x,z});cells.sort((a,b)=>proj(a.x,a.z)[1]-proj(b.x,b.z)[1]);for(let {x,z} of cells){let i=ix(x,z),h=heights[i],p=tile(x,z,h),w=moist[i];
/* Minecraft-inspired biome blocks: grass top, dirt, stone, deep slate */
const topHue=Math.max(0,Math.min(1,(h+1.8)/6));
const grassR=Math.round(75+topHue*28-w*12),grassG=Math.round(145+topHue*30-w*20),grassB=Math.round(54+topHue*12);
poly(p,'rgb('+grassR+','+grassG+','+grassB+')','#355c35');
const depth=1.35,b=tile(x,z,h-depth);
const side1=[p[1],p[2],b[2],b[1]],side2=[p[2],p[3],b[3],b[2]];
function strata(side,topA,topB,bottomA,bottomB,colors){
 const at=(t)=>[topA[0]+(bottomA[0]-topA[0])*t,topA[1]+(bottomA[1]-topA[1])*t];
 const bt=(t)=>[topB[0]+(bottomB[0]-topB[0])*t,topB[1]+(bottomB[1]-topB[1])*t];
 for(let k=0;k<colors.length;k++){const t0=k/colors.length,t1=(k+1)/colors.length;poly([at(t0),bt(t0),bt(t1),at(t1)],colors[k],'#1c2925aa')}
}
strata(side1,p[1],p[2],b[1],b[2],['#81502f','#98613a','#76513a','#777c7d','#4d555b']);
strata(side2,p[2],p[3],b[2],b[3],['#684329','#7b4d31','#5f4634','#60686b','#39434a']);
if(water[i]>.025)poly(tile(x,z,h+Math.min(water[i],.65)),'rgba(47,164,218,.65)','#b9f0ff55')}for(let o of objects){let p=proj(o.x+.5,o.z+.5,heights[ix(o.x,o.z)]+water[ix(o.x,o.z)]);ctx.save();ctx.translate(p[0],p[1]);if(o.type==='source'){ctx.strokeStyle='#d4f9ff';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-24);ctx.stroke();ctx.fillStyle='#60e5ff';ctx.beginPath();ctx.arc(0,-26,5,0,7);ctx.fill()}else if(o.type==='drain'){ctx.fillStyle='#182e3b';ctx.beginPath();ctx.ellipse(0,0,11,5,0,0,7);ctx.fill();ctx.strokeStyle='#8be9d6';ctx.stroke()}else if(o.type==='bridge'){ctx.fillStyle='#9a7045';ctx.fillRect(-22,-7,44,7);for(let k=-2;k<=2;k++)ctx.fillRect(k*8,-9,3,10)}else if(o.type==='alarm'){ctx.fillStyle='#555';ctx.fillRect(-2,-18,4,18);ctx.fillStyle=Math.sin(performance.now()/150)>0?'#ff3b4f':'#7e202b';ctx.beginPath();ctx.arc(0,-20,6,0,7);ctx.fill()}else if(['rice','corn'].includes(o.type)){ctx.strokeStyle='#4d9b43';ctx.lineWidth=2;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(k*3,0);ctx.lineTo(k*4-5,-12-Math.min(10,o.age||0));ctx.stroke()}if(o.age>10){ctx.fillStyle='#e4c34d';ctx.fillRect(4,-19,4,8)}}else if(o.type==='lotus'){ctx.fillStyle='#3b9e65';ctx.beginPath();ctx.ellipse(0,0,12,5,0,0,7);ctx.fill();ctx.fillStyle='#f28ab6';ctx.beginPath();ctx.arc(0,-7,7,0,7);ctx.fill()}else if(o.type==='willow'){ctx.fillStyle='#795438';ctx.fillRect(-2,-24,4,24);ctx.fillStyle='#4b9348';for(let k=0;k<6;k++){ctx.beginPath();ctx.arc(Math.sin(k*5)*9,-25-(k%3)*6,9,0,7);ctx.fill()}}else if(o.type==='fish'){ctx.fillStyle='#f4a261';ctx.beginPath();ctx.ellipse(Math.sin(performance.now()/400+o.x)*4,0,9,4,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(-15,-4);ctx.lineTo(-15,4);ctx.fill()}ctx.restore()}if(weather>=3){ctx.strokeStyle='#d5f3ff88';for(let k=0;k<(weather===4?100:40);k++){let x=(k*97+performance.now()*.2)%W,y=(k*61+performance.now()*(weather===4?1:.5))%H;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+10);ctx.stroke()}}document.querySelector('#waterVol').textContent=water.reduce((a,b)=>a+b,0).toFixed(1);document.querySelector('#evapVol').textContent=evap.toFixed(1);document.querySelector('#drainVol').textContent=drained.toFixed(1);document.querySelector('#harvest').textContent=harvest;document.querySelector('#moisture').textContent=Math.round(moist.reduce((a,b)=>a+b,0)/moist.length*100)}function toast(s){let e=document.querySelector('#toast');e.textContent=s;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}function tone(f=300){if(!audioOn)return;try{let a=new(window.AudioContext||webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;g.gain.value=.035;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.09);o.stop(a.currentTime+.1);setTimeout(()=>a.close(),250)}catch(e){}}function ui(){document.querySelector('#day').textContent='第 '+day+' 日';let t=String(hour|0).padStart(2,'0')+':'+String(Math.floor(hour%1*60)).padStart(2,'0');document.querySelector('#clock').textContent=t;document.querySelector('#timeLabel').textContent=t;document.querySelector('#time').value=hour;document.querySelector('#weatherBtn').textContent=wx[weather].i+' '+wx[weather].n+' ↻';document.querySelector('#weatherText').textContent=wx[weather].i+' '+wx[weather].n}function cell(px,py){let best=null,bd=1e9;for(let z=0;z<N;z++)for(let x=0;x<N;x++){let p=proj(x+.5,z+.5,heights[ix(x,z)]),d=(p[0]-px)**2+(p[1]-py)**2;if(d<bd){bd=d;best={x,z}}}return bd<Math.min(W,H)**2*.025?best:null}function act(x,z){if(!ok(x,z))return;let list=[];for(let dz=0;dz<brush;dz++)for(let dx=0;dx<brush;dx++){let xx=x+dx-(brush>>1),zz=z+dz-(brush>>1);if(ok(xx,zz))list.push(ix(xx,zz))}if(['lower','raise','level'].includes(tool)){let a=list.reduce((s,i)=>s+heights[i],0)/list.length;for(let i of list){if(tool==='lower')heights[i]=Math.max(-1.2,heights[i]-.22);else if(tool==='raise')heights[i]=Math.min(3.5,heights[i]+.22);else heights[i]+=(a-heights[i])*.65}tone(tool==='lower'?170:260);toast('地形已更新')}else if(tool==='inspect'){let i=ix(x,z);toast('高度 '+heights[i].toFixed(1)+' m｜水深 '+water[i].toFixed(1)+' m')}else if(tool==='remove'){let j=objects.findIndex(o=>Math.hypot(o.x-x,o.z-z)<2);if(j>=0){objects.splice(j,1);toast('已移除物件')}else toast('附近沒有物件')}else{if(tool==='lotus'&&water[ix(x,z)]<.05)return toast('荷花需要水面');if(tool==='fish'&&water[ix(x,z)]<.25)return toast('魚苗需要深水區');objects.push({x,z,type:tool,age:0});tone(430);toast('已放置物件')}draw()}let down=null;c.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,px:e.clientX,py:e.clientY,moved:false,button:e.button};c.setPointerCapture(e.pointerId)});c.addEventListener('pointermove',e=>{if(!down)return;let dx=e.clientX-down.px,dy=e.clientY-down.py;if(Math.abs(e.clientX-down.x)+Math.abs(e.clientY-down.y)>5)down.moved=true;if(down.moved){if(e.buttons===2||down.button===2){panX+=dx;panY+=dy}else{rot+=dx*.008;panY+=dy*.25}down.px=e.clientX;down.py=e.clientY;draw()}});c.addEventListener('pointerup',e=>{if(down&&!down.moved){let p=cell(e.clientX,e.clientY);if(p)act(p.x,p.z)}down=null});c.addEventListener('contextmenu',e=>e.preventDefault());c.addEventListener('wheel',e=>{scale=Math.max(.55,Math.min(2.2,scale*(e.deltaY>0?.92:1.08)));draw();e.preventDefault()},{passive:false});c.addEventListener('touchmove',e=>{if(e.touches.length===2){let dx=e.touches[0].clientX-e.touches[1].clientX;scale=Math.max(.55,Math.min(2.2,scale+dx*.0005));draw()}},{passive:true});document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(v=>v.classList.toggle('active',v===b));toast('工具：'+b.textContent)});document.querySelectorAll('[data-brush]').forEach(b=>b.onclick=()=>{brush=+b.dataset.brush;document.querySelectorAll('[data-brush]').forEach(v=>v.classList.toggle('active',v===b))});document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=+b.dataset.speed;document.querySelectorAll('[data-speed]').forEach(v=>v.classList.toggle('active',v===b))});document.querySelector('#weatherBtn').onclick=()=>{weather=(weather+1)%wx.length;ui();draw()};document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'▶':'Ⅱ'};document.querySelector('#time').oninput=e=>{hour=+e.target.value;ui();draw()};function rain(){for(let k=0;k<45;k++){let i=ix(Math.random()*N|0,Math.random()*N|0);water[i]=Math.min(1.4,water[i]+.12);moist[i]=Math.min(1,moist[i]+.08)}weather=3;ui();draw();toast('降雨完成')}function fill(){water=water.map(v=>Math.min(1.3,v+.12));draw();toast('已補充水量')}function collect(){let n=0;objects=objects.filter(o=>{if(['rice','corn','fish','lotus'].includes(o.type)){n++;return false}return true});harvest+=n;draw();toast('收成 '+n+' 份')}function save(){try{localStorage.setItem('digflow-offline-save',JSON.stringify({heights,water,moist,objects,weather,day,hour,harvest,evap,drained}));toast('已存檔至本機')}catch(e){toast('瀏覽器不允許本機存檔')}}function load(){try{let s=JSON.parse(localStorage.getItem('digflow-offline-save'));if(!s)throw 0;({heights,water,moist,objects,weather,day,hour,harvest,evap,drained}=s);ui();draw();toast('讀檔完成')}catch(e){toast('找不到存檔')}}document.querySelectorAll('#rain,#rain2').forEach(b=>b.onclick=rain);document.querySelectorAll('#fill,#fill2').forEach(b=>b.onclick=fill);document.querySelectorAll('#harvestAll,#harvest2').forEach(b=>b.onclick=collect);document.querySelectorAll('#save,#save2').forEach(b=>b.onclick=save);document.querySelectorAll('#load,#load2').forEach(b=>b.onclick=load);document.querySelector('#reset').onclick=()=>{if(confirm('確定重置地形與進度？'))init()};document.querySelector('#audio').onclick=()=>{audioOn=!audioOn;document.querySelector('#audio').textContent=audioOn?'🔊 音效':'🔇 靜音';tone(500)};document.querySelector('#help').onclick=()=>alert('離線版操作：點地形使用工具；拖曳旋轉，右鍵拖曳平移，滾輪縮放。挖低、填高、整平可改變地形。水源、回收孔、農作物等可放置地面。存檔保存在此瀏覽器本機。');/* Grid-based approximate physics: gravity-driven water, soil slumping, rainfall and erosion. */
function simulatePhysics(dt,w){
 const count=N*N,wd=new Array(count).fill(0),sd=new Array(count).fill(0);
 const step=Math.min(.1,dt)*speed;
 // Rainfall adds water to exposed terrain; heavy rain creates more runoff.
 if(weather===3||weather===4){
  const rainRate=weather===4?.055:.012;
  for(let i=0;i<count;i++){const add=rainRate*step*(.65+Math.random()*.7);wd[i]+=add;moist[i]=Math.min(1,moist[i]+add*.6)}
 }
 // Water flows toward the lowest neighboring water surface. Delta buffers prevent scan-order bias.
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const i=ix(x,z),available=Math.max(0,water[i]+wd[i]);
  if(available<.003)continue;
  const surface=heights[i]+water[i],neighbors=[];
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const xx=x+dx,zz=z+dz;if(!ok(xx,zz))continue;
   const j=ix(xx,zz),other=heights[j]+water[j];
   if(surface>other+.015)neighbors.push({j,drop:surface-other});
  }
  if(neighbors.length){
   neighbors.sort((a,b)=>b.drop-a.drop);
   const n=neighbors[0],transfer=Math.min(Math.max(0,water[i]+wd[i]),step*.9*n.drop,.12);
   wd[i]-=transfer;wd[n.j]+=transfer;
   // Fast water on exposed soil carries a little sediment downhill.
   if(n.drop>.38&&moist[i]>.25&&heights[i]>-1.75){
    const sediment=Math.min(.006*step*n.drop,Math.max(0,heights[i]+1.8));
    sd[i]-=sediment;sd[n.j]+=sediment*.8;
   }
  }
 }
 // Loose soil collapses/slumps when neighboring terrain is too steep.
 // Height differences are relaxed gradually instead of snapping instantly.
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){
  const i=ix(x,z);
  for(const [dx,dz] of [[1,0],[0,1]]){
   const xx=x+dx,zz=z+dz;if(!ok(xx,zz))continue;
   const j=ix(xx,zz),diff=heights[i]-heights[j],limit=.52+(1-moist[i])*.18;
   if(Math.abs(diff)>limit){
    const high=diff>0?i:j,low=diff>0?j:i;
    const excess=Math.abs(diff)-limit;
    const slump=Math.min(excess*.055*step,Math.max(0,heights[high]+1.8),Math.max(0,4.2-heights[low]));
    sd[high]-=slump;sd[low]+=slump;
   }
  }
 }
 for(let i=0;i<count;i++){
  water[i]=Math.max(0,Math.min(1.5,water[i]+wd[i]));
  heights[i]=Math.max(-1.8,Math.min(4.2,heights[i]+sd[i]));
  if(water[i]>.002){
   const willow=objects.some(o=>o.type==='willow'&&Math.hypot(o.x-(i%N),o.z-(i/N|0))<3);
   const evaporated=Math.min(water[i],w.e*step*(willow?.4:1));
   water[i]-=evaporated;evap+=evaporated;
   moist[i]=Math.min(1,Math.max(.08,moist[i]+water[i]*.0008));
  }else moist[i]=Math.max(.08,moist[i]-step*.0002);
 }
}
function tick(now){let dt=Math.min(.1,(now-last)/1000);last=now;if(!paused){hour+=dt*.18*speed;if(hour>=24){hour-=24;day++;weather=Math.random()*wx.length|0;ui()}let w=wx[weather];simulatePhysics(dt,w);for(let o of objects){let i=ix(o.x,o.z);if(o.type==='source')water[i]=Math.min(1.3,water[i]+dt*.12*speed);if(o.type==='drain'){let n=Math.min(water[i],dt*.12*speed);water[i]-=n;drained+=n}if(['rice','corn','fish','lotus'].includes(o.type))o.age+=dt*speed;if(o.type==='alarm'&&water[i]>.6&&Math.random()<.03)tone(850)}}ui();draw();requestAnimationFrame(tick)}
/* Smooth brush interpolation, ground thickness, visible edit preview */
const brushPreview=document.getElementById('brushPreview');
let lastBrushCell=null;
function showBrushPreview(px,py){
 const p=cell(px,py);
 if(!p){brushPreview.style.display='none';return}
 const center=proj(p.x+.5,p.z+.5,heights[ix(p.x,p.z)]);
 const unit=Math.min(W/(N*1.25),H/(N*.85))*scale;
 const size=Math.max(24,unit*brush*.78);
 brushPreview.style.display='block';
 brushPreview.style.left=center[0]+'px';brushPreview.style.top=center[1]+'px';
 brushPreview.style.width=size+'px';brushPreview.style.height=(size*.55)+'px';
 brushPreview.style.borderRadius=brush===1?'50%':'8px';
}
const oldAct=act;
act=function(x,z){
 if(['lower','raise'].includes(tool)){
  const radius=Math.max(0,(brush-1)/2);
  const cx=x,cz=z;
  for(let zz=Math.floor(cz-radius);zz<=Math.ceil(cz+radius);zz++)
   for(let xx=Math.floor(cx-radius);xx<=Math.ceil(cx+radius);xx++){
    if(!ok(xx,zz))continue;
    const d=Math.hypot(xx-cx,zz-cz), maxD=Math.max(.75,brush*.72);
    if(d>maxD)continue;
    const falloff=Math.pow(Math.max(0,1-d/(maxD+.01)),1.35);
    const i=ix(xx,zz),amount=.17*falloff;
    heights[i]=tool==='lower'?Math.max(-1.8,heights[i]-amount):Math.min(4.2,heights[i]+amount);
   }
  tone(tool==='lower'?170:260);toast(tool==='lower'?'已平滑挖低':'已平滑填高');draw();return;
 }
 oldAct(x,z);
};
const originalMove= c.onpointermove;
c.addEventListener('pointermove',e=>showBrushPreview(e.clientX,e.clientY));
c.addEventListener('pointerleave',()=>brushPreview.style.display='none');
const originalPointerDown=down;
c.addEventListener('pointerdown',e=>{lastBrushCell=null});
const dock=document.getElementById('toolDock'), more=document.getElementById('moreTools');
document.getElementById('moreToggle').onclick=()=>more.classList.toggle('open');
dock.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(v=>v.classList.toggle('active',v.dataset.tool===tool));toast('工具：'+b.textContent)});
more.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(v=>v.classList.toggle('active',v.dataset.tool===tool));more.classList.remove('open');toast('工具：'+b.textContent)});

init();resize();requestAnimationFrame(tick)})();
