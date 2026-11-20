#!/usr/bin/env python3
"""Re-render one approved AI-selected clip with native editor settings."""
import argparse,json,subprocess,sys,shutil
from pathlib import Path
from datetime import datetime,timezone

def emit(**kw): print(json.dumps(kw,ensure_ascii=False),flush=True)
def run(cmd):
    p=subprocess.run(cmd,capture_output=True,text=True)
    if p.returncode: raise RuntimeError((p.stderr or p.stdout or "Render failed")[-5000:])
    return p

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--job-dir",required=True)
    p.add_argument("--clip-root",required=True)
    p.add_argument("--candidate-id",type=int,required=True)
    p.add_argument("--options",default="{}")
    p.add_argument("--options-file")
    a=p.parse_args()
    job=Path(a.job_dir).resolve();root=Path(a.clip_root).resolve()
    scripts=root/"scripts";out=job/"outputs";out.mkdir(parents=True,exist_ok=True)
    record=json.loads((job/"record.json").read_text(encoding="utf-8-sig"))
    upload_dir=job.parent.parent/"uploads"
    matches=list(upload_dir.glob(record["uploadId"]+".*"))
    if not matches: raise RuntimeError("Original uploaded media is no longer available")
    source=matches[0].resolve();analysis=job/"analysis"
    candidates=json.loads((analysis/"candidates.json").read_text(encoding="utf-8-sig"))
    candidate=next((c for c in candidates.get("candidates",[]) if int(c["id"])==a.candidate_id),None)
    if not candidate: raise RuntimeError("Candidate ID does not exist in this project")
    decisions=analysis/"review_decisions.csv"
    import csv
    with decisions.open(encoding="utf-8-sig",newline="") as f:
        approved={int(r["candidate_id"]):r.get("decision","").upper() for r in csv.DictReader(f)}
    if approved.get(a.candidate_id)!="APPROVE": raise RuntimeError("Only AI-selected approved candidates can be re-rendered")
    options_text=Path(a.options_file).read_text(encoding="utf-8") if a.options_file else a.options
    o=json.loads(options_text);ratio=o.get("aspectRatio","9:16")
    if ratio not in ("9:16","16:9","1:1","4:5","4:3","3:4"): raise RuntimeError("Unsupported aspect ratio")
    style=o.get("captionStyle","pro")
    if style not in ("gaming","pro","podcast","clean"): raise RuntimeError("Unsupported caption preset")
    suffix="edit_"+datetime.now(timezone.utc).strftime("%H%M%S")
    args=[sys.executable,str(scripts/"render_pro.py"),str(analysis),"--ids",str(a.candidate_id),
          "--aspect-ratio",ratio,"--caption-style",style,"--suffix",suffix,"--encoder","h264_qsv"]
    if o.get("hook"): args += ["--hook",str(o["hook"])[:80]]
    if o.get("watermark"): args += ["--watermark",str(o["watermark"])[:50]]
    if not o.get("blurBackground",True): args += ["--no-blur"]
    broll=analysis/"auto_broll"
    if broll.exists() and any(broll.glob("*.mp4")): args += ["--broll-dir",str(broll)]
    emit(stage="editing",progress=10,message="Applying your editor settings to the selected moment")
    run(args)
    base=f"{source.stem}_{suffix}_{a.candidate_id:02d}"
    video=root/"clips"/source.stem/(base+".mp4")
    thumb=video.with_suffix(".jpg")
    if not video.exists(): raise RuntimeError("FFmpeg did not produce the requested render")
    final_video=video
    if candidates.get("has_audio",True) and o.get("soundDesign",True):
        sfx=out/(base+"_sounddesign.mp4")
        try:
            emit(stage="sound_design",progress=72,message="Adding original procedural sound accents")
            run([sys.executable,str(scripts/"sound_design.py"),str(video),"--analysis-dir",str(analysis),
                 "--clip-id",str(a.candidate_id),"--source-start",str(float(candidate["start"])),"--output",str(sfx)])
            if sfx.exists(): final_video=sfx
        except Exception as e:
            emit(stage="sound_design",progress=76,message="Keeping the clean render; sound accents were skipped",warning=str(e)[:400])
    qc=out/(base+".qc.json")
    emit(stage="quality_check",progress=86,message="Checking the revised export")
    run([sys.executable,str(scripts/"quality_check.py"),str(final_video),"--aspect-ratio",ratio,"--json-out",str(qc)])
    dest=out/(base+".mp4");shutil.copy2(final_video,dest)
    if thumb.exists(): shutil.copy2(thumb,out/thumb.name)
    result={"candidateId":a.candidate_id,"video":dest.name,"thumbnail":thumb.name if thumb.exists() else None,
            "start":candidate["start"],"end":candidate["end"],"score":candidate.get("score"),
            "qc":json.loads(qc.read_text(encoding="utf-8-sig"))}
    emit(stage="completed",progress=100,message="Revised clip rendered and checked",outputs=[result])
if __name__=="__main__":
    try:main()
    except Exception as e:
        emit(stage="failed",progress=0,status="failed",message=str(e))
        print(str(e),file=sys.stderr);sys.exit(1)
