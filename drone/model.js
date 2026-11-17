import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Authoring unit: mm. +Y up, nose toward -Z. Every mating datum lives here.
export const SPEC={wheelbase:226.274,span:160,propRadius:63.5,pitch:109.22,motorDiameter:28,statorDiameter:22,statorHeight:7,mount:30.5,plate:4,cell:6,capacity:1300,kv:1750,poles:14,slots:12};
const V=(x,y,z)=>new T.Vector3(x,y,z), TAU=Math.PI*2;

function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t}
function carbonTexture(){return canvasTexture(256,256,(c)=>{c.fillStyle='#171b1e';c.fillRect(0,0,256,256);for(let j=0;j<16;j++)for(let i=0;i<16;i++){const vertical=((i+j)%4)<2;c.fillStyle=vertical?'#343c41':'#20272c';c.fillRect(i*16,j*16,16,16);for(let k=0;k<6;k++){c.strokeStyle=vertical?'rgba(145,156,162,.17)':'rgba(114,125,132,.16)';c.lineWidth=.7;c.beginPath();if(vertical){c.moveTo(i*16+2+k*2.2,j*16);c.lineTo(i*16+2+k*2.2,j*16+16)}else{c.moveTo(i*16,j*16+2+k*2.2);c.lineTo(i*16+16,j*16+2+k*2.2)}c.stroke()}}})}
const maps={};
function material(color,metalness=0,roughness=.5,extra={}){return new T.MeshStandardMaterial({color,metalness,roughness,...extra})}
export function makeDrone(){
 const root=new T.Group();root.name='ROTOR_05_5inch_quadrotor';root.userData={units:'millimetres',kind:'engineering visual demonstrator',scale:'1:1',seed:507};
 const carbon=carbonTexture();carbon.wrapS=carbon.wrapT=T.RepeatWrapping;carbon.repeat.set(.045,.045);
 const mat={carbon:material(0x939b9e,.3,.48,{map:carbon,bumpMap:carbon,bumpScale:.065}),edge:material(0x171c20,.3,.53),black:material(0x17191c,.08,.56),rubber:material(0x17191b,0,.89),orange:material(0xb55f32,.72,.36),copper:material(0xb55e2d,.78,.31),steel:material(0x8f9da5,.88,.34),darkMetal:material(0x444e55,.82,.4),gold:material(0xb89748,.75,.37),pcb:material(0x0b302b,.16,.6),pcb2:material(0x1c2930,.2,.55),trace:material(0x326253,.18,.64),chip:material(0x13181e,.06,.61),ceramic:material(0xb5a181,.18,.62),solder:material(0xc3cbd1,.85,.28),red:material(0xa62925,0,.62),wire:material(0x22252b,0,.69),yellow:material(0xe5ae2e,0,.48),white:material(0xdce1e0,0,.6),blue:material(0x36586e,.12,.47),prop:new T.MeshPhysicalMaterial({color:0x151e23,metalness:0,roughness:.43,clearcoat:.25,clearcoatRoughness:.34}),glass:new T.MeshPhysicalMaterial({color:0x223c4b,metalness:.65,roughness:.11,clearcoat:1}),led:material(0x43c692,0,.28,{emissive:0x197c4e,emissiveIntensity:.6})};
 Object.entries(mat).forEach(([n,m])=>m.name=n);
 const groups={}, pieces=[], rotors=[], bells=[], motorData=[], links=[], anchors={}, boardStats={};
 function group(id,name,pos=[0,0,0],parent=root){const g=new T.Group();g.name=name;g.userData.part=id;g.position.fromArray(pos);parent.add(g);return g}
 ['frame','motor','fc','esc','wires','prop','battery','camera'].forEach(id=>{groups[id]=group(id,id);anchors[id]=V(0,0,0)});
 function mesh(geo,m,parent,name,pos=[0,0,0]){const o=new T.Mesh(geo,m);o.name=name;o.position.fromArray(pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 const geoCache=new Map();
 function box(p,name,w,h,d,m,x=0,y=0,z=0,r=.35){const key=[w,h,d,r].join(',');if(!geoCache.has(key))geoCache.set(key,new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)));return mesh(geoCache.get(key),m,p,name,[x,y,z])}
 function cyl(p,name,r,h,m,x=0,y=0,z=0,n=32,r2=r){return mesh(new T.CylinderGeometry(r,r2,h,n),m,p,name,[x,y,z])}
 function lathe(p,name,points,m,x=0,y=0,z=0,n=64){return mesh(new T.LatheGeometry(points.map(a=>new T.Vector2(...a)),n),m,p,name,[x,y,z])}
 function annulus(p,name,ro,ri,h,m,x=0,y=0,z=0){return lathe(p,name,[[ri,-h/2],[ro,-h/2],[ro,h/2],[ri,h/2],[ri,-h/2]],m,x,y,z)}
 function tube(p,name,pts,r,m,segments=36,radial=7){const curve=new T.CatmullRomCurve3(pts.map(a=>V(...a)));return mesh(new T.TubeGeometry(curve,segments,r,radial,false),m,p,name)}
 function cable(id,name,pts,r,m){const o=tube(groups[id],name,pts,r,m,Math.max(12,pts.length*7),8);return o}
 function plate(p,name,pts,h,m,y,holes=[]){const s=new T.Shape();s.moveTo(...pts[0]);for(const a of pts.slice(1))s.lineTo(...a);s.closePath();for(const hole of holes){const q=new T.Path();q.absarc(hole[0],hole[1],hole[2],0,TAU,true);s.holes.push(q)}const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:Math.min(.22,h*.12),bevelThickness:Math.min(.15,h*.1),curveSegments:24});g.rotateX(Math.PI/2);g.translate(0,y+h/2,0);return mesh(g,m,p,name)}
 function screw(p,x,y,z,r=1.7,h=1.3){annulus(p,'socket_head_M3',r,r*.48,h,mat.darkMetal,x,y,z);cyl(p,'socket_recess',r*.46,.18,mat.black,x,y-h*.4,z,6)}
 function label(p,name,text,w,h,x,y,z,{bg='#21262b',fg='#e5e7e5',size=34,rotate=0}={}){const tex=canvasTexture(512,Math.round(512*h/w),(c,cw,ch)=>{if(bg){c.fillStyle=bg;c.fillRect(0,0,cw,ch)}c.fillStyle=fg;c.font=`600 ${size}px Arial`;c.textAlign='center';c.textBaseline='middle';const lines=text.split('\n');lines.forEach((s,i)=>c.fillText(s,cw/2,ch/2+(i-(lines.length-1)/2)*size*1.35))});const m=new T.MeshStandardMaterial({map:tex,roughness:.6,transparent:!bg,depthWrite:!!bg});const o=mesh(new T.PlaneGeometry(w,h),m,p,name,[x,y,z]);o.rotation.set(-Math.PI/2,0,rotate);o.castShadow=false;return o}
 function part(g,delta){g.userData.base=g.position.clone();g.userData.explode=V(...delta);pieces.push(g);return g}

 // CNC-cut carbon sandwich. Slots and fastener apertures are actual geometry.
 const lower=[[-21,-71],[21,-71],[25,-54],[25,-26],[30,-14],[30,16],[24,29],[24,62],[17,70],[-17,70],[-24,62],[-24,29],[-30,16],[-30,-14],[-25,-26],[-25,-54]];
 const mounts=[[-18,-45,1.65],[18,-45,1.65],[-18,42,1.65],[18,42,1.65]];
 const bottom=part(group('frame','lower_carbon_plate',[0,0,0],groups.frame),[0,-15,0]);plate(bottom,'4mm_base_CNC',lower,4,mat.carbon,0,mounts);
 const top=part(group('frame','top_carbon_plate',[0,35,0],groups.frame),[0,69,0]);
 const topOutline=[[-19,-64],[19,-64],[22,-49],[22,41],[17,58],[-17,58],[-22,41],[-22,-49]];
 const topHoles=[...mounts,[-8,6,3.5],[8,6,3.5],[-8,-10,3.5],[8,-10,3.5]];
 plate(top,'2mm_top_deck',topOutline,2,mat.carbon,0,topHoles);label(top,'frame_wordmark','R O T O R   /   0 5',31,6,0,1.3,-45,{size:30,bg:null,fg:'#bec5c6'});
 box(top,'battery_anti_slip_pad',33,2.2,65,mat.rubber,0,2.25,8,1);
 for(const [x,z]of mounts){const st=part(group('frame','M3_31mm_standoff',[x,18.5,z],groups.frame),[0,30,0]);cyl(st,'anodized_standoff',2.4,31,mat.orange,0,0,0,6);annulus(st,'thread_bore',2.4,1.2,.5,mat.darkMetal,0,15.5,0);screw(top,x,2.2,z);screw(bottom,x,-3,z)}
 // Four continuous profiled carbon arms with rounded mounting ends.
 const motorXY=[[-80,-80],[80,-80],[80,80],[-80,80]];
 motorXY.forEach(([x,z],i)=>{
  const arm=part(group('frame',`arm_${i+1}`,[0,-4,0],groups.frame),[x*.3,-10,z*.3]);
  const start=V(Math.sign(x)*17,0,Math.sign(z)*16),end=V(x,0,z),dx=end.x-start.x,dz=end.z-start.z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  const a=[];for(let j=0;j<=12;j++){let th=Math.PI*j/12;let ax=dx/len*Math.sin(th)+nx*Math.cos(th),az=dz/len*Math.sin(th)+nz*Math.cos(th);a.push([end.x+ax*11,end.z+az*11])}for(let j=0;j<=12;j++){let th=Math.PI*j/12;let ax=-dx/len*Math.sin(th)-nx*Math.cos(th),az=-dz/len*Math.sin(th)-nz*Math.cos(th);a.push([start.x+ax*7.8,start.z+az*7.8])}
  plate(arm,`arm_${i+1}_5mm_profile`,a,5,mat.carbon,0,[[x,z,2.1],[x-8,z,1.55],[x+8,z,1.55],[x,z-8,1.55],[x,z+8,1.55]]);
  // Soft feet and motor screws below carbon, seated on the same datum.
  box(arm,'TPU_motor_skid',19,4,18,mat.rubber,x,-4,z,2);
  for(const [ox,oz]of [[-8,0],[8,0],[0,-8],[0,8]])screw(arm,x+ox,-3.3,z+oz,1.8,1.2);
 });
 // Electronics stack, supported at 30.5 x 30.5 mm.
 function board(id,name,y,m,delta){const g=part(group(id,name,[0,y,-4],groups[id]),delta);const b=[[-18,-18],[18,-18],[20,-16],[20,16],[18,18],[-18,18],[-20,16],[-20,-16]];plate(g,name+'_FR4',b,1.6,m,0,[[-15.25,-15.25,1.65],[15.25,-15.25,1.65],[-15.25,15.25,1.65],[15.25,15.25,1.65]]);for(const x of [-15.25,15.25])for(const z of [-15.25,15.25])annulus(g,'plated_mount_hole',2.5,1.65,.14,mat.gold,x,.94,z);return g}
 const esc=board('esc','4in1_55A_ESC',8,mat.pcb2,[0,20,0]),fc=board('fc','F405_flight_controller',20,mat.pcb,[0,48,0]);
 for(const x of [-15.25,15.25])for(const z of [-15.25,15.25]){cyl(bottom,'stack_screw_M3',1.5,24,mat.darkMetal,x,10,z-4,12);cyl(esc,'nylon_stack_spacer',2.4,4.4,mat.black,x,3.1,z);cyl(fc,'silicone_FC_grommet',2.8,3.3,mat.rubber,x,-2.1,z);screw(fc,x,2.25,z,2.25,1.35)}
 function trace(g,points,width=.16){const curve=new T.CurvePath();for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(V(points[i-1][0],1.025,points[i-1][1]),V(points[i][0],1.025,points[i][1])));return mesh(new T.TubeGeometry(curve,points.length*2,width/2,4,false),mat.trace,g,'masked_copper_trace')}
 function chip(g,name,x,z,w,d,h=1.3,pins=0){box(g,name,w,h,d,mat.chip,x,1.05+h/2,z,.15);if(pins){for(let side=-1;side<=1;side+=2)for(let i=0;i<pins;i++){const q=(i/(pins-1)-.5)*(w-.7);box(g,'tinned_IC_lead',.22,.22,.8,mat.solder,x+q,1.12,z+side*(d/2+.25),.04);box(g,'tinned_IC_lead',.8,.22,.22,mat.solder,x+side*(w/2+.25),1.12,z+q,.04)}}}
 chip(fc,'STM32F405_LQFP64',-2,-1,9,9,1.4,16);label(fc,'MCU_laser_etch','STM32\nF405',6.8,5.7,-2,2.51,-1,{size:66,bg:null,fg:'#859092'});
 chip(fc,'BMI270_gyro',7.4,-9,3,3,1.1,0);chip(fc,'barometer',-8,8,3.8,3.3,.8);chip(fc,'flash_memory',8,7,4.4,5,1.1,5);
 label(fc,'silkscreen_F405','F405 V4',14,3.4,-2,1.05,13,{size:80,bg:null,fg:'#e6e4c9'});
 for(let i=0;i<20;i++){const side=i%2?1:-1,z=-12+Math.floor(i/2)*2.6;trace(fc,[[side*4.7,z*.35],[side*(7.4+i%3*.3),z*.35],[side*(9+i%3*.3),z],[side*17.4,z]],.13);annulus(fc,'plated_microvia',.34,.17,.09,mat.gold,side*17.4,1.01,z)}
 // A directional arrow is a silkscreen, not floating geometry.
 label(fc,'orientation_arrow','↑ FRONT',10,3.3,0,1.04,-14,{size:74,bg:null,fg:'#eee6c9'});
 for(let i=0;i<46;i++){const x=-12+(i%8)*3.4,z=-11+Math.floor(i/8)*4.4;if(Math.abs(x+2)<6&&Math.abs(z+1)<6||Math.abs(x)>12&&Math.abs(z)>10)continue;const w=i%3?1.5:2.1,d=.72;box(fc,'SMD_0402_resistor',w,.52,d,i%3?mat.chip:mat.ceramic,x,1.18,z,.1);for(const sign of [-1,1])box(fc,'SMD_solder_fillet',.36,.3,.86,mat.solder,x+sign*w*.42,1.09,z,.05);trace(fc,[[x,z+.6],[x+.9,z+1.5],[x+2,z+1.5]])}
 for(let side=-1;side<=1;side+=2)for(let i=0;i<8;i++){const z=-11+i*3.1;cyl(fc,'gold_UART_pad',.75,.15,mat.gold,side*18.6,1,z,16);label(fc,'pad_pin_number',String(i+1),1.7,1.6,side*16.3,1.05,z,{size:110,bg:null,fg:'#f1e8c7'})}
 // Real connector opening: metal U-shaped shield, black tongue and gold pins.
 box(fc,'USB_C_lower_shield',3.8,.4,8.7,mat.steel,-21,1.4,1,.15);box(fc,'USB_C_upper_shield',3.8,.4,8.7,mat.steel,-21,4.2,1,.15);for(const z of [-3.1,5.1])box(fc,'USB_C_shield_side',3.8,2.5,.5,mat.steel,-21,2.8,z,.15);box(fc,'USB_C_tongue',2.7,.5,5.7,mat.black,-21,2.8,1,.15);for(let j=0;j<10;j++)box(fc,'USB_C_contact',2.5,.07,.21,mat.gold,-21.1,3.1,-1.2+j*.48,.02);
 function jst(g,name,x,z,w,n,rot=0){const p=group(g.userData.part,name,[x,2.3,z],g);p.rotation.y=rot;box(p,'JST_base',w,.8,3.3,mat.white,0,-.9,0,.15);box(p,'JST_back',w,2.8,.55,mat.white,0,.1,1.4,.12);for(const side of [-1,1])box(p,'JST_side',.65,2.8,3.4,mat.white,side*(w/2-.3),.1,0,.12);for(let i=0;i<n;i++){box(p,'JST_pin',.3,.3,2.3,mat.gold,(i-(n-1)/2)*1.1,-.2,-.2,.05)}return p}
 jst(fc,'JST_camera',10,-17,6.4,4);jst(fc,'JST_receiver',-10,-17,6.4,4);jst(fc,'ESC_ribbon_socket',0,16.9,10,8);
 cyl(fc,'green_status_LED',.8,.45,mat.led,11,1.3,11,12);
 // ESC: four mirrored power stages, six MOSFETs each with copper/solder terminations.
 for(let quadrant=0;quadrant<4;quadrant++){const sx=quadrant%2?1:-1,sz=quadrant<2?-1:1;for(let k=0;k<6;k++){const x=sx*(4+(k%2)*6),z=sz*(4+Math.floor(k/2)*4);chip(esc,'N_channel_power_MOSFET',x,z,4.8,3,1.1);for(const dz of [-1.6,1.6])for(let pin=0;pin<4;pin++)box(esc,'MOSFET_solder_pin',.5,.28,.7,mat.solder,x-1.5+pin,1.04,z+dz,.06)}chip(esc,'gate_driver',sx*16,sz*6,2.1,4,.9)}
 for(let side=-1;side<=1;side+=2)for(let j=0;j<6;j++){const z=-12+j*4.8;box(esc,'motor_phase_pad',3,.2,3.1,mat.gold,side*18.5,1,z,.25);cyl(esc,'phase_solder_joint',1.1,.65,mat.solder,side*18.5,1.4,z,16)}
 label(esc,'ESC_marking','55A / 6S',17,3.3,0,1.03,0,{size:65,bg:null,fg:'#ddd7bb'});
 // DC bus electrolytic capacitor, visible sleeve and scored aluminium top.
 const cap=group('esc','low_ESR_capacitor',[0,6.3,27],esc);cap.rotation.x=Math.PI/2;cyl(cap,'1000uF_sleeve',5.2,18,mat.black);cyl(cap,'vented_aluminium_top',4.8,.4,mat.steel,0,9.2,0);box(cap,'vent_score',7.2,.1,.18,mat.darkMetal,0,9.45,0,.02);box(cap,'vent_score_cross',.18,.1,7.2,mat.darkMetal,0,9.46,0,.02);
 for(const x of [-2.4,2.4])tube(esc,'capacitor_soldered_lead',[[x,1.1,13],[x,2,16],[x,5.5,18.1]],.42,mat.solder,12,8);
 // 8-wire ribbon follows the mating ports. Separate wire material identities.
 for(let i=0;i<8;i++)cable('wires','FC_ESC_ribbon_'+i,[[-4+i*1.1,10,14],[-4+i*1.1,13,19],[-4+i*1.1,18,19],[-4+i*1.1,22,13]],.35,[mat.red,mat.black,mat.yellow,mat.white][i%4]);

 // 12-slot / 14-pole outrunners, each built from a stator and an independent bell.
 function coilGeometry(){const pts=[];const turns=8;for(let i=0;i<=turns*20;i++){let t=i/(turns*20),a=t*turns*TAU;pts.push(V(6+t*4.1,3.48*Math.cos(a),1.55*Math.sin(a)))}return new T.TubeGeometry(new T.CatmullRomCurve3(pts),turns*20,.28,6,false)}
 const coilGeo=coilGeometry();
 motorXY.forEach(([x,z],i)=>{
  const m=part(group('motor',`M${i+1}_2207_1750KV`,[x,1.3,z],groups.motor),[x*.3,4,z*.3]);
  const fixed=group('motor','stator_12_slot',[0,0,0],m),rot=part(group('motor','rotor_bell_14_pole',[0,0,0],m),[0,25,0]);bells.push(rot);
  lathe(fixed,'machined_motor_base',[[2,-2.8],[10,-2.8],[11,-1.8],[11,0],[10,1],[5,1],[5,3],[2,3],[2,-2.8]],mat.darkMetal);
  cyl(fixed,'stator_lamination_core',5.8,7,mat.darkMetal,0,5.4,0,48);
  for(let tooth=0;tooth<12;tooth++){const a=tooth*TAU/12,slot=group('motor',`stator_tooth_${tooth+1}`,[0,5.4,0],fixed);slot.rotation.y=a;box(slot,'laminated_silicon_steel',5.6,6.6,2.35,mat.darkMetal,8,0,0,.2);box(slot,'tooth_shoe',1.1,6.9,4.2,mat.darkMetal,10.2,0,0,.2);mesh(coilGeo,mat.copper,slot,'8_turn_enamel_copper');}
  cyl(fixed,'bearing_shaft',2.5,22,mat.steel,0,9,0,32);annulus(fixed,'lower_bearing',4.3,2.5,2,mat.steel,0,1.3,0);
  // Hollow bell: annular skirt, six curved spokes and a true central bearing bore.
  lathe(rot,'hollow_rotor_can',[[12.2,1.1],[13.1,1.1],[14,2],[14,12.7],[13.4,13.4],[12.4,13.4],[12.2,12.4],[12.2,1.1]],mat.orange);
  annulus(rot,'bell_bottom_lip',14.1,12.1,1.1,mat.darkMetal,0,1.3,0);
  annulus(rot,'bell_top_perimeter',13.6,11.4,1.6,mat.orange,0,13.4,0);
  annulus(rot,'bell_hub',5.3,2.55,2.2,mat.orange,0,13.6,0);
  for(let j=0;j<6;j++){const a=j*TAU/6,sp=group('motor','ventilated_top_spoke',[0,13.4,0],rot);sp.rotation.y=a;plate(sp,'milled_spoke',[[4,-1.35],[12.2,-2.2],[12.2,1.4],[5,1.5]],1.55,mat.orange,0)}
  for(let j=0;j<14;j++){const a=j*TAU/14,mag=group('motor','neodymium_magnet_'+j,[0,7,0],rot);mag.rotation.y=a;box(mag,'curved_magnet_segment',1.1,8.7,4.3,mat.darkMetal,11.75,0,0,.22)}
  for(let j=0;j<14;j++){const a=j*TAU/14,strip=group('motor','bell_cooling_flute',[0,0,0],rot);strip.rotation.y=a;box(strip,'anodized_milled_edge',.5,8.3,.48,mat.darkMetal,14.03,7.3,0,.16)}
  // Thread crests are small physical rings, matching the M5 prop shaft.
  cyl(rot,'M5_prop_shaft',2.5,12,mat.steel,0,19.8,0,32);for(let j=0;j<9;j++)annulus(rot,'M5_thread_crest',2.68,2.44,.25,mat.steel,0,15.1+j*.82,0);
  const prop=part(group('prop',`propeller_${i+1}_${i%2?'CCW':'CW'}`,[x,18.9,z],groups.prop),[x*.3,54,z*.3]);
  const spinner=group('prop','balanced_propeller',[0,0,0],prop);rotors.push(spinner);
  const dir=i%2?-1:1;
  annulus(spinner,'5mm_bore_polycarbonate_hub',7.2,2.7,5,mat.prop,0,0,0);
  // Airfoil loft: closed NACA-like section, varying chord/sweep and geometric pitch.
  for(let blade=0;blade<3;blade++){const b=mesh(propellerGeometry(dir),mat.prop,spinner,'twisted_airfoil_blade_'+blade);b.rotation.y=blade*TAU/3;}
  annulus(spinner,'prop_washer',4.3,2.7,.8,mat.steel,0,3.1,0);annulus(spinner,'nyloc_M5_nut',4.65,2.5,4.3,mat.darkMetal,0,5.6,0);cyl(spinner,'hex_nut_outer',4.4,3.6,mat.darkMetal,0,5.6,0,6);annulus(spinner,'nylon_locking_insert',3.2,2.5,.5,mat.black,0,7.6,0);
  motorData.push({m,rot,prop,spinner,x,z,dir});
  // Three motor phases route along the top of the arm and enter the stator base.
  for(let k=0;k<3;k++){let side=Math.sign(x),front=Math.sign(z);const pts=[[side*18.5,9.7,front*(5+k*4)],[side*29,4,front*24],[x*.69,1,z*.69+k*2-2],[x*.88,1,z*.88+k*2-2],[x-5*side,-.1,z-4*front+k*1.4]];cable('wires',`M${i+1}_phase_${'ABC'[k]}`,pts,.82,k===1?mat.blue:mat.wire)}
  // Two clamps secure the phase harness; no free-floating wires over an arm.
  for(const u of [.48,.72]){const tie=group('frame','TPU_wire_guide',[x*u,1,z*u],groups.frame);tie.rotation.y=-Math.atan2(z,x);box(tie,'cable_tie_bridge',3.2,1.5,12,mat.black,0,0,0,.6)}
 });
 // LiPo: six rounded pouches, shrink-wrap surround, woven hook-and-loop strap.
 const bat=part(group('battery','6S_1300mAh_LiPo',[0,53,8],groups.battery),[0,101,0]);
 box(bat,'shrink_wrap_shell',36,29,72,mat.black,0,0,0,3);
 for(let i=0;i<6;i++){box(bat,'LiPo_pouch_cell_'+(i+1),35,3.75,69,mat.darkMetal,0,-10.8+i*4.3,0,1.7)}
 for(const z of [-35.5,35.5])box(bat,'heatshrink_end_cap',36.5,28.5,3.3,mat.black,0,0,z,2);
 box(bat,'upper_shrinkwrap_label_base',36.1,1.3,65,mat.black,0,14.1,0,1);
 label(bat,'battery_product_label','ROTOR  /  ENERGY\n1300 mAh    6S\n22.2 V     120 C',31.8,41,0,14.81,-4,{bg:'#d4d9d5',fg:'#20282d',size:30});
 label(bat,'battery_warning_stripe','LiPo  |  28.9 Wh',29,5,0,14.85,23,{bg:'#b96236',fg:'#fff3df',size:49});
 for(const z of [-24,23]){box(bat,'velcro_strap_top',39,1.5,12,mat.rubber,0,16,z,.6);for(const x of [-19,19])box(bat,'velcro_strap_side',1.4,36.5,12,mat.rubber,x,-2,z,.6);box(bat,'velcro_strap_under_deck',39,1.4,12,mat.rubber,0,-19.7,z,.6);box(bat,'strap_buckle',3.5,4,14,mat.darkMetal,20,15,z,.8);label(bat,'woven_strap_wordmark','ROTOR',23,4,0,16.8,z,{size:65,bg:null,fg:'#b3b6b3'})}
 // XT60 has recessed sockets and pins inside, plus two silicone power leads.
 const xt=group('wires','XT60_power_connector',[30,26,44],groups.wires);box(xt,'XT60_female_body',14,7.6,11.5,mat.yellow,0,0,0,1.1);for(const x of [-3.3,3.3]){const socket=annulus(xt,'recessed_gold_socket',2.2,1.45,4,mat.gold,x,0,5.1);socket.rotation.x=Math.PI/2;const hole=cyl(xt,'socket_cavity',1.4,.2,mat.black,x,0,3.2);hole.rotation.x=Math.PI/2}
 cable('wires','positive_12AWG',[[18,9,12],[27,10,23],[37,17,37],[33,26,39]],1.6,mat.red);
 cable('wires','negative_12AWG',[[13,9,14],[22,10,30],[27,18,38],[27,26,39]],1.6,mat.wire);
 cable('wires','battery_positive_pigtail',[[10,54,44],[22,48,55],[39,37,54],[33,26,50]],1.6,mat.red);
 cable('wires','battery_negative_pigtail',[[6,54,44],[15,44,58],[29,35,54],[27,26,50]],1.6,mat.wire);
 // Nose camera: bevelled aluminium shell, concentric optical barrel, glass.
 const cam=part(group('camera','FPV_camera_19mm',[0,17,-58],groups.camera),[0,15,-46]);
 box(cam,'CNC_camera_housing',19,18,16,mat.darkMetal,0,0,0,2.1);
 for(const side of [-1,1]){box(cam,'TPU_tilt_mount',3,23,20,mat.rubber,side*12.3,-.5,0,1.4);const s=cyl(cam,'tilt_adjustment_M2',2.1,1.3,mat.steel,side*14.1,0,-1,24);s.rotation.z=Math.PI/2}
 const lens=group('camera','wide_angle_lens',[0,0,-10],cam);lens.rotation.x=-Math.PI/2;
 lathe(lens,'focus_barrel',[[0,-3],[6.8,-3],[6.8,0],[7.5,0],[7.5,4],[6.2,4],[6.2,5.2],[0,5.2]],mat.black,0,0,0,64);
 annulus(lens,'lens_retaining_ring',6.4,5.3,.8,mat.darkMetal,0,5.5,0);const glass=cyl(lens,'coated_optical_glass',5.3,.3,mat.glass,0,5.7,0,64);
 for(let j=0;j<24;j++){const a=j*TAU/24;const f=box(lens,'focus_knurl',.3,3.2,.6,mat.darkMetal,7.46*Math.cos(a),1.7,7.46*Math.sin(a),.1);f.rotation.y=-a}
 for(let i=0;i<3;i++)cable('wires','camera_AV_wire_'+i,[[9+i*.8,22,-21],[12+i*.8,18,-35],[8+i*.8,19,-46],[5+i*.8,19,-51]],.48,[mat.red,mat.yellow,mat.wire][i]);
 // Rear receiver + sleeved antennas, connector and strain relief.
 const rx=part(group('camera','ELRS_receiver',[0,13,51],groups.camera),[0,12,26]);box(rx,'receiver_PCB',17,1.5,13,mat.pcb,0,0,0,.5);chip(rx,'ELRS_receiver_IC',0,0,5,5,1,6);for(const side of [-1,1]){cable('wires','receiver_antenna_coax',[[side*7,15,52],[side*13,24,62],[side*24,40,69]],.55,mat.wire);tube(rx,'antenna_T_dipole',[[side*15,27,18],[side*24,27,18],[side*33,27,18]],1.15,mat.black,8,8)}
 // Assembly metadata used by selection, labels and export.
 anchors.frame.set(-28,1,-26);anchors.motor.set(80,11,-80);anchors.fc.set(0,23,-4);anchors.esc.set(0,9,-4);anchors.wires.set(37,23,40);anchors.prop.set(-80,19,-80);anchors.battery.set(0,69,8);anchors.camera.set(0,18,-75);
 let oldCut=false;
 function update(s){const e=s.explosion||0;for(const g of pieces){g.position.copy(g.userData.base).addScaledVector(g.userData.explode,e)}for(const [id,g]of Object.entries(groups))g.visible=!s.isolate||s.selected===id;
  const motorOnly=s.selected==='motor'&&s.cut;for(const d of motorData){d.m.visible=!s.isolate||s.selected!=='motor'||d===motorData[1];d.prop.visible=!s.isolate||s.selected!=='prop'||d===motorData[0];d.rot.visible=!motorOnly||d===motorData[1];if(motorOnly&&d===motorData[1])d.rot.position.y+=19;d.spinner.rotation.y=d.dir*s.phase;d.rot.rotation.y=d.dir*s.phase;}
  if(s.cut&&!s.isolate){top.visible=false;bat.visible=false;groups.prop.visible=false;}else{top.visible=!s.isolate||s.selected==='frame';bat.visible=!s.isolate||s.selected==='battery';}
  rx.visible=!(s.isolate&&s.selected==='camera');
  oldCut=s.cut;
 }
 function anchor(id,e=0){const a=anchors[id].clone();if(id==='motor'||id==='prop'){a.x*=1+e*.3;a.z*=1+e*.3;}a.y+=({frame:0,motor:4,fc:48,esc:20,wires:0,prop:54,battery:101,camera:15}[id]||0)*e;if(id==='camera')a.z-=46*e;return a}
 function audit(){let meshes=0,triangles=0,invalid=0,materials=new Set();root.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry.attributes.position;for(let i=0;i<a.array.length;i++)if(!Number.isFinite(a.array[i]))invalid++;triangles+=(o.geometry.index?o.geometry.index.count:a.count)/3;materials.add(o.material.name||o.material.uuid)}});return{meshes,triangles,invalid,materials:materials.size,motors:4,coils:48,magnetSegments:56,blades:12,boardMount:SPEC.mount,propDiameter:SPEC.propRadius*2,rotorClearance:SPEC.span-SPEC.propRadius*2,motorPhaseWires:12,pieces:pieces.length}}
 // Batch static surfaces inside each independent moving assembly. Source names
 // survive in semanticParts; animation boundaries and texture identities survive.
 function compact(){root.updateMatrixWorld(true);const nodes=[...Object.values(groups),...pieces,...rotors],boundary=new Set(nodes);let merged=0;
  for(const node of nodes){const byMat=new Map(),inv=new T.Matrix4().copy(node.matrixWorld).invert();function walk(o){for(const ch of o.children){if(boundary.has(ch))continue;if(ch.isMesh){const key=ch.material.uuid;if(!byMat.has(key))byMat.set(key,[]);byMat.get(key).push(ch)}else walk(ch)}}walk(node);
   for(const list of byMat.values()){if(list.length<2)continue;const geometries=[];for(const o of list){let g=o.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);geometries.push(g)}const geo=mergeGeometries(geometries,false);if(!geo)continue;const o=new T.Mesh(geo,list[0].material);o.name=node.name+'_'+(o.material.name||'printed_detail');o.castShadow=true;o.receiveShadow=true;o.userData.semanticParts=list.map(x=>x.name);node.add(o);for(const ch of list)ch.removeFromParent();for(const g of geometries)g.dispose();merged+=list.length-1;}
  }return merged;
 }
 return{root,groups,pieces,mat,motorData,update,anchor,audit,compact,SPEC};
}

// A single watertight loft per blade. Ring seams share indices; capped ends.
function propellerGeometry(dir){
 const p=[],ix=[],rings=42,section=36;
 for(let i=0;i<rings;i++){const t=i/(rings-1),r=6+t*57.5;let chord=(7+15*Math.sin(Math.pow(t,.65)*Math.PI*.88))*(1-.91*Math.pow(t,14));chord=Math.max(chord,1.15);const pitch=Math.atan(SPEC.pitch/(TAU*Math.max(r,10)))*dir;const sweep=dir*(1.5+6.8*t*t);const thick=.115-.05*t;
  for(let j=0;j<section;j++){const a=TAU*j/section,u=(1-Math.cos(a))*.5;const yt=5*thick*(.2969*Math.sqrt(Math.max(u,0))-.126*u-.3516*u*u+.2843*u*u*u-.1036*u*u*u*u);const camber=.025*Math.sin(Math.PI*u);const x=(u-.28)*chord,z=(j<section/2?yt:-yt)*chord+camber*chord;const yy=x*Math.sin(pitch)+z*Math.cos(pitch);const zz=x*Math.cos(pitch)-z*Math.sin(pitch);p.push(r,yy,sweep+zz);}
 }
 for(let i=0;i<rings-1;i++)for(let j=0;j<section;j++){let a=i*section+j,b=i*section+(j+1)%section,c=(i+1)*section+(j+1)%section,d=(i+1)*section+j;ix.push(a,b,d,b,c,d)}
 for(const end of [0,rings-1]){let idx=p.length/3,center=[0,0,0];for(let j=0;j<section;j++)for(let k=0;k<3;k++)center[k]+=p[(end*section+j)*3+k]/section;p.push(...center);for(let j=0;j<section;j++){let a=end*section+j,b=end*section+(j+1)%section;if(end===0)ix.push(idx,b,a);else ix.push(idx,a,b)}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
}
