#!/usr/bin/env python3
"""Build Prompt Manager catalog from permissively licensed upstream sources.

This is a data-only build step. It must never mutate runtime UI, What's New,
release copy, or service-worker files. Release presentation is managed separately.
"""
from __future__ import annotations

import json
import re
import urllib.request
from collections import defaultdict, deque
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/"catalog.json"
TARGET=850
MINIMUM=750

PC_FILES=("business","creative","development","productivity","research","specialized","translation","writing")
PC_BASE="https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/"
AI_LIB="https://raw.githubusercontent.com/itseffi/AI-prompt-library/main/prompts.json"

BLOCK_RE=re.compile(
    r"\b(jailbreak|bypass safety|ignore previous instructions|ignore all previous|"
    r"malware|ransomware|credential theft|phishing kit|steal password|keylogger|"
    r"suicide method|self[- ]harm method|anorexia coach|purge calories|"
    r"stake\.us|casino strategy|gambling strategy|martingale|sports betting|"
    r"porn|explicit sex|nonconsensual|sexualize minor|child sexual)\b", re.I
)
WS=re.compile(r"\s+")
NONWORD=re.compile(r"[^a-z0-9]+")

def fetch(url:str)->str:
    req=urllib.request.Request(url,headers={"User-Agent":"PromptManager-CatalogBuilder/1.8.1"})
    with urllib.request.urlopen(req,timeout=45) as r:
        return r.read().decode("utf-8")

def norm(text:str)->str:
    return WS.sub(" ",str(text or "").strip())

def fingerprint(text:str)->str:
    return NONWORD.sub(" ",norm(text).lower()).strip()

def slug(text:str)->str:
    return NONWORD.sub("-",norm(text).lower()).strip("-")[:70] or "prompt"

def safe_candidate(title:str,body:str,quality:int|None=None)->bool:
    t=norm(title); b=norm(body)
    if len(t)<3 or len(b)<120 or len(b)>12000:return False
    if quality is not None and quality<60:return False
    if BLOCK_RE.search(t+"\n"+b):return False
    low=b.lower()
    if low.count("http://")+low.count("https://")>8:return False
    if "<thinking>" in low and ("show" in low or "output" in low):return False
    return True

def category_for(title:str,body:str,source_cat:str="",tags=None)->str:
    text=(" ".join([title,source_cat," ".join(tags or [])])+" "+body[:1200]).lower()
    rules=[
      ("Coding",("code","coding","developer","software","api","sql","database","debug","frontend","backend","architecture","security","devops","programming")),
      ("Image",("image","photo","photograph","portrait","logo","visual","midjourney","illustration","diorama","render")),
      ("Video",("video","shot list","cinematic","film","reel","tiktok script","storyboard")),
      ("Marketing",("marketing","seo","campaign","brand","copywriting","ad copy","social media","content strategy","positioning","growth","aso")),
      ("Research",("research","analysis","investigation","literature","evidence","source","fact-check","market research","synthesize")),
      ("Writing",("writing","writer","rewrite","edit","email","essay","story","proofread","headline","translation","translate","cv","resume","cover letter")),
      ("Productivity",("productivity","meeting","planner","plan","task","workflow","project management","decision","priorit","time management")),
      ("Learning",("teacher","tutor","learn","education","quiz","study","student","course","coach","explain")),
      ("Business",("business","sales","startup","product manager","product strategy","customer","stakeholder","revenue","finance","operations","strategy","gtm")),
    ]
    scores={cat:sum(text.count(k) for k in keys) for cat,keys in rules}
    best=max(scores,key=scores.get)
    return best if scores[best]>0 else "General"

def record(*,sid,title,body,category,source,source_url,license,author="",tags=None,quality=None):
    out={
      "id":sid,"title":norm(title)[:120],"category":category,"prompt":norm(body),
      "platform":"general","models":["multimodel"],"source":source,
      "source_url":source_url,"source_id":sid,"source_license":license,
      "source_author":norm(author)[:120],"tags":list(tags or [])[:12],
    }
    if quality is not None:out["quality"]=quality
    return out

