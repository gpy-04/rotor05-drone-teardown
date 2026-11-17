import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire('C:/Users/shangguan/.codex/skills/teardown/package.json'),{chromium}=require('playwright');
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'teardown-out/drone');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=d3d11','--enable-webgl','--ignore-gpu-blocklist','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1500,height:1100}});const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.goto(pathToFileURL(path.join(root,'无人机嵌入示例.html')).href);const frame=page.frames().find(f=>f.parentFrame());await frame.waitForFunction(()=>window.SIM?.ready,{timeout:60000});
await page.locator('[data-action="part"][data-value="motor"]').click();await frame.waitForTimeout(100);assert.equal(await frame.evaluate(()=>window.rotor05.getState().selected),'motor');assert.equal(await frame.evaluate(()=>window.rotor05.getState().cut),true);
assert.equal(await frame.locator('#annotations button:visible').count(),0);
await page.locator('[data-action="explode"]').click();await frame.waitForTimeout(1500);assert((await frame.evaluate(()=>window.rotor05.getState().explosion))>.99);
await page.screenshot({path:path.join(out,'12-real-iframe.png'),fullPage:true});
await page.locator('[data-action="reset"]').click();await frame.waitForTimeout(600);
await frame.locator('#embed').click();const downloading=page.waitForEvent('download');await frame.locator('#download-model').click();const dl=await downloading;await dl.saveAs(path.join(root,'ROTOR05_精细无人机.glb'));await frame.locator('#close-modal').click();
const glb=fs.readFileSync(path.join(root,'ROTOR05_精细无人机.glb'));assert.equal(glb.toString('utf8',0,4),'glTF');assert.equal(glb.readUInt32LE(4),2);assert.equal(glb.readUInt32LE(8),glb.length);const json=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));assert.equal(json.asset.version,'2.0');assert(json.meshes.length>100);assert(json.images.length>0);assert(json.nodes.some(n=>n.scale?.[0]===.001||n.matrix?.[0]===.001));
const capture=await browser.newPage({viewport:{width:1600,height:1000}});await capture.addInitScript(()=>window.__CAPTURE=true);await capture.goto(pathToFileURL(path.join(root,'无人机结构实验室.html')).href);await capture.waitForFunction(()=>window.SIM?.ready,{timeout:60000});
const shots=[];for(const [t,name]of [[0,'整机'],[9,'爆炸拆解'],[14,'电机内部'],[21,'飞控主板'],[26,'扭转桨叶'],[31.9,'回到整机']]){await capture.evaluate(t=>window.SIM.render(t),t);const buf=await capture.screenshot();shots.push({t,name,b64:buf.toString('base64')});fs.writeFileSync(path.join(out,`tour-${String(t).replace('.','_')}.png`),buf)}
const sheet=await browser.newPage({viewport:{width:1600,height:1100}});await sheet.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#dfe5dd;padding:14px;font:13px Arial}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.tile{background:#f4f5f2;padding:8px}.tile img{display:block;width:100%}.tile p{margin:6px 4px 3px;color:#46533f}</style></head><body><div class="grid">${shots.map(s=>`<div class="tile"><img src="data:image/png;base64,${s.b64}"><p>t=${s.t}s · ${s.name}</p></div>`).join('')}</div></body></html>`);await sheet.screenshot({path:path.join(out,'13-tour-review.png'),fullPage:true});
// Validate that each UI viewport fits its frame, and that the complete document works offline.
const sizes=[];for(const [w,h]of [[1200,800],[900,700],[768,700],[390,844],[390,640]]){await capture.setViewportSize({width:w,height:h});await capture.evaluate(()=>window.SIM.render(0));const size=await capture.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('#viewport').getBoundingClientRect().toJSON(),dock:document.querySelector('.control-dock').getBoundingClientRect().toJSON()}));assert(size.canvas.right<=w+.5);assert(size.dock.bottom<=h+.5);assert(size.scroll<=w);sizes.push({w,h,canvasWidth:size.canvas.width});}
const external=requests.filter(s=>/^https?:/.test(s));assert.equal(external.length,0);assert.equal(errors.length,0);
const result={errors,externalRequests:external,iframeMessaging:true,modelExport:{bytes:glb.length,meshes:json.meshes.length,images:json.images.length,nodes:json.nodes.length},responsive:sizes};fs.writeFileSync(path.join(out,'final-validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await browser.close();
