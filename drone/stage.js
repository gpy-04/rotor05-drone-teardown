import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export async function makeStage(canvas,drone,viewport){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0xe9eceb);scene.add(drone.root);
 const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment();const env=pm.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.65;room.dispose();pm.dispose();
 scene.add(new T.HemisphereLight(0xf6fbff,0xa1a4a0,1.4));
 const key=new T.DirectionalLight(0xfff2e0,2.6);key.position.set(-170,320,-90);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-250,right:250,top:250,bottom:-250,near:1,far:850});key.shadow.bias=-.0003;key.shadow.normalBias=.35;scene.add(key);
 const fill=new T.DirectionalLight(0xe0f0ff,1.15);fill.position.set(200,100,80);scene.add(fill);
 const rim=new T.DirectionalLight(0xffffff,1.4);rim.position.set(-120,50,220);scene.add(rim);
 const floor=new T.Mesh(new T.PlaneGeometry(3000,3000),new T.MeshStandardMaterial({color:0xe4e7e5,roughness:.95,metalness:0}));floor.rotation.x=-Math.PI/2;floor.position.y=-14;floor.receiveShadow=true;scene.add(floor);
 // Broad contact shadow keeps the airframe grounded without swallowing detail.
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const grad=ctx.createRadialGradient(64,64,5,64,64,62);grad.addColorStop(0,'rgba(40,49,50,.22)');grad.addColorStop(1,'rgba(40,49,50,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,128,128);const shadow=new T.Mesh(new T.PlaneGeometry(360,280),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-13.85;scene.add(shadow);
 const camera=new T.PerspectiveCamera(34,1,.1,2500);camera.position.set(325,285,-400);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=18;controls.maxDistance=1100;controls.target.set(0,22,0);controls.maxPolarAngle=Math.PI*.92;controls.enablePan=true;
 let free=false,mode='three',rect,goalP=new T.Vector3(),goalT=new T.Vector3(),lastKey='',lastSize='';
 function resize(){rect=viewport.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();lastKey=''}
 function framing(s){
  const id=s.selected,e=s.explosion;const center=drone.anchor(id==='overview'?'fc':id,e);let d=600+e*180;
  if(id==='overview'){center.set(0,22+e*43,0);d=Math.max(545+e*145,650/camera.aspect);}
  else if(id==='motor'){center.set(80*(1+e*.3),s.cut?23:8,-80*(1+e*.3));d=s.cut?124:85;}
  else if(id==='fc'){d=103;center.y=23+48*e;}
  else if(id==='esc'){d=154;center.y=11+20*e;center.z=6;}
  else if(id==='prop'){d=265;center.set(-80*(1+e*.3),20+54*e,-80*(1+e*.3));}
  else if(id==='battery'){center.set(0,56+101*e,8);d=220;}
  else if(id==='camera'){center.set(0,18+15*e,-62-46*e);d=110;}
  else if(id==='frame'){center.set(0,16+e*35,0);d=460+e*90;}
  else if(id==='wires'){center.set(0,18,0);d=470;}
  if(id!=='overview')d=Math.max(d,d*.78/camera.aspect);
  let dir=new T.Vector3(.7,.95,-1).normalize();if(id==='fc'||id==='esc')dir.set(.35,1,-.45).normalize();if(id==='motor')dir.set(.6,.62,-.85).normalize();if(id==='camera')dir.set(.52,.38,-1).normalize();
  if(mode==='top')dir.set(.001,1,-.001);if(mode==='front')dir.set(0,.12,-1).normalize();if(mode==='side')dir.set(1,.14,0).normalize();
  goalT.copy(center);goalP.copy(center).addScaledVector(dir,d);
 }
 const temp=new T.Vector3();
 function frame(s,{snap=false,dt=.016}={}){
  const key=s.selected+':'+s.cut+':'+s.isolate+':'+mode;if(key!==lastKey){free=false;lastKey=key}framing(s);
  if(!free){let blend=snap?1:1-Math.exp(-dt*5.8);camera.position.lerp(goalP,blend);controls.target.lerp(goalT,blend)}
  controls.update();floor.visible=s.selected==='overview'||s.selected==='frame';shadow.visible=floor.visible;renderer.render(scene,camera);
 }
 const ray=new T.Raycaster(),mouse=new T.Vector2();
 function pick(x,y){mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const hits=ray.intersectObject(drone.root,true);const hit=hits.find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent}return true});if(!hit)return null;let o=hit.object;while(o&&!o.userData.part)o=o.parent;return o?.userData.part||null}
 function project(v){temp.copy(v).project(camera);return{x:(temp.x*.5+.5)*rect.width,y:(-temp.y*.5+.5)*rect.height,visible:temp.z<1}}
 function setView(v){mode=v;free=false;lastKey=''}
 return{scene,camera,renderer,controls,resize,frame,pick,project,setView,reset(){mode='three';free=false;lastKey=''},free(){free=true},get rect(){return rect}};
}
