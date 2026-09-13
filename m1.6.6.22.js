(()=>{"use strict";
/* Prompt Manager M1.6.6.22 — editorial Featured descriptions.
   Featured is discovery/editorial UI: describe the outcome instead of exposing prompt copy. */

const COPY={
  en:{
    "pc-017":"Builds polished image-generation prompts from a simple idea by structuring the subject, style, composition, lighting and visual details.",
    "pc-021":"Creates cinematic arrival sequences with controlled movement, atmosphere and visual storytelling for AI video generation.",
    "pc-019":"Creates premium, photorealistic portraits with controlled lighting, composition and detailed facial rendering.",
    "pm-056":"Transforms architectural ideas into refined visual concepts with stronger composition, materials, lighting and presentation.",
    "pm-059":"Creates high-end fashion editorial imagery with deliberate styling, art direction, lighting and magazine-ready composition.",
    "pm-055":"Develops clean, distinctive logo concepts with stronger visual direction, simplicity and brand-ready presentation."
  },
  es:{
    "pc-017":"Convierte una idea sencilla en un prompt de imagen bien estructurado, definiendo sujeto, estilo, composición, iluminación y detalles visuales.",
    "pc-021":"Crea secuencias cinematográficas de llegada con movimiento, atmósfera y narrativa visual controlados para generación de vídeo con IA.",
    "pc-019":"Crea retratos premium y fotorrealistas con iluminación controlada, buena composición y un alto nivel de detalle facial.",
    "pm-056":"Transforma ideas arquitectónicas en conceptos visuales refinados, mejorando composición, materiales, iluminación y presentación.",
    "pm-059":"Crea imágenes editoriales de moda de alta gama con estilismo, dirección artística, iluminación y composición de revista.",
    "pm-055":"Desarrolla conceptos de logo limpios y distintivos con una dirección visual clara, simplicidad y acabado preparado para marca."
  },
  sr:{
    "pc-017":"Pretvara jednostavnu ideju u strukturisan prompt za generisanje slike, definišući subjekat, stil, kompoziciju, osvetljenje i vizuelne detalje.",
    "pc-021":"Kreira filmske scene dolaska sa kontrolisanim pokretom, atmosferom i vizuelnim pripovedanjem za AI generisanje videa.",
    "pc-019":"Kreira premium fotorealistične portrete sa kontrolisanim osvetljenjem, kompozicijom i detaljnim prikazom lica.",
    "pm-056":"Pretvara arhitektonske ideje u doterane vizuelne koncepte sa boljom kompozicijom, materijalima, osvetljenjem i prezentacijom.",
    "pm-059":"Kreira vrhunske modne editorijale sa promišljenim stilom, umetničkim pravcem, osvetljenjem i kompozicijom spremnom za magazin.",
    "pm-055":"Razvija čiste i prepoznatljive koncepte logotipa sa jasnijim vizuelnim pravcem, jednostavnošću i prezentacijom spremnom za brend."
  }
};

const lang=()=>{
  const x=localStorage.getItem("pm-language")||"en";
  return COPY[x]?x:"en";
};

function applyFeaturedDescriptions(){
  const descriptions=COPY[lang()];
  document.querySelectorAll("#exploreList .pm-featured-card").forEach(card=>{
    const open=card.querySelector("[data-explore-open]");
    const p=card.querySelector(".pm-featured-body > p");
    if(!open||!p)return;
    const text=descriptions[String(open.dataset.exploreOpen)];
    if(text){
      p.textContent=text;
      p.dataset.pmFeaturedDescription="true";
    }
  });
}

const list=document.getElementById("exploreList");
if(list){
  new MutationObserver(applyFeaturedDescriptions).observe(list,{childList:true,subtree:true});
  applyFeaturedDescriptions();
}

window.addEventListener("storage",applyFeaturedDescriptions);
document.addEventListener("change",e=>{
  if(e.target?.id==="pmLanguageSelect")setTimeout(applyFeaturedDescriptions,0);
},true);
})();