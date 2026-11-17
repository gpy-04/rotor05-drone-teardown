import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export async function makeStage(canvas,aircraft,viewport,low=false){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0xe6eae8);scene.add(aircraft.root);
 const pm=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pm.fromScene(room,.05);scene.environment=env.texture;scene.environmentIntensity=.72;room.dispose();pm.dispose();
 scene.add(new T.HemisphereLight(0xeaf2f8,0xaaa9a0,0.75));const key=new T.DirectionalLight(0xfff4e5,2.2);key.position.set(-2,5,-3);key.castShadow=true;key.shadow.mapSize.setScalar(low?1024:2048);Object.assign(key.shadow.camera,{left:-2.8,right:2.8,top:2.8,bottom:-2.8,near:.1,far:14});key.shadow.bias=-.0002;key.shadow.normalBias=.001;scene.add(key);const fill=new T.DirectionalLight(0xe1effa,1);fill.position.set(3,2,4);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xe0e5e1,roughness:.92}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;scene.add(floor);
 const camera=new T.PerspectiveCamera(33,1,.005,250);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=.10;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.92;controls.target.set(0,.5,.03);camera.position.set(3.8,3,-4.8);
 let free=false,mode='three',rect,lastKey='',goalT=new T.Vector3(),goalP=new T.Vector3();const temp=new T.Vector3();
 function resize(){rect=viewport.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();lastKey='';}
 function frame(s,{snap=false,dt=.016}={}){const k=[s.selected,s.cut,s.isolate,mode].join(':');if(k!==lastKey){free=false;lastKey=k;}const e=s.explosion,id=s.selected;goalT.copy(aircraft.anchor(id,e));if(id==='avionics')goalT.set(0,.40,-.015);let distance={overview:4.8,airframe:5.0,wing:4.0,tail:5.0,motor:s.cut?1.01:.86,avionics:.60,battery:1.0,camera:.40,gear:2.7}[id]||5.9;
  if(id==='overview')goalT.set(0,.53+e*.13,.03+e*.12);if(id==='wing')goalT.set(0,.63+e*.12,-.02);if(id==='tail')goalT.set(0,.64+e*.14,.28+e*.15);
  distance=Math.max(distance*(1+e*.24),distance*.75/camera.aspect);if(id==='overview'&&camera.aspect<.85)distance*=1.14;
  const dir=V(.9,.72,-1.32).normalize();if(id==='motor')dir.set(.42,.35,.92).normalize();if(id==='avionics')dir.set(.4,1,-.65).normalize();if(id==='camera')dir.set(.4,.2,-1).normalize();if(id==='wing')dir.set(.24,1,-.48).normalize();if(id==='gear')dir.set(.9,.35,-1).normalize();
  if(mode==='top')dir.set(.0001,1,-.0001);if(mode==='front')dir.set(0,.13,-1).normalize();if(mode==='side')dir.set(1,.13,0).normalize();goalP.copy(goalT).addScaledVector(dir,distance);
  if(!free){const blend=snap?1:1-Math.exp(-dt*5.8);camera.position.lerp(goalP,blend);controls.target.lerp(goalT,blend);}controls.update();floor.visible=['overview','airframe','gear'].includes(id)&&!s.isolate;renderer.render(scene,camera);
 }
 const ray=new T.Raycaster(),mouse=new T.Vector2();function pick(x,y){mouse.set((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const h=ray.intersectObject(aircraft.root,true).find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});let o=h?.object;while(o&&!o.userData.part)o=o.parent;return o?.userData.part;}
 function project(v){temp.copy(v).project(camera);return {x:(temp.x*.5+.5)*rect.width,y:(-.5*temp.y+.5)*rect.height,visible:temp.z<1&&temp.z>-1};}
 function diagnostic(mode){aircraft.root.traverse(o=>{if(!o.isMesh)return;if(!o.userData.originalMaterial)o.userData.originalMaterial=o.material;if(mode==='normals'){if(!o.userData.normalMaterial)o.userData.normalMaterial=new T.MeshNormalMaterial();o.material=o.userData.normalMaterial;}else{o.material=o.userData.originalMaterial;o.material.wireframe=mode==='wireframe';}});}
 return {scene,camera,renderer,controls,frame,resize,pick,project,diagnostic,get rect(){return rect;},setView(v){mode=v;free=false;lastKey='';},reset(){mode='three';free=false;lastKey='';},free(){free=true;}};
}
const V=(...a)=>new T.Vector3(...a);
