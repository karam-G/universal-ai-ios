'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const ROOT=__dirname, DATA=path.join(ROOT,'clipstudio-data'), UPLOADS=path.join(DATA,'uploads'), JOBS=path.join(DATA,'jobs'), PROJECTS=path.join(DATA,'projects');
for(const p of [DATA,UPLOADS,JOBS,PROJECTS]) fs.mkdirSync(p,{recursive:true});
const HOST=process.env.CLIPSTUDIO_HOST||'127.0.0.1',PORT=Number(process.env.CLIPSTUDIO_PORT||8792);
const PAIR_CODE=crypto.randomInt(100000,999999).toString(), SESSION_FILE=path.join(DATA,'sessions.json'), children=new Map(), limits=new Map(); let pairCodeUsed=false;
function loadSessions(){try{return new Map(JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')).map(x=>[x.hash,{created:x.created}]))}catch{return new Map()}}
const sessions=loadSessions();
function persistSessions(){const tmp=SESSION_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify([...sessions].map(([hash,s])=>({hash,created:s.created}))));fs.renameSync(tmp,SESSION_FILE)}
function tokenHash(t){return crypto.createHash('sha256').update(t).digest('hex')}
const CLIP_ROOT=process.env.CLIP_ROOT||'C:\\Users\\HP\\GTA6-Clipping';
const PY=process.env.CLIP_PYTHON||path.join(CLIP_ROOT,'.venv','Scripts','python.exe');
const MAX_UPLOAD=8*1024*1024*1024;
function json(res,status,obj){const b=Buffer.from(JSON.stringify(obj));res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':b.length,'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(b);}
function readBody(req,max=1024*1024){return new Promise((resolve,reject)=>{let n=0,chunks=[];req.on('data',c=>{n+=c.length;if(n>max){reject(Object.assign(Error('Request too large'),{status:413}));req.destroy();}else chunks.push(c);});req.on('end',()=>{try{resolve(chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{})}catch{reject(Object.assign(Error('Invalid JSON'),{status:400}))}});req.on('error',reject);});}
function safeName(s){return path.basename(String(s||'video.mp4')).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'video.mp4';}
function save(dir,obj){const tmp=path.join(dir,'.tmp-'+crypto.randomUUID());fs.writeFileSync(tmp,JSON.stringify(obj,null,2));fs.renameSync(tmp,path.join(dir,'record.json'));}
function loadAll(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>{try{return JSON.parse(fs.readFileSync(path.join(dir,x.name,'record.json'),'utf8'))}catch{return null}}).filter(Boolean);}
function auth(req){const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!t)return false;const h=tokenHash(t),s=sessions.get(h);if(!s)return false;if(Date.now()-s.created>30*24*60*60*1000){sessions.delete(h);persistSessions();return false;}return true;}
function updateJob(id,patch){const dir=path.join(JOBS,id),f=path.join(dir,'record.json');if(!fs.existsSync(f))return null;const j=JSON.parse(fs.readFileSync(f,'utf8'));Object.assign(j,patch,{updatedAt:new Date().toISOString()});save(dir,j);if(j.projectId){const pd=path.join(PROJECTS,j.projectId),pf=path.join(pd,'record.json');if(fs.existsSync(pf)){const project=JSON.parse(fs.readFileSync(pf,'utf8'));Object.assign(project,{status:j.status,stage:j.stage,progress:j.progress,updatedAt:j.updatedAt});save(pd,project);}}return j;}
const server=http.createServer(async(req,res)=>{
 const ip=req.socket.remoteAddress||'unknown',now=Date.now(),q=limits.get(ip)||{t:now,n:0};if(now-q.t>60000){q.t=now;q.n=0;}if(++q.n>180)return json(res,429,{error:'rate_limited'});limits.set(ip,q);
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 if(req.method==='GET'&&p==='/health')return json(res,200,{ok:true,service:'aion-clip-studio',version:'0.2.0',pairedSessions:sessions.size,capabilities:{localAnalysis:fs.existsSync(PY),ffmpeg:true,upload:true,jobQueue:true,visionModel:'optional-local-ollama',youtubeRawDownload:false}});
 if(req.method==='POST'&&p==='/v1/pair'){try{const b=await readBody(req,4096);if(pairCodeUsed||String(b.code||'')!==PAIR_CODE)return json(res,401,{error:'invalid_pair_code'});pairCodeUsed=true;const token=crypto.randomBytes(32).toString('base64url');sessions.set(tokenHash(token),{created:Date.now()});persistSessions();return json(res,200,{token,expiresInSeconds:2592000,service:'AION Clip Studio'});}catch(e){return json(res,e.status||400,{error:e.message});}}
 if(!auth(req))return json(res,401,{error:'unauthorized'});
 if(req.method==='GET'&&p==='/v1/capabilities')return json(res,200,{ok:true,service:'AION Clip Studio',version:'0.2.0',engine:{python:fs.existsSync(PY),analyzer:fs.existsSync(path.join(CLIP_ROOT,'scripts','analyze_vod.py')),selector:fs.existsSync(path.join(CLIP_ROOT,'scripts','auto_select.py')),renderer:fs.existsSync(path.join(CLIP_ROOT,'scripts','render_pro.py'))},formats:['mp4','mov','mkv','webm'],ratios:['9:16','16:9','1:1','4:5','4:3','3:4'],modes:['universal','gaming','podcast','interview','education'],limits:{maxUploadBytes:MAX_UPLOAD,maxClips:10},sourcePolicy:'Full audiovisual analysis requires an uploaded or otherwise locally accessible authorized media file. A URL alone does not grant raw media access.'});
 if(req.method==='GET'&&p==='/v1/projects')return json(res,200,{projects:loadAll(PROJECTS)});
 if(req.method==='POST'&&p==='/v1/uploads'){
   const id=crypto.randomUUID(),name=safeName(req.headers['x-filename']),ext=path.extname(name).toLowerCase();if(!['.mp4','.mov','.mkv','.webm','.m4v'].includes(ext))return json(res,415,{error:'unsupported_media_type'});
   const dest=path.join(UPLOADS,id+ext);let size=0;const out=fs.createWriteStream(dest,{flags:'wx'});req.on('data',c=>{size+=c.length;if(size>MAX_UPLOAD){req.destroy();out.destroy();}});req.pipe(out);
   out.on('finish',()=>json(res,201,{uploadId:id,filename:name,sizeBytes:size,path:dest}));out.on('error',e=>{fs.rmSync(dest,{force:true});if(!res.headersSent)json(res,500,{error:'upload_failed',message:e.message});});
   return;
 }
 if(req.method==='POST'&&p==='/v1/jobs'){
   try{const b=await readBody(req,16384);if(!b.uploadId)return json(res,400,{error:'uploadId_required'});const upload=fs.readdirSync(UPLOADS).find(n=>n.startsWith(b.uploadId+'.'));if(!upload)return json(res,404,{error:'upload_not_found'});
    if(b.rightsConfirmed!==true)return json(res,403,{error:'rights_confirmation_required',message:'Confirm you have the right to process this media.'});
    const id=crypto.randomUUID(),projectId=crypto.randomUUID(),dir=path.join(JOBS,id);fs.mkdirSync(dir,{recursive:true});
    const project={id:projectId,jobId:id,title:String(b.title||path.parse(upload).name).slice(0,100),sourceName:safeName(b.filename||upload),createdAt:new Date().toISOString(),status:'queued'};
    fs.mkdirSync(path.join(PROJECTS,projectId),{recursive:true});save(path.join(PROJECTS,projectId),project);
    const job={id,projectId,uploadId:b.uploadId,status:'queued',stage:'queued',progress:0,message:'Waiting for local processing',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),options:{mode:['universal','gaming','podcast','interview','education'].includes(b.mode)?b.mode:'universal',maxClips:Math.min(10,Math.max(1,Number(b.maxClips)||8)),aspectRatio:['9:16','16:9','1:1','4:5','4:3','3:4'].includes(b.aspectRatio)?b.aspectRatio:'9:16',captionStyle:['gaming','pro','podcast','clean'].includes(b.captionStyle)?b.captionStyle:'pro'}};
    save(dir,job);const source=path.join(UPLOADS,upload),child=spawn(PY,[path.join(ROOT,'clipstudio_pipeline.py'), '--source',source,'--job-dir',dir,'--clip-root',CLIP_ROOT,'--options',JSON.stringify(job.options)],{cwd:CLIP_ROOT,windowsHide:true});
    children.set(id,child);updateJob(id,{status:'processing',stage:'starting',message:'Starting local analysis'});
    let buf='';child.stdout.on('data',d=>{buf+=d.toString();let lines=buf.split(/\r?\n/);buf=lines.pop();for(const line of lines){try{const ev=JSON.parse(line);if(Array.isArray(ev.outputs)){const current=JSON.parse(fs.readFileSync(path.join(JOBS,id,'record.json'),'utf8'));ev.outputs=[...(current.outputs||[]),...ev.outputs];}updateJob(id,ev);}catch{}}});
    child.stderr.on('data',d=>{const msg=d.toString().slice(-1200);updateJob(id,{lastLog:msg});});
    child.on('close',code=>{children.delete(id);if(code===0){updateJob(id,{status:'completed',stage:'completed',progress:100,message:'Clips rendered and technical checks completed'});}else{const j=updateJob(id,{status:code===130?'cancelled':'failed',stage:'failed',message:'Local processing stopped. See error details.',exitCode:code});}});
    return json(res,202,{job,project});
   }catch(e){return json(res,e.status||500,{error:'job_create_failed',message:e.message});}
 }
 const rerender=p.match(/^\/v1\/jobs\/([a-f0-9-]+)\/render$/);if(req.method==='POST'&&rerender){
  try{
   const id=rerender[1],dir=path.join(JOBS,id),recordPath=path.join(dir,'record.json');
   if(!fs.existsSync(recordPath))return json(res,404,{error:'job_not_found'});
   if(children.has(id))return json(res,409,{error:'job_busy',message:'This project is already processing.'});
   const b=await readBody(req,16384);if(!Number.isInteger(Number(b.candidateId)))return json(res,400,{error:'candidate_id_required'});
   const options={aspectRatio:b.aspectRatio||'9:16',captionStyle:b.captionStyle||'pro',hook:String(b.hook||'').slice(0,80),watermark:String(b.watermark||'').slice(0,50),blurBackground:b.blurBackground!==false,soundDesign:b.soundDesign!==false};
   const child=spawn(PY,[path.join(ROOT,'clipstudio_rerender.py'),'--job-dir',dir,'--clip-root',CLIP_ROOT,'--candidate-id',String(Number(b.candidateId)),'--options',JSON.stringify(options)],{cwd:CLIP_ROOT,windowsHide:true});
   children.set(id,child);updateJob(id,{status:'processing',stage:'editing',progress:0,message:'Applying editor adjustments'});
   let buf='';child.stdout.on('data',d=>{buf+=d.toString();let lines=buf.split(/\r?\n/);buf=lines.pop();for(const line of lines){try{const ev=JSON.parse(line);if(Array.isArray(ev.outputs)){const current=JSON.parse(fs.readFileSync(recordPath,'utf8'));ev.outputs=[...(current.outputs||[]),...ev.outputs];}updateJob(id,ev);}catch{}}});
   child.stderr.on('data',d=>updateJob(id,{lastLog:d.toString().slice(-1200)}));
   child.on('close',code=>{children.delete(id);if(code===0)updateJob(id,{status:'completed',stage:'completed',progress:100,message:'Revised clip rendered and checked'});else updateJob(id,{status:'failed',stage:'failed',message:'Re-render failed. Original exports are preserved.',exitCode:code});});
   return json(res,202,{ok:true,jobId:id,status:'processing'});
  }catch(e){return json(res,e.status||500,{error:'rerender_failed',message:e.message});}
 }
 const jm=p.match(/^\/v1\/jobs\/([a-f0-9-]+)$/);if(req.method==='GET'&&jm){const f=path.join(JOBS,jm[1],'record.json');if(!fs.existsSync(f))return json(res,404,{error:'job_not_found'});const j=JSON.parse(fs.readFileSync(f,'utf8'));const candidates=path.join(JOBS,jm[1],'candidates.json');if(fs.existsSync(candidates))j.candidates=JSON.parse(fs.readFileSync(candidates,'utf8')).candidates||[];return json(res,200,j);}
 const cancel=p.match(/^\/v1\/jobs\/([a-f0-9-]+)\/cancel$/);if(req.method==='POST'&&cancel){const c=children.get(cancel[1]);if(!c)return json(res,409,{error:'job_not_running'});if(process.platform==='win32')spawn('taskkill',['/PID',String(c.pid),'/T','/F'],{windowsHide:true});else c.kill('SIGTERM');return json(res,202,{ok:true,status:'cancelling'});}
 const file=p.match(/^\/v1\/jobs\/([a-f0-9-]+)\/files\/([a-zA-Z0-9._-]+)$/);if(req.method==='GET'&&file){const dir=path.join(JOBS,file[1],'outputs'),name=safeName(file[2]),f=path.join(dir,name);if(!fs.existsSync(f))return json(res,404,{error:'file_not_found'});res.writeHead(200,{'content-type':name.endsWith('.mp4')?'video/mp4':name.endsWith('.jpg')?'image/jpeg':'application/octet-stream','content-length':fs.statSync(f).size,'accept-ranges':'bytes'});fs.createReadStream(f).pipe(res);return;}
 if(req.method==='DELETE'&&p==='/v1/session'){const t=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(t)sessions.delete(tokenHash(t));persistSessions();return json(res,200,{ok:true});}
 return json(res,404,{error:'not_found'});
});
server.listen(PORT,HOST,()=>{console.log('AION Clip Studio API listening at http://'+HOST+':'+PORT);console.log('One-time iPhone pairing code: '+PAIR_CODE);console.log('Local pipeline: '+(fs.existsSync(PY)?'ready':'missing '+PY));});
server.on('error',e=>{console.error(e);process.exitCode=1;});
