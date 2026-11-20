#!/usr/bin/env python3
import argparse,csv,json,subprocess,sys,shutil
from pathlib import Path
def emit(**kw): print(json.dumps(kw,ensure_ascii=False),flush=True)
def run(cmd,cwd=None):
 p=subprocess.run(cmd,cwd=cwd,text=True,capture_output=True)
 if p.stdout: 
  for line in p.stdout.splitlines():
   try:
    x=json.loads(line)
    if isinstance(x,dict): emit(**x)
   except: pass
 if p.returncode: raise RuntimeError((p.stderr or p.stdout or 'Command failed')[-5000:])
 return p
def main():
 a=argparse.ArgumentParser();a.add_argument('--source',required=True);a.add_argument('--job-dir',required=True);a.add_argument('--clip-root',required=True);a.add_argument('--options',required=True);x=a.parse_args()
 src=Path(x.source).resolve();job=Path(x.job_dir).resolve();root=Path(x.clip_root).resolve();scripts=root/'scripts';out=job/'outputs';out.mkdir(parents=True,exist_ok=True);o=json.loads(x.options)
 if not src.is_file(): raise RuntimeError('Uploaded source file is missing')
 if shutil.which('ffprobe') is None: raise RuntimeError('FFprobe is not installed')
 analysis=job/'analysis';analysis.mkdir(exist_ok=True);py=sys.executable
 emit(stage='probing',progress=3,message='Checking video and audio streams')
 probe=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(src)],capture_output=True,text=True,check=True);info=json.loads(probe.stdout)
 duration=float(info.get('format',{}).get('duration',0))
 if duration<=0 or not any(s.get('codec_type')=='video' for s in info.get('streams',[])):raise RuntimeError('The file has no readable video stream')
 emit(stage='analysis',progress=8,message='Transcribing speech and analysing visual/audio activity')
 run([py,str(scripts/'analyze_vod.py'),str(src),'--model','tiny.en','--clip-seconds','35','--top','40','--output',str(analysis)])
 emit(stage='ranking',progress=55,message='Ranking non-overlapping highlights for '+o['mode'])
 run([py,str(scripts/'review_candidates.py'),str(analysis),'--max','40'])
 run([py,str(scripts/'auto_select.py'),str(analysis),'--max-clips',str(o['maxClips']),'--mode',o['mode']])
 report=json.loads((analysis/'auto_selection_report.json').read_text(encoding='utf-8-sig'));ids=report['selected_candidate_ids']
 if not ids:raise RuntimeError('No candidates passed the quality gates')
 emit(stage='editing',progress=65,message='Building captions, vertical framing and audio polish')
 run([py,str(scripts/'render_pro.py'),str(analysis),'--ids',','.join(map(str,ids)),'--aspect-ratio',o['aspectRatio'],'--caption-style',o['captionStyle'],'--suffix','aion_'+job.name[:8],'--encoder','h264_qsv'])
 clipdir=root/'clips'/src.stem;outputs=[]
 for cid in ids:
  base=f'{src.stem}_aion_{job.name[:8]}_{int(cid):02d}'
  video=clipdir/(base+'.mp4');thumb=clipdir/(base+'.jpg')
  if not video.exists():continue
  emit(stage='quality_check',progress=80+int(15*len(outputs)/max(1,len(ids))),message='Running full export checks: '+video.name)
  qc=job/'outputs'/(base+'.qc.json')
  run([py,str(scripts/'quality_check.py'),str(video),'--aspect-ratio',o['aspectRatio'],'--json-out',str(qc)])
  shutil.copy2(video,out/video.name)
  if thumb.exists():shutil.copy2(thumb,out/thumb.name)
  outputs.append({'candidateId':cid,'video':video.name,'thumbnail':thumb.name if thumb.exists() else None,'start':next((c['start'] for c in report['selected'] if c['id']==cid),None),'end':next((c['end'] for c in report['selected'] if c['id']==cid),None),'score':next((c['combined_score'] for c in report['selected'] if c['id']==cid),None),'qc':json.loads(qc.read_text(encoding='utf-8-sig'))})
 (job/'candidates.json').write_text(json.dumps({'source':src.name,'durationSeconds':duration,'candidates':report['selected'],'rejected':report['rejected'],'note':report['note']},ensure_ascii=False,indent=2),encoding='utf-8')
 (job/'outputs.json').write_text(json.dumps(outputs,ensure_ascii=False,indent=2),encoding='utf-8')
 emit(stage='packaging',progress=98,message='Preparing previews and delivery manifest',outputs=outputs,candidateCount=len(ids),durationSeconds=duration)
 emit(stage='completed',progress=100,message=f'{len(outputs)} clips rendered and checked',outputs=outputs,candidateCount=len(ids),durationSeconds=duration)
if __name__=='__main__':
 try:main()
 except Exception as e:
  emit(stage='failed',progress=0,status='failed',message=str(e))
  print(str(e),file=sys.stderr);sys.exit(1)
