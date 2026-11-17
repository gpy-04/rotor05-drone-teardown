import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const files=new Map([['/','固定翼无人机结构实验室.html'],['/固定翼无人机结构实验室.html','固定翼无人机结构实验室.html'],['/embed','固定翼无人机嵌入示例.html']]);
http.createServer((req,res)=>{let route;try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}const file=files.get(route);if(!file){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(fs.readFileSync(path.join(root,file)));}).listen(8768,'127.0.0.1',()=>console.log('Fixed-wing preview: http://127.0.0.1:8768'));
