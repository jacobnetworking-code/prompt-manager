(()=>{"use strict";
const LANG_KEY="pm-language";
const LANGS={en:{label:"English",flag:"🇬🇧"},es:{label:"Español",flag:"🇪🇸"},sr:{label:"Srpski",flag:"🇷🇸"}};

function upgradeLanguageSettings(){
  const section=document.getElementById("pmLanguageSection");
  if(!section||section.dataset.pmSelectEnhanced==="1")return;
  section.dataset.pmSelectEnhanced="1";

  const legacy=section.querySelector(".pm-language-options");
  if(legacy){
    legacy.hidden=true;
    legacy.classList.add("pm-language-legacy-options");
  }

  const wrap=document.createElement("div");
  wrap.className="pm-language-select-control";
  const select=document.createElement("select");
  select.id="pmLanguageSelect";
  select.setAttribute("aria-label","Language");
  Object.entries(LANGS).forEach(([code,lang])=>{
    const option=document.createElement("option");
    option.value=code;
    option.textContent=lang.label;
    select.appendChild(option);
  });
  select.value=LANGS[localStorage.getItem(LANG_KEY)]?localStorage.getItem(LANG_KEY):"en";
  wrap.appendChild(select);
  section.appendChild(wrap);

  select.addEventListener("change",()=>{
    const button=legacy?.querySelector(`[data-pm-language="${select.value}"]`);
    if(button)button.click();
    else{
      localStorage.setItem(LANG_KEY,select.value);
      location.reload();
    }
  });

  section.addEventListener("click",()=>{
    queueMicrotask(()=>{
      const value=localStorage.getItem(LANG_KEY)||"en";
      if(LANGS[value])select.value=value;
    });
  });
}

function syncExpandedBrand(){
  const brand=document.querySelector(".brand");
  if(!brand)return;
  brand.dataset.pmExpandedBrand="1";
}

function init(){
  upgradeLanguageSettings();
  syncExpandedBrand();

  const settings=document.getElementById("settingsDialog");
  if(settings){
    new MutationObserver(()=>{
      if(settings.open)upgradeLanguageSettings();
    }).observe(settings,{attributes:true,attributeFilter:["open"]});
  }

  new MutationObserver(upgradeLanguageSettings).observe(document.body,{childList:true,subtree:true});
}

init();
})();