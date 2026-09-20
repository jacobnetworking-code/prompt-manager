(()=>{"use strict";
function targetRowCount(){
  if(!window.matchMedia("(max-width:760px)").matches)return 5;
  return Math.max(8,Math.ceil(window.innerHeight/106)+3);
}
function cloneRowsToFill(){
  const backdrop=document.querySelector("#authGate .pm-auth-backdrop");
  if(!backdrop)return false;
  const rows=[...backdrop.querySelectorAll(":scope > .pm-auth-row")];
  if(!rows.length)return false;
  const wanted=targetRowCount();
  for(let i=rows.length;i<wanted;i++){
    const source=rows[i%rows.length];
    const clone=source.cloneNode(true);
    const track=clone.querySelector(".pm-auth-track");
    if(track)track.style.animationDelay=`-${i*7}s`;
    backdrop.appendChild(clone);
  }
  return true;
}
function fill(){
  if(cloneRowsToFill())return;
  let attempts=0;
  const timer=setInterval(()=>{
    attempts++;
    if(cloneRowsToFill()||attempts>=40)clearInterval(timer);
  },100);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fill,{once:true});
else fill();
window.addEventListener("resize",()=>{if(window.matchMedia("(max-width:760px)").matches)cloneRowsToFill()},{passive:true});
})();