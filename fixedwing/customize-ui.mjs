import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
let ui=fs.readFileSync(path.join(root,'drone/console.js'),'utf8');
const replacements=[
 ["const icons={overview:'◈',frame:'⌗',motor:'◉',fc:'▦',esc:'▤',wires:'⌁',prop:'✣',battery:'▰',camera:'◎'};","const icons={overview:'◇',airframe:'⌗',wing:'⌁',tail:'⌘',motor:'◉',avionics:'▦',battery:'▰',camera:'◎',gear:'⊙'};"],
 ['<span class="brandmark">✣</span><b>ROTOR<span>/05</span></b>','<b>固定翼<span>/ 结构实验室</span></b>'],
 ['<div class="mast-sub">无人机结构实验室<span>INTERACTIVE TEARDOWN</span></div>','<div class="mast-sub">结构与飞行<span>INTERACTIVE AIRCRAFT STUDY</span></div>'],
 ['五寸四旋翼 · 精密部件 · 可交互拆解','双尾撑固定翼 · 素色复合材料 · 可交互拆解'],
 ['五寸四旋翼 · 精密部件 · 可交互拆解','双尾撑固定翼 · 素色复合材料 · 可交互拆解'],
 ['<div class="scene-number">05<span>5-INCH / QUADROTOR</span></div>','<div class="scene-number">2.4<span>METRES / WINGSPAN</span></div>'],
 ['<button id="labels" aria-pressed="true">','<button id="surfaces"><span>⌘</span> 舵面控制</button><button id="labels" aria-pressed="false">'],
 ['00 / 08','00 / 08'],['对转布局<span>M1 ↻ · M2 ↺ · M3 ↻ · M4 ↺</span>','后置推进<span>6S · BRUSHLESS · TWO-BLADE PROP</span>'],
 ['?part=fc','?part=avionics'],["type: 'rotor05'","type: 'fixedwing'"],["value: 'fc'","value: 'avionics'"],
 ['无人机结构实验室.html','固定翼无人机结构实验室.html'],['无人机结构实验室 · 可交互精细模型','固定翼无人机结构实验室 · 无商标模型'],
 ['把飞行，拆开来看。','让结构，解释飞行。']
];
for(const [a,b]of replacements)ui=ui.replaceAll(a,b);
fs.writeFileSync(path.join(import.meta.dirname,'console.js'),ui);
let css=fs.readFileSync(path.join(root,'drone/style.css'),'utf8');
css+='\n:root{--paper:#f2f4f0;--rust:#8c735a;--scene:#e6eae8;--ink:#283832}.brand b{font-size:21px;letter-spacing:.4px}.brand b span{font-size:14px;margin-left:12px}.part-button{height:43px}.scene-head h1{font-size:32px}.model-tools button{padding:9px 9px}.surface-row{display:grid;grid-template-columns:1fr auto;gap:15px;margin:26px 0}.surface-row label{font-size:13px}.surface-row output{font:13px monospace;color:var(--rust)}.surface-row input{grid-column:1/-1;width:100%}#control-modal{max-width:480px}.annotation{font-size:10px}.view-guide{font-size:10px}#scene-sub{font-size:11px}.detail-text{font-size:12px}.side-title{font-size:9px}.inspector-top{font-size:9px}.part-name{font-size:13px}.mast-sub{font-size:11px}.control-dock .slow-note{font-size:9px}.scene-number{font-size:40px;letter-spacing:-1px}button{transition:background .18s,color .18s}@media(max-width:1200px){.mast-sub{display:none}.model-tools button{font-size:9px;padding:8px 7px}.model-tools span{margin-right:3px}.view-guide{font-size:9px}}@media(max-width:560px){.brand b{font-size:18px}.brand b span{font-size:11px;margin-left:7px}.head-actions{gap:13px}.scene-head h1{font-size:23px}.scene-head #scene-sub{font-size:9px}.model-tools{flex-wrap:wrap;width:300px;justify-content:center;bottom:14px;white-space:normal}.model-tools button{padding:7px 8px}.view-guide{bottom:98px;font-size:8px}.scene-number{bottom:106px}.view-controls{top:113px}.control-dock .slow-note{font-size:7px}.annotation{font-size:8px}.part-name{font-size:11px}}\n';
fs.writeFileSync(path.join(import.meta.dirname,'style.css'),css);
