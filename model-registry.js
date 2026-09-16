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

/* M1.7.12.9 — Add/Edit uses the same model registry as Library filters.
   This controller deliberately does not decorate Library cards; model-support.js
   owns card rendering so there is no post-render MutationObserver loop. */
(()=>{
  "use strict";

  const registry=window.PM_MODEL_REGISTRY||{};
  const q=id=>document.getElementById(id);
  const clean=value=>String(value??"").trim().replace(/\s+/g," ").slice(0,60);
  const label=value=>clean(value).toLowerCase()==="multimodel"?"Multimodel":clean(value);

  function modelsForPlatform(platform){
    const values=registry[platform]||registry.other||[];
    const seen=new Set();
    return values.filter(value=>{
      const key=clean(value).toLowerCase();
      if(!key||seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  function ensureModelSelect(){
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

  function syncModelSelect({preserve=true}={}){
    const select=ensureModelSelect();
    const platform=q("platform");
    if(!select||!platform)return;

    const previous=preserve?clean(select.value):"";
    const values=modelsForPlatform(platform.value||"general");

    select.replaceChildren();

    const placeholder=document.createElement("option");
    placeholder.value="";
    placeholder.textContent="Model";
    select.appendChild(placeholder);

    values.forEach(value=>{
      const option=document.createElement("option");
      option.value=value;
      option.textContent=label(value);
      select.appendChild(option);
    });

    if(previous){
      const exact=[...select.options].find(
        option=>option.value.toLowerCase()===previous.toLowerCase()
      );
      if(exact){
        select.value=exact.value;
      }else{
        /* Preserve unknown/imported model metadata when editing an older prompt. */
        const option=document.createElement("option");
        option.value=previous;
        option.textContent=label(previous);
        option.dataset.pmLegacyModel="true";
        select.appendChild(option);
        select.value=previous;
      }
    }
  }

  function init(){
    const platform=q("platform");
    const dialog=q("dialog");
    if(!platform||!dialog||!q("models"))return;

    ensureModelSelect();
    syncModelSelect({preserve:false});

    platform.addEventListener("change",()=>{
      /* A platform change invalidates the previous model choice. */
      syncModelSelect({preserve:false});
    });

    /* showModal() adds the open attribute after Edit has populated platform/model.
       Observe only the dialog attribute; descendant writes cannot retrigger it. */
    new MutationObserver(()=>{
      if(dialog.open)queueMicrotask(()=>syncModelSelect({preserve:true}));
    }).observe(dialog,{attributes:true,attributeFilter:["open"]});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
