import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const kit='C:/Users/shangguan/.codex/skills/teardown';
execFileSync(process.execPath,[`${kit}/sims/build.mjs`,path.join(root,'drone')],{cwd:root,stdio:'inherit'});
const source=path.join(root,'teardown-out/dist/drone.html');let html=fs.readFileSync(source,'utf8').replace('<html lang="en">','<html lang="zh-CN">').replace('<title>drone</title>','<title>ROTOR / 05 — 无人机结构实验室</title>');
fs.writeFileSync(source,html);fs.writeFileSync(path.join(root,'无人机结构实验室.html'),html);
console.log('Built: '+path.join(root,'无人机结构实验室.html'));
