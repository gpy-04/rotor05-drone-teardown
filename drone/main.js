import {runSim} from 'teardown-kit/runtime.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {makeDrone} from './model.js';
import {makeStage} from './stage.js';
import {makeUI} from './console.js';
import {PARTS,tour,clamp} from './data.js';

document.documentElement.lang='zh-CN';
const query=new URLSearchParams(location.search);if(query.has('embed'))document.body.classList.add('embedded');
const meta=document.createElement('meta');meta.name='description';meta.content='精细五寸四旋翼无人机：碳纤维机架、12槽14极无刷电机、飞控PCB、三相线路与扭转翼型螺旋桨，可交互拆解、独立嵌入网站。';document.head.append(meta);
const icon=document.createElement('link');icon.rel='icon';icon.href='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#f0f2ed"/><path d="m18 18 28 28m0-28L18 46" stroke="#a95532" stroke-width="6"/><g fill="none" stroke="#354541" stroke-width="3"><circle cx="16" cy="16" r="11"/><circle cx="48" cy="16" r="11"/><circle cx="16" cy="48" r="11"/><circle cx="48" cy="48" r="11"/></g></svg>');document.head.append(icon);

runSim({duration:32,fps:60,theme:'light',accent:'#ae5732',hud:{enabled:false,title:'ROTOR / 05',subtitle:'无人机结构实验室'},director:{enabled:false}},async({canvas,capture})=>{
 const app=document.getElementById('app'),drone=makeDrone();
 const sourceAudit=drone.audit(),bladeTopology=bladeAudit(drone);const batchedParts=drone.compact();
 let selected='overview',explosion=0,targetExplosion=0,cut=false,isolate=false,labels=true,throttle=0,phase=0,guided=query.has('autotour'),tourTime=0,idle=0,chapter='',stage,ui;
 let lastNow=performance.now(),lastUI=0,dirty=true,down={x:0,y:0,t:0},exporting=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function interact(){guided=false;idle=0;dirty=true}
 function select(id){if(!PARTS.some(p=>p.id===id))return;interact();selected=id;targetExplosion=0;explosion=0;cut=id==='motor';isolate=!['overview','frame','wires'].includes(id);if(id==='wires')cut=true;stage?.reset();if(innerWidth<=900)ui?.ui.querySelector(`[data-part="${id}"]`)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'nearest',inline:'center'})}
 function reset(){interact();selected='overview';targetExplosion=0;cut=false;isolate=false;throttle=0;phase=0;stage.reset();ui.ui.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('on',b.dataset.view==='three'))}
 function snapshot(){return{selected,explosion,cut,isolate,labels,throttle,phase,rpm:Math.round(throttle*18000),guided,chapter}}
 async function exportGLB(returnBuffer=false){
  if(exporting)return;exporting=true;ui.toast('正在打包精细三维模型…');
  try{const current=snapshot();drone.update({selected:'overview',explosion:0,cut:false,isolate:false,phase:0});drone.root.updateMatrixWorld(true);const copy=drone.root.clone(true);copy.scale.setScalar(.001);copy.userData.units='metres';drone.update(current);const data=await new GLTFExporter().parseAsync(copy,{binary:true,onlyVisible:true,maxTextureSize:1024});if(returnBuffer)return Array.from(new Uint8Array(data));const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='ROTOR05_精细无人机.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);ui.toast('模型已导出，可导入 Blender 等三维软件')}catch(err){console.error(err);ui.toast('导出失败，请重新尝试')}finally{exporting=false}
 }
 ui=makeUI(app,{
  interact,select,reset,
  view(v){interact();stage.setView(v)},
  cut(){interact();cut=!cut;if(selected==='overview'&&cut)ui.toast('已移除顶板、电池与桨叶，露出电子舱');stage.reset()},
  isolate(){interact();if(selected==='overview'){ui.toast('先选择一个部件，再单独查看');return}isolate=!isolate;stage.reset()},
  labels(){interact();labels=!labels},
  explode(v){interact();targetExplosion=v;if(selected!=='overview'){selected='overview';isolate=false;cut=false;stage.reset()}},
  throttle(v){interact();throttle=v},
  tour(){if(guided){interact();return}interact();guided=true;tourTime=0;isolate=false;stage.reset()},
  download(){exportGLB()}
 });
 stage=await makeStage(canvas,drone,ui.viewport);stage.resize();
 if(query.has('part'))select(query.get('part'));
 const buttons={};for(const p of PARTS.filter(p=>p.id!=='overview')){const b=document.createElement('button');b.className='annotation';b.textContent=p.name;b.dataset.label=p.id;b.setAttribute('aria-label','查看'+p.name);b.onclick=()=>select(p.id);ui.$('#annotations').append(b);buttons[p.id]=b}
 canvas.addEventListener('pointerdown',e=>{interact();down={x:e.clientX,y:e.clientY,t:performance.now()};stage.free()});
 canvas.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)<4&&performance.now()-down.t<400){const id=stage.pick(e.clientX,e.clientY);if(id)select(id)}});
 canvas.addEventListener('wheel',()=>{interact();stage.free()},{passive:true});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('dblclick',reset);
 ui.ui.addEventListener('pointerdown',e=>{if(e.target.closest('button,input,a'))idle=0});
 addEventListener('keydown',e=>{if(e.target.matches('input,textarea,button')||ui.$('#embed-modal').open)return;if(e.key.toLowerCase()==='r')reset();if(e.key.toLowerCase()==='e'){interact();targetExplosion=targetExplosion>.5?0:1;selected='overview';isolate=false;cut=false;stage.reset()}});
 // Cross-origin embeds accept only parent-window messages and a bounded action vocabulary.
 // Optional ?parentOrigin=https://example.com pins the parent origin.
 addEventListener('message',e=>{if(e.source!==parent)return;const allowed=query.get('parentOrigin');if(allowed&&e.origin!==allowed)return;const m=e.data;if(!m||m.type!=='rotor05')return;if(m.action==='part'&&typeof m.value==='string')select(m.value);if(m.action==='reset')reset();if(m.action==='explode'&&typeof m.value==='number'&&Number.isFinite(m.value)){interact();targetExplosion=clamp(m.value);selected='overview';isolate=false;cut=false;stage.reset()}if(m.action==='throttle'&&typeof m.value==='number'&&Number.isFinite(m.value)){interact();throttle=clamp(m.value)}if(m.action==='view'&&['three','top','front','side'].includes(m.value)){interact();stage.setView(m.value)}});
 const resize=new ResizeObserver(()=>{stage.resize();dirty=true});resize.observe(ui.viewport);
 function setTour(t){const state=tour(t);selected=state.selected;explosion=state.explosion;targetExplosion=explosion;cut=state.cut;throttle=state.throttle;chapter=state.label;isolate=['motor','fc','prop'].includes(selected);phase=state.throttle*t*7;}
 function annotations(s){for(const [id,b]of Object.entries(buttons)){if(!s.labels||s.selected!=='overview'||s.guided&&s.selected!=='overview'||s.cut&&['battery','prop'].includes(id)){b.hidden=true;continue}const p=stage.project(drone.anchor(id,s.explosion));const offsets={frame:[-38,17],motor:[10,-8],fc:[12,-13],esc:[-69,18],wires:[9,5],prop:[-12,-30],battery:[14,-18],camera:[11,13]}[id];let x=p.x+offsets[0],y=p.y+offsets[1];b.hidden=!p.visible||x<12||x>stage.rect.width-94||y<145||y>stage.rect.height-95;b.style.left=x+'px';b.style.top=y+'px';}}
 function draw(s,snap=false,dt=.016){drone.update(s);stage.frame(s,{snap,dt});annotations(s);return s}
 window.rotor05={
  ready:true,getState:()=>snapshot(),select,
  audit:()=>({...drone.audit(),sourceMeshes:sourceAudit.meshes,batchedParts,drawCalls:stage.renderer.info.render.calls,renderedTriangles:stage.renderer.info.render.triangles,viewport:[stage.rect.width,stage.rect.height],gpu:stage.renderer.getContext().getParameter(stage.renderer.getContext().RENDERER)}),
  seek(t){guided=true;tourTime=clamp(t,0,31.999);setTour(tourTime);ui.update(snapshot());return draw(snapshot(),true)},
  setState(input){interact();if(input.selected)select(input.selected);if(typeof input.explosion==='number')explosion=targetExplosion=clamp(input.explosion);if(typeof input.cut==='boolean')cut=input.cut;if(typeof input.isolate==='boolean')isolate=input.isolate;if(typeof input.throttle==='number')throttle=clamp(input.throttle);if(typeof input.labels==='boolean')labels=input.labels;ui.update(snapshot());return draw(snapshot(),true)},
  view(v){stage.setView(v);draw(snapshot(),true)},
  exportGLB,
  geometryAudit(){return bladeTopology},
 };
 ui.update(snapshot());draw(snapshot(),true);
 return{
  warm:()=>stage.renderer.compileAsync(stage.scene,stage.camera),resize:()=>stage.resize(),
  render(t){const now=performance.now(),dt=Math.min(.05,(now-lastNow)/1000);lastNow=now;
   if(capture){guided=true;setTour(t)}else if(guided){tourTime=(tourTime+dt)%32;setTour(tourTime)}else{idle+=dt;explosion+=(targetExplosion-explosion)*(reduced?1:1-Math.exp(-dt*5));if(Math.abs(explosion-targetExplosion)<.001)explosion=targetExplosion;phase+=dt*throttle*9;if(idle>25&&!reduced&&!ui.$('#embed-modal').open){guided=true;tourTime=0}}
   const s=snapshot();draw(s,capture,dt);if(dirty||capture||now-lastUI>100){ui.update(s);dirty=false;lastUI=now}return{};
  }
 };
}).catch(e=>{console.error(e);const out=document.createElement('div');out.style='position:fixed;inset:0;display:grid;place-content:center;background:#f4f5f2;padding:32px;font:15px Microsoft YaHei;z-index:99';out.innerHTML='<h1>无人机结构实验室</h1><p style="margin-top:20px">三维显示暂时未能启动。请用开启硬件加速的 Chrome 或 Edge 打开本文件。</p>';document.body.append(out)});

function bladeAudit(drone){const results=[];drone.root.traverse(o=>{if(!o.isMesh||!o.name.startsWith('twisted_airfoil'))return;const g=o.geometry,p=g.attributes.position,idx=g.index.array;let volume=0,minArea=Infinity,edges=new Map();for(let i=0;i<idx.length;i+=3){const ids=[idx[i],idx[i+1],idx[i+2]],a=ids.map(j=>[p.getX(j),p.getY(j),p.getZ(j)]),[u,v,w]=a;const cross=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]];volume+=(u[0]*cross[0]+u[1]*cross[1]+u[2]*cross[2])/6;const ab=v.map((x,k)=>x-u[k]),ac=w.map((x,k)=>x-u[k]);minArea=Math.min(minArea,Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])/2);for(let j=0;j<3;j++){let aa=ids[j],bb=ids[(j+1)%3],key=[Math.min(aa,bb),Math.max(aa,bb)].join(',');edges.set(key,(edges.get(key)||0)+1)}}results.push({part:o.name,closed:[...edges.values()].every(n=>n===2),volume,minArea})});return results}
