#!/usr/bin/env python3
"""Build static ES/SR translations for Prompt Manager catalog.
No translation API is used at runtime. Uses NLLB locally during the release build.
"""
from __future__ import annotations
import json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/'catalog.json'
OUT=ROOT/'catalog-i18n.json'
MODEL='facebook/nllb-200-distilled-600M'
PLACEHOLDER=re.compile(r'(\[[^\]\n]{1,80}\]|\{[^{}\n]{1,80}\}|@[A-Za-z0-9_-]+|https?://\S+|`[^`\n]+`)')

# Serbian UI in Prompt Manager uses Latin script. NLLB emits Serbian Cyrillic,
# so transliterate after translation while protected placeholders remain tokens.
def protect(text):
    vals=[]
    def sub(m): vals.append(m.group(0)); return f' PMTOKEN{len(vals)-1} '
    return PLACEHOLDER.sub(sub, text), vals

def restore(text, vals):
    for i,v in enumerate(vals):
        text=text.replace(f'PMTOKEN{i}',v).replace(f'PMTOKEN {i}',v)
    return text

def chunks(text, limit=1100):
    parts=re.split(r'(\n\n+)', text)
    out=[]; cur=''
    for part in parts:
        if len(cur)+len(part)<=limit: cur+=part; continue
        if cur.strip(): out.append(cur)
        cur=part
        while len(cur)>limit:
            cut=cur.rfind('. ',0,limit)
            if cut<limit//2: cut=cur.rfind(' ',0,limit)
            if cut<1: cut=limit
            out.append(cur[:cut+1]); cur=cur[cut+1:]
    if cur.strip(): out.append(cur)
    return out or ['']

def main():
    import torch
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    from cyrtranslit import to_latin
    data=json.loads(CATALOG.read_text(encoding='utf-8'))
    prompts=data.get('prompts',[])
    tok=AutoTokenizer.from_pretrained(MODEL)
    model=AutoModelForSeq2SeqLM.from_pretrained(MODEL)
    model.eval()
    targets={'es':'spa_Latn','sr':'srp_Cyrl'}
    result={'version':1,'catalog_version':data.get('version'), 'languages':['es','sr'],'translations':{}}
    cache={}
    def translate(text,target):
        key=(text,target)
        if key in cache:return cache[key]
        protected,vals=protect(text)
        outs=[]
        for piece in chunks(protected):
            enc=tok(piece,return_tensors='pt',truncation=True,max_length=512)
            with torch.inference_mode():
                gen=model.generate(**enc,forced_bos_token_id=tok.convert_tokens_to_ids(target),max_new_tokens=512,num_beams=2)
            outs.append(tok.batch_decode(gen,skip_special_tokens=True)[0])
        value=restore(''.join(outs),vals).strip()
        if target=='srp_Cyrl': value=to_latin(value,'sr')
        cache[key]=value
        return value
    for idx,p in enumerate(prompts,1):
        pid=str(p['id']); original=str(p.get('prompt','')); title=str(p.get('title',''))
        item={'original_language':'en'}
        for code,target in targets.items():
            item[code]={'title':translate(title,target),'prompt':translate(original,target)}
        result['translations'][pid]=item
        if idx%25==0: print(f'Translated {idx}/{len(prompts)}',flush=True)
    assert len(result['translations'])==len(prompts)
    OUT.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'Wrote {OUT.name}: {len(prompts)} prompts')
if __name__=='__main__': main()
