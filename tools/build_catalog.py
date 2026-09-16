#!/usr/bin/env python3
import csv, io, json, re, hashlib, urllib.request
from pathlib import Path
from difflib import SequenceMatcher

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'catalog.json'
TARGET=850
ALLOWED={'Coding','Writing','Marketing','Research','Image','Video','Productivity','Learning','Business'}

SOURCES=[
 ('promptcompanion-business','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/business.jsonl','jsonl'),
 ('promptcompanion-creative','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/creative.jsonl','jsonl'),
 ('promptcompanion-development','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/development.jsonl','jsonl'),
 ('promptcompanion-productivity','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/productivity.jsonl','jsonl'),
 ('promptcompanion-research','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/research.jsonl','jsonl'),
 ('promptcompanion-specialized','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/specialized.jsonl','jsonl'),
 ('promptcompanion-translation','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/translation.jsonl','jsonl'),
 ('promptcompanion-writing','https://raw.githubusercontent.com/SysAdminDoc/PromptCompanion/main/data/prompts/writing.jsonl','jsonl'),
 ('prompts-chat','https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv','csv'),
]

BAD=re.compile(r'jailbreak|ignore (all|previous) instructions|dan mode|developer mode|bypass|unfiltered|malware|phishing|credential|exploit|weapon|diagnos(e|is)|doctor|therapist|weight loss',re.I)
VISUAL=re.compile(r'image|photo|portrait|logo|poster|render|cinematic|camera|lighting|midjourney|stable diffusion|flux|illustration|visual',re.I)
VIDEO=re.compile(r'video|shot list|storyboard|scene|film|reel|tiktok|youtube short|animation',re.I)
CODE=re.compile(r'code|developer|program|software|api|sql|javascript|python|typescript|react|debug|test|security|database|frontend|backend|devops|git',re.I)
MARKETING=re.compile(r'market|seo|campaign|brand|copywrit|advertis|social media|linkedin|sales|landing page|positioning|customer|content strategy',re.I)
RESEARCH=re.compile(r'research|analy[sz]|fact.?check|literature|source|compare|data|evidence|study|survey|interview',re.I)
LEARN=re.compile(r'tutor|teacher|learn|lesson|study|quiz|explain|language|education|coach me',re.I)
BUSINESS=re.compile(r'business|startup|product manager|strategy|finance|pricing|operations|entrepreneur|mvp|roadmap|kpi|churn',re.I)
WRITE=re.compile(r'write|writer|edit|proofread|email|essay|story|resume|cover letter|summary|translate|grammar|headline',re.I)
PROD=re.compile(r'productiv|plan|meeting|task|schedule|organize|decision|workflow|prioriti|notes',re.I)

def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'PromptManagerCatalogBuilder/1.0'})
    with urllib.request.urlopen(req,timeout=60) as r:return r.read().decode('utf-8','replace')

def norm(s):return re.sub(r'\s+',' ',(s or '').strip()).lower()
def keytext(s):return re.sub(r'[^a-z0-9 ]','',norm(s))[:1600]

def category(title,body,hint=''):
    s=f'{title} {body[:1200]} {hint}'
    # video before image because cinematography overlaps
    if VIDEO.search(s): return 'Video'
    if VISUAL.search(s): return 'Image'
    if CODE.search(s): return 'Coding'
    if MARKETING.search(s): return 'Marketing'
    if RESEARCH.search(s): return 'Research'
    if LEARN.search(s): return 'Learning'
    if BUSINESS.search(s): return 'Business'
    if WRITE.search(s): return 'Writing'
    if PROD.search(s): return 'Productivity'
    return 'Productivity'

def useful(title,body,quality=50):
    t=norm(title); b=(body or '').strip()
    if not t or len(b)<90 or len(b)>12000:return False
    if BAD.search(t+' '+b[:1800]):return False
    if quality is not None and quality<50:return False
    # reject obvious pure persona/novelty prompts unless they have actionable structure
    if re.search(r'act as (a|an|the) (magician|rapper|comedian|character|celebrity|fortune teller|dream interpreter)',b[:180],re.I):return False
    return True

