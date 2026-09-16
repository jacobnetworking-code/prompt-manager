/* Prompt Manager — curated model registry. Product-facing names, not API aliases. */
window.PM_MODEL_REGISTRY=Object.freeze({
 general:["Multimodel"],
 chatgpt:["GPT-6 Pro","GPT-5.6 Sol Pro","GPT-5.6 Sol","GPT-5.6 Terra","GPT-5.6 Luna","ChatGPT Images 2.5"],
 claude:["Claude Fable 5.1","Claude Opus 5","Claude Sonnet 5","Claude Opus 4.8","Claude Opus 4.7","Claude Opus 4.6","Claude Sonnet 4.6","Claude Opus 4.5","Claude Sonnet 4.5","Claude Haiku 4.5"],
 gemini:["Gemini 3.8 Flash","Gemini 3.8 Live","Gemini 3.8 Live Extended Thinking","Gemini 3.7 Flash","Gemini 3.6 Flash","Gemini 3.5 Flash","Gemini 3.5 Flash-Lite","Gemini 3.1 Pro","Gemini 3 Flash","Nano Banana 2","Nano Banana 2 Lite","Nano Banana Pro","Gemini Omni Flash"],
 grok:["Grok 4.6","Grok 4.5","Grok 4.3","Grok 4.20","Grok Imagine Image 2.0","Grok Imagine Video 1.5"],
 midjourney:["Midjourney V8.2","Midjourney V8.1","Midjourney V7","Midjourney V6.1","Midjourney V6","Niji 7"],
 seedance:["Seedance 2.5","Seedance 2.0"],
 other:["Multimodel"]
});

/* M1.7.12.9.1 — Add/Edit model selector aligned with Library filters. */
(()=>{
  "use strict";
  const registry=window.PM_MODEL_REGISTRY||{};
  const q=id=>document.getElementById(id);
  const clean=v=>String(v??"").trim().replace(/\s+/g," ").slice(0,60);
  const display=v=>clean(v).toLowerCase()==="multimodel"?"Multimodel":clean(v);

  function unique(values){
    const seen=new Set();
    return values.filter(v=>{
      const k=clean(v).toLowerCase();
      if(!k||seen.has(k))return false;
      seen.add(k); return true;
    });
  }

  function allModels(){
    return unique(Object.values(registry).flat());
  }

  function modelsFor(platform){
    /* Library's reset Platform state exposes every registered model.
       Add Prompt visually starts on Multiplatform, so give it the same browse
       experience instead of reducing Model to Multimodel only. */
    if(!platform||platform==="general"||platform==="other")return allModels();
    return unique(registry[platform]||[]);
  }

  function platformForModel(model){
    const key=clean(model).toLowerCase();
    if(!key||key==="multimodel")return null;
    for(const [platform,values] of Object.entries(registry)){
      if(platform==="general"||platform==="other")continue;
      if(values.some(v=>clean(v).toLowerCase()===key))return platform;
    }
    return null;
  }

  function ensureSelect(){
    const current=q("models");
    if(!current)return null;
    if(current.tagName==="SELECT")return current;
    const select=document.createElement("select");
    select.id="models";
    select.name=current.name||"models";
    select.setAttribute("aria-label","Model");
    current.replaceWith(select);
    return select;
  }

  function render({preserve=true}={}){
    const select=ensureSelect(), platform=q("platform");
    if(!select||!platform)return;
    const previous=preserve?clean(select.value):"";
    const values=modelsFor(platform.value);

    select.replaceChildren();
    const empty=document.createElement("option");
    empty.value=""; empty.textContent="Model";
    select.appendChild(empty);

    values.forEach(v=>{
      const option=document.createElement("option");
      option.value=v; option.textContent=display(v);
      select.appendChild(option);
    });

    if(previous){
      let option=[...select.options].find(x=>x.value.toLowerCase()===previous.toLowerCase());
      if(!option){
        option=document.createElement("option");
        option.value=previous; option.textContent=display(previous);
        option.dataset.pmLegacyModel="true";
        select.appendChild(option);
      }
      select.value=option.value;
    }
  }

  function init(){
    const platform=q("platform"), dialog=q("dialog");
    const select=ensureSelect();
    if(!platform||!dialog||!select)return;

    render({preserve:false});

    platform.addEventListener("change",()=>render({preserve:false}));

    select.addEventListener("change",()=>{
      const owner=platformForModel(select.value);
      /* When browsing from Multiplatform, choosing a platform-specific model
         makes the metadata internally consistent automatically. */
      if(platform.value==="general"&&owner){
        platform.value=owner;
        render({preserve:true});
      }
    });

    new MutationObserver(()=>{
      if(dialog.open)queueMicrotask(()=>render({preserve:true}));
    }).observe(dialog,{attributes:true,attributeFilter:["open"]});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
