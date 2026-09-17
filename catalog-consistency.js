/* Prompt Manager V1.8.1 — safe runtime compatibility layer.
   Translation rendering remains disabled until static translations are validated.
   Featured video recovery is isolated: it never replaces Explore renderers,
   intercepts card clicks, or mutates catalog data. */
(()=>{"use strict";

window.PM_CATALOG_I18N_STATUS=Object.freeze({
  enabled:false,
  reason:"translations-pending"
});

const SELECTOR=".pm-featured-video";
const visible=new Set();
let observer=null;

function prepare(video){
  if(!(video instanceof HTMLVideoElement))return;
  video.muted=true;
  video.defaultMuted=true;
  video.loop=true;
  video.playsInline=true;
  video.setAttribute("muted","");
  video.setAttribute("playsinline","");
  video.setAttribute("webkit-playsinline","");
  video.preload="auto";

  if(video.dataset.pmPlaybackRecovery==="1")return;
  video.dataset.pmPlaybackRecovery="1";

  const retry=()=>{
    if(document.hidden||!video.isConnected)return;
    if(visible.has(video)||isVisible(video))void safePlay(video);
  };
  video.addEventListener("loadedmetadata",retry,{passive:true});
  video.addEventListener("canplay",retry,{passive:true});
  video.addEventListener("stalled",()=>{ if(video.isConnected)video.load(); },{passive:true});
}

function isVisible(video){
  const r=video.getBoundingClientRect();
  if(!r.width||!r.height)return false;
  const vh=window.innerHeight||document.documentElement.clientHeight;
  const vw=window.innerWidth||document.documentElement.clientWidth;
  const overlapY=Math.max(0,Math.min(r.bottom,vh)-Math.max(r.top,0));
  const overlapX=Math.max(0,Math.min(r.right,vw)-Math.max(r.left,0));
  return overlapY*overlapX >= r.width*r.height*0.10;
}

async function safePlay(video){
  prepare(video);
  if(video.readyState===0)video.load();
  try{ await video.play(); }catch(_){ /* retried after canplay or user gesture */ }
}

function scan(root=document){
  const videos=[];
  if(root instanceof HTMLVideoElement && root.matches(SELECTOR))videos.push(root);
  root.querySelectorAll?.(SELECTOR).forEach(v=>videos.push(v));
  videos.forEach(v=>{
    prepare(v);
    observer?.observe(v);
    if(isVisible(v)){visible.add(v);void safePlay(v)}
  });
}

function start(){
  if(!("IntersectionObserver" in window)){
    scan();
    return;
  }
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const v=entry.target;
      prepare(v);
      if(entry.isIntersecting&&entry.intersectionRatio>=0.10){
        visible.add(v);
        void safePlay(v);
      }else{
        visible.delete(v);
        v.pause();
      }
    }
  },{threshold:[0,.10,.35,.75]});

  const list=document.getElementById("exploreList");
  scan(list||document);

  if(list){
    new MutationObserver(records=>{
      for(const record of records)record.addedNodes.forEach(node=>{
        if(node.nodeType===1)scan(node);
      });
    }).observe(list,{childList:true,subtree:true});
  }

  const retryVisible=()=>document.querySelectorAll(SELECTOR).forEach(v=>{
    if(isVisible(v)){visible.add(v);void safePlay(v)}
  });

  document.addEventListener("visibilitychange",()=>{if(!document.hidden)retryVisible()},{passive:true});
  window.addEventListener("pageshow",retryVisible,{passive:true});
  document.addEventListener("pointerdown",retryVisible,{passive:true,capture:true});
  document.addEventListener("touchstart",retryVisible,{passive:true,capture:true});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();

})();