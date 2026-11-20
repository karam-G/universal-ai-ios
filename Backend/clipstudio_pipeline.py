#!/usr/bin/env python3
"""Orchestrate private local analysis, visual ranking, contextual B-roll and clip rendering."""
import argparse,json,subprocess,sys,shutil
from pathlib import Path

def emit(**kw):
    print(json.dumps(kw,ensure_ascii=False),flush=True)

def run(cmd,cwd=None):
    p=subprocess.run(cmd,cwd=cwd,text=True,capture_output=True)
    if p.returncode:
        raise RuntimeError((p.stderr or p.stdout or "Command failed")[-5000:])
    return p

def main():
    a=argparse.ArgumentParser()
    a.add_argument("--source",required=True)
    a.add_argument("--job-dir",required=True)
    a.add_argument("--clip-root",required=True)
    a.add_argument("--options",required=True)
    x=a.parse_args()
    src=Path(x.source).resolve()
    job=Path(x.job_dir).resolve()
    root=Path(x.clip_root).resolve()
    scripts=root/"scripts"
    out=job/"outputs"
    out.mkdir(parents=True,exist_ok=True)
    o=json.loads(x.options)
    if not src.is_file(): raise RuntimeError("Uploaded source file is missing")
    if shutil.which("ffprobe") is None: raise RuntimeError("FFprobe is not installed")
    py=sys.executable
    analysis=job/"analysis"
    analysis.mkdir(exist_ok=True)

    emit(stage="probing",progress=3,message="Checking video and audio streams")
    probe=run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(src)])
    info=json.loads(probe.stdout)
    duration=float(info.get("format",{}).get("duration",0))
    if duration<=0 or not any(s.get("codec_type")=="video" for s in info.get("streams",[])):
        raise RuntimeError("The file has no readable video stream")
    has_audio=any(s.get("codec_type")=="audio" for s in info.get("streams",[]))

    emit(stage="analysis",progress=8,message="Transcribing speech and analysing visual/audio activity")
    run([py,str(scripts/"analyze_vod.py"),str(src),"--model","tiny.en","--clip-seconds","35","--top","40","--output",str(analysis)])
    run([py,str(scripts/"review_candidates.py"),str(analysis),"--max","40"])

    selector=[py,str(scripts/"auto_select.py"),str(analysis),"--max-clips",str(o["maxClips"]),"--mode",o["mode"]]
    emit(stage="ranking",progress=52,message="Ranking story moments, speech and audiovisual signals")
    run(selector)
    report=json.loads((analysis/"auto_selection_report.json").read_text(encoding="utf-8-sig"))
    ids=report["selected_candidate_ids"]
    if not ids: raise RuntimeError("No candidates passed the quality gates")

    # Add local vision evidence for a small top subset when the free local model is installed.
    try:
        ollama=run(["ollama","list"])
        if "qwen3.5:4b" in ollama.stdout.lower():
            emit(stage="visual_review",progress=58,message="Checking sampled frames with the local vision model")
            run([py,str(scripts/"visual_understand.py"),str(analysis),"--model","qwen3.5:4b","--ids",",".join(map(str,ids)),"--limit","3","--frames","3","--timeout","180"])
            run(selector)
            report=json.loads((analysis/"auto_selection_report.json").read_text(encoding="utf-8-sig"))
            ids=report["selected_candidate_ids"]
    except Exception as e:
        emit(stage="visual_review",progress=59,message="Optional local vision pass skipped; continuing with signal-based ranking",warning=str(e)[:500])

    # Build cutaways only from other moments in the same uploaded source.
    broll=analysis/"auto_broll"
    broll_args=[]
    try:
        emit(stage="broll",progress=62,message="Searching the source for context-matched cutaways")
        run([py,str(scripts/"build_broll_library.py"),str(analysis),"--output-dir",str(broll),"--max-per-clip","1","--duration","4","--exclude-radius","45"])
        if any(p.suffix.lower() in {".mp4",".mov",".mkv",".webm"} for p in broll.glob("*")):
            broll_args=["--broll-dir",str(broll)]
    except Exception as e:
        emit(stage="broll",progress=63,message="No suitable contextual cutaways; keeping the main footage clean",warning=str(e)[:500])

    emit(stage="editing",progress=66,message="Rendering vertical edits, timed captions and audio polish")
    run([py,str(scripts/"render_pro.py"),str(analysis),"--ids",",".join(map(str,ids)),"--aspect-ratio",o["aspectRatio"],"--caption-style",o["captionStyle"],"--suffix","aion_"+job.name[:8],"--encoder","h264_qsv",*broll_args])

    clipdir=root/"clips"/src.stem
    selected={int(c["id"]):c for c in report.get("selected",[])}
    outputs=[]
    for n,cid in enumerate(ids):
        base=f"{src.stem}_aion_{job.name[:8]}_{int(cid):02d}"
        video=clipdir/(base+".mp4")
        thumb=clipdir/(base+".jpg")
        if not video.exists(): continue
        final_video=video
        if has_audio:
            sfx=out/(base+"_sounddesign.mp4")
            try:
                emit(stage="sound_design",progress=78+int(5*n/max(1,len(ids))),message="Adding original, locally synthesized sound accents")
                run([py,str(scripts/"sound_design.py"),str(video),"--analysis-dir",str(analysis),"--clip-id",str(cid),"--source-start",str(float(selected.get(int(cid),{}).get("start",0))),"--output",str(sfx)])
                if sfx.exists(): final_video=sfx
            except Exception as e:
                emit(stage="sound_design",progress=79,message="Sound accents skipped; preserving the clean rendered audio",warning=str(e)[:500])

        qc=out/(base+".qc.json")
        emit(stage="quality_check",progress=84+int(12*n/max(1,len(ids))),message="Running full decode, image, audio and loudness checks")
        run([py,str(scripts/"quality_check.py"),str(final_video),"--aspect-ratio",o["aspectRatio"],"--json-out",str(qc)])
        final_dest=out/(base+".mp4")
        shutil.copy2(final_video,final_dest)
        if thumb.exists(): shutil.copy2(thumb,out/thumb.name)
        c=selected.get(int(cid),{})
        outputs.append({
            "candidateId":int(cid),"video":final_dest.name,
            "thumbnail":thumb.name if thumb.exists() else None,
            "start":c.get("start"),"end":c.get("end"),
            "score":c.get("combined_score",c.get("score")),
            "qc":json.loads(qc.read_text(encoding="utf-8-sig"))
        })

    (job/"candidates.json").write_text(json.dumps({
        "source":src.name,"durationSeconds":duration,
        "candidates":report.get("selected",[]),"rejected":report.get("rejected",[]),
        "note":report.get("note")
    },ensure_ascii=False,indent=2),encoding="utf-8")
    (job/"outputs.json").write_text(json.dumps(outputs,ensure_ascii=False,indent=2),encoding="utf-8")
    emit(stage="packaging",progress=98,message="Preparing previews and delivery manifest",outputs=outputs,candidateCount=len(ids),durationSeconds=duration)
    emit(stage="completed",progress=100,message=f"{len(outputs)} clips rendered and checked",outputs=outputs,candidateCount=len(ids),durationSeconds=duration)

if __name__=="__main__":
    try: main()
    except Exception as e:
        emit(stage="failed",progress=0,status="failed",message=str(e))
        print(str(e),file=sys.stderr)
        sys.exit(1)