def load_current():
    if not OUT.exists():return []
    try:return json.loads(OUT.read_text())['prompts']
    except:return []

def candidates():
    out=[]
    for name,url,kind in SOURCES:
        print('fetch',name)
        raw=get(url)
        if kind=='jsonl':
            rows=[]
            for line in raw.splitlines():
                try: rows.append(json.loads(line))
                except: pass
            for r in rows:
                body=r.get('body',''); title=r.get('title',''); q=r.get('quality',50)
                if not useful(title,body,q):continue
                out.append({'title':title.strip()[:100],'prompt':body.strip(),'category':category(title,body,r.get('category','')),
                    '_score':int(q or 50),'_source':r.get('source') or url,'_license':r.get('license') or 'MIT/CC0 upstream','_sid':r.get('id') or ''})
        else:
            for r in csv.DictReader(io.StringIO(raw)):
                title=(r.get('act') or r.get('title') or '').strip(); body=(r.get('prompt') or '').strip()
                if not useful(title,body,54):continue
                out.append({'title':title[:100],'prompt':body,'category':category(title,body),'_score':54,
                    '_source':'https://github.com/f/prompts.chat','_license':'CC0-1.0','_sid':hashlib.sha1((title+body).encode()).hexdigest()[:12]})
    return out

def dedupe(items,current):
    seen=set(keytext(x.get('prompt','')) for x in current)
    titles=set(norm(x.get('title','')) for x in current)
    kept=[]
    for x in sorted(items,key=lambda z:(z['_score'],len(z['prompt'])),reverse=True):
        k=keytext(x['prompt']); t=norm(x['title'])
        if k in seen or t in titles:continue
        # bounded near-dupe check within same category, title-first for speed
        duplicate=False
        for y in kept[-250:]:
            if y['category']!=x['category']:continue
            if SequenceMatcher(None,t,norm(y['title'])).ratio()>=.88:
                if SequenceMatcher(None,k[:700],keytext(y['prompt'])[:700]).ratio()>=.78:
                    duplicate=True;break
        if duplicate:continue
        seen.add(k);titles.add(t);kept.append(x)
    return kept

def select(items,current):
    need=max(0,TARGET-len(current)); buckets={c:[] for c in ALLOWED}
    for x in items:buckets[x['category']].append(x)
    # balanced target, then fill with highest quality remaining
    desired={'Coding':130,'Writing':100,'Marketing':100,'Research':100,'Image':90,'Video':60,'Productivity':90,'Learning':80,'Business':100}
    chosen=[]; used=set()
    current_counts={c:sum(1 for p in current if p.get('category')==c) for c in ALLOWED}
    for c,want in desired.items():
        take=max(0,want-current_counts.get(c,0))
        for x in buckets[c][:take]:chosen.append(x);used.add(id(x))
    if len(chosen)<need:
        rest=[x for x in items if id(x) not in used]
        rest.sort(key=lambda z:(z['_score'],len(z['prompt'])),reverse=True)
        chosen.extend(rest[:need-len(chosen)])
    return chosen[:need]

def main():
    current=load_current()
    raw=candidates(); clean=dedupe(raw,current); chosen=select(clean,current)
    prompts=list(current)
    start=1
    ids={str(x.get('id')) for x in prompts}
    for x in chosen:
        while f'agg-{start:04d}' in ids:start+=1
        prompts.append({'id':f'agg-{start:04d}','title':x['title'],'category':x['category'],'prompt':x['prompt'],
            'provenance':{'source':x['_source'],'source_id':x['_sid'],'license':x['_license']}});start+=1
    doc={'source':'Prompt Manager curated multi-source catalog','license':'Mixed permissive; see per-prompt provenance','version':4,'prompts':prompts}
    OUT.write_text(json.dumps(doc,ensure_ascii=False,separators=(',',':'))+'\n')
    print(f'candidates={len(raw)} deduped={len(clean)} added={len(chosen)} total={len(prompts)}')
    if len(prompts)<750:raise SystemExit('Quality gate produced fewer than 750 prompts; add sources or review thresholds instead of padding.')
if __name__=='__main__':main()