def load_existing():
    data=json.loads(CATALOG.read_text(encoding="utf-8"))
    out=[]
    for p in data.get("prompts",[]):
        if not isinstance(p,dict):continue
        q=dict(p)
        q.setdefault("source","Prompt Manager")
        q.setdefault("source_url","")
        q.setdefault("source_id",str(q.get("id","")))
        q.setdefault("source_license","PM original")
        q.setdefault("source_author","Prompt Manager")
        out.append(q)
    return out

def load_promptcompanion():
    out=[]
    for name in PC_FILES:
        raw=fetch(f"{PC_BASE}{name}.jsonl")
        for line in raw.splitlines():
            if not line.strip():continue
            try:r=json.loads(line)
            except json.JSONDecodeError:continue
            title=norm(r.get("title")); body=norm(r.get("body"))
            quality=int(r.get("quality") or 0); license=norm(r.get("license"))
            if license not in {"CC0-1.0","MIT"}:continue
            if str(r.get("language","en")).lower()!="en":continue
            if not safe_candidate(title,body,quality):continue
            source_url=norm(r.get("source")); rid=norm(r.get("id")) or slug(title)
            out.append(record(
              sid=f"pc-{rid}",title=title,body=body,
              category=category_for(title,body,name,r.get("tags")),
              source="PromptCompanion / upstream",source_url=source_url,
              license=license,author=r.get("author",""),tags=r.get("tags"),quality=quality
            ))
    return out

def load_ai_library():
    data=json.loads(fetch(AI_LIB)); out=[]
    for r in data.get("prompts",[]):
        title=norm(r.get("title")); body=norm(r.get("content"))
        if not safe_candidate(title,body,70):continue
        path=norm(r.get("path")); sid=f"aipm-{slug(path or title)}"
        out.append(record(
          sid=sid,title=title,body=body,
          category=category_for(title,body,r.get("category",""),r.get("tags")),
          source="itseffi/AI-prompt-library",
          source_url="https://github.com/itseffi/AI-prompt-library",
          license="MIT",author="itseffi",tags=r.get("tags"),quality=80
        ))
    return out

def dedupe(records):
    seen_body=set(); seen_ids=set(); out=[]
    for r in records:
        fp=fingerprint(r.get("prompt","")); rid=str(r.get("id",""))
        if len(fp)<80 or fp in seen_body or rid in seen_ids:continue
        seen_body.add(fp); seen_ids.add(rid); out.append(r)
    return out

def balanced(existing,candidates):
    base=dedupe(existing)
    used={fingerprint(x.get("prompt","")) for x in base}
    groups=defaultdict(list)
    for r in dedupe(candidates):
        if fingerprint(r["prompt"]) in used:continue
        groups[r["category"]].append(r)
    for values in groups.values():
        values.sort(key=lambda x:(-int(x.get("quality",0)),x["title"].lower()))
    queues={k:deque(v) for k,v in groups.items()}
    order=("Coding","Marketing","Writing","Research","Productivity","Business","Learning","Image","Video","General")
    out=list(base)
    while len(out)<TARGET and any(queues.values()):
        progressed=False
        for cat in order:
            q=queues.get(cat)
            if q:
                r=q.popleft(); fp=fingerprint(r["prompt"])
                if fp not in used:
                    out.append(r); used.add(fp); progressed=True
                    if len(out)>=TARGET:break
        if not progressed:break
    return out

def main():
    existing=load_existing()
    candidates=load_promptcompanion()+load_ai_library()
    final=balanced(existing,candidates)
    if len(final)<MINIMUM:
        raise RuntimeError(f"Quality gate produced only {len(final)} prompts; minimum is {MINIMUM}.")
    payload={
      "source":"Prompt Manager multi-source catalog",
      "license":"Mixed permissive licenses; see per-prompt provenance",
      "version":4,"prompt_count":len(final),
      "build_policy":"deterministic quality gate + provenance + deduplication + category balancing",
      "prompts":final
    }
    CATALOG.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print(f"Catalog built: {len(final)} prompts from {len(candidates)} accepted candidates.")
    counts=defaultdict(int)
    for p in final:counts[p.get("category","General")]+=1
    print("Categories:",dict(sorted(counts.items())))

if __name__=="__main__":
    main()
