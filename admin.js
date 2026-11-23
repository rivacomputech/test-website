/* ════════════════════════════════════════════════════════════════════════
   Riva Computech — site admin
   Loaded only when the page is opened with ?admin (or #admin).
   · Click any text on the page to edit it
   · Click any image (logo, photo, tech logos) to replace it
   · Site settings: page title, meta description, contact email
   · Save by publishing to GitHub (your token is the login),
     or by downloading the updated index.html to upload yourself.
   ════════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
if(window.__rcAdmin) return; window.__rcAdmin=true;

var d=document, root=d.documentElement;
var K={flag:"rc-admin",mode:"rc-admin-mode",token:"rc-admin-token",cfg:"rc-admin-gh"};
function $(s,c){return (c||d).querySelector(s)}
function $$(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))}
function store(area,k,v){try{var s=window[area]; if(v===undefined) return s.getItem(k); if(v===null) s.removeItem(k); else s.setItem(k,v)}catch(e){return null}}
function ss(k,v){return store("sessionStorage",k,v)}
function ls(k,v){return store("localStorage",k,v)}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}

/* ───────── what counts as editable ─────────
   Innermost match wins, so e.g. a list item made of a bold title + a description
   gets two separate editable pieces instead of one big block. */
var EDIT=["h1","h2","h3","h4","p","li","pre.adout",".kicker .cmd",".kicker i.plain",".cmp-h",".cmp-c > span",
  ".perks b",".perks span:not(.pi)",".steps b",".steps span",".hc-txt > b",".hc-txt > small",".cmdlet",".run",
  ".tech-lbl",".direct-row small",".direct-row .v",".sign > span:last-child",".avail-h b",".cta-row .btn",".legal > span"];
var SCOPED=EDIT.map(function(s){return "main "+s+", footer "+s}).join(",");
/* parts the site's own scripts rewrite, so they're left alone */
var SKIP=".term, #editor, #hc-fixes, #hc-title, #hc-text, .ring-n, #form-status";
function editables(doc){
  var all=$$(SCOPED,doc).filter(function(el){return !el.closest(SKIP)});
  return all.filter(function(el){ for(var i=0;i<all.length;i++){ if(all[i]!==el&&el.contains(all[i])) return false } return true });
}

/* ───────── state ───────── */
var S={mode:null,cfg:null,token:null,editing:false,dirty:new Set(),images:new Map(),settings:{},saving:false};
var live=[];
var base={title:d.title,desc:metaDesc(d),email:findEmail(d)};
function metaDesc(doc){var m=doc.querySelector('meta[name="description"]'); return m?m.getAttribute("content")||"":""}
function findEmail(doc){var a=doc.querySelector('a[href^="mailto:"]'); return a?a.getAttribute("href").slice(7).split("?")[0]:""}

/* ───────── styles ───────── */
var css=d.createElement("style"); css.className="rca-ui";
css.textContent=[
"html.rca-on{scroll-padding-top:76px}",
"html.rca-on body{padding-top:56px}",
".rca-bar{position:fixed;left:0;right:0;top:0;z-index:250;height:56px;display:flex;align-items:center;gap:10px;padding:0 14px;overflow-x:auto;",
"  background:var(--acrylic-strong);border-bottom:1px solid var(--stroke);box-shadow:0 6px 24px -14px rgba(10,30,70,.4);backdrop-filter:blur(30px) saturate(1.6);-webkit-backdrop-filter:blur(30px) saturate(1.6);font:14px/1.2 var(--font);color:var(--text)}",
".rca-bar > *{flex:none}",
".rca-badge{display:inline-flex;align-items:center;gap:8px;font-weight:650}",
".rca-badge img{width:24px;height:24px}",
".rca-who{font-size:12.5px;color:var(--text-2);padding:4px 9px;border-radius:999px;background:var(--sunken);max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
".rca-hint{font-size:12.5px;color:var(--text-3)}",
".rca-sp{flex:1 1 auto;min-width:8px}",
".rca-count{font-size:13px;font-weight:600;color:var(--text-2)}",
".rca-count.on{color:var(--accent-ink)}",
".rca-tg{display:inline-flex;align-items:center;gap:9px;font-size:13.5px;font-weight:600;cursor:pointer;padding:0 6px}",
"@media (max-width:1100px){.rca-hint{display:none}}",
"@media (max-width:760px){.rca-who,.rca-count{display:none}.rca-bar .btn-sm{padding:0 10px}}",
/* editable outlines */
".rca-editing [data-rca-edit]{cursor:text;user-select:text;-webkit-user-select:text;outline:1px dashed transparent;outline-offset:3px;border-radius:3px;transition:outline-color .15s,background-color .15s}",
".rca-editing [data-rca-edit]:hover{outline-color:color-mix(in srgb,var(--accent) 60%,transparent)}",
".rca-editing [data-rca-edit].rca-dirty{outline-color:var(--ring-warn)}",
".rca-editing [data-rca-edit]:focus{outline:2px solid var(--accent);background:color-mix(in srgb,var(--accent) 7%,transparent)}",
".rca-editing main img,.rca-editing footer img,.rca-editing .taskbar img{cursor:copy;outline:2px dashed transparent;outline-offset:3px;transition:outline-color .15s}",
".rca-editing main img:hover,.rca-editing footer img:hover,.rca-editing .taskbar img:hover{outline-color:var(--accent)}",
".rca-editing img.rca-dirty{outline-color:var(--ring-warn)}",
/* dialogs */
".rca-modal{position:fixed;inset:0;z-index:260;display:grid;place-items:center;padding:20px;background:rgba(5,15,35,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);font:15px/1.5 var(--font);color:var(--text)}",
".rca-card{width:min(480px,100%);max-height:calc(100vh - 40px);overflow:auto;background:var(--win-body);border-radius:12px;box-shadow:var(--shadow-win);padding:24px 24px 22px}",
".rca-card h2{display:flex;align-items:center;gap:10px;font-size:21px;font-weight:650;margin:0 0 4px}",
".rca-card h2 img{width:28px;height:28px}",
".rca-sub{margin:0 0 18px;color:var(--text-2);font-size:14px}",
".rca-tabs{display:flex;gap:4px;padding:4px;margin:0 0 18px;border-radius:9px;background:var(--sunken)}",
".rca-tabs button{flex:1;height:34px;border:0;border-radius:6px;background:transparent;font:600 13.5px/1 var(--font);color:var(--text-2);cursor:pointer}",
".rca-tabs button[aria-selected=true]{background:var(--win-body);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.12)}",
".rca-help{margin:0 0 16px;font-size:13.5px;color:var(--text-2)}",
".rca-help a{color:var(--accent-ink)}",
".rca-f{display:grid;gap:5px;margin:0 0 12px;font-size:13px;font-weight:600;color:var(--text-2)}",
".rca-f small{font-weight:400;color:var(--text-3)}",
".rca-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
".rca-chk{display:flex;align-items:center;gap:8px;margin:2px 0 16px;font-size:13.5px;color:var(--text-2)}",
".rca-err{margin:0 0 14px;padding:9px 12px;border-radius:6px;font-size:13.5px;color:var(--bad);background:color-mix(in srgb,var(--bad) 10%,transparent)}",
".rca-err:empty{display:none}",
".rca-acts{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap}",
"textarea.rca-ta{min-height:90px}",
".rca-ui .toast{pointer-events:auto}"
].join("\n");
d.head.appendChild(css);

/* ───────── notices (reuses the site's toast look) ───────── */
function notify(title,body){
  var box=$("#toasts")||d.body, t=d.createElement("div"); t.className="toast"; t.setAttribute("role","status");
  t.innerHTML='<span class="toast-app"><img class="bmark" src="favicon.svg?v=2" alt="" /><span>Site admin</span></span><b>'+esc(title)+'</b>'+(body?'<p>'+esc(body)+'</p>':'')+
    '<button class="toast-x" type="button" aria-label="Dismiss"><svg viewBox="0 0 10 10"><use href="#c-x"/></svg></button>';
  box.appendChild(t); void t.offsetWidth; t.classList.add("in");
  function kill(){ if(!t.parentNode) return; t.classList.add("out"); setTimeout(function(){t.remove()},300) }
  t.querySelector(".toast-x").addEventListener("click",kill); setTimeout(kill,7000);
}

/* ───────── GitHub ───────── */
function encPath(p){return p.split("/").map(encodeURIComponent).join("/")}
function cUrl(p){return "https://api.github.com/repos/"+encPath(S.cfg.repo)+"/contents/"+encPath(p)}
async function gh(method,url,body,raw){
  var h={"Accept":raw?"application/vnd.github.raw+json":"application/vnd.github+json","Authorization":"Bearer "+S.token};
  if(body) h["Content-Type"]="application/json";
  var r;
  try{ r=await fetch(url,{method:method,headers:h,body:body?JSON.stringify(body):undefined,cache:"no-store"}) }
  catch(e){ throw new Error("Couldn't reach GitHub — check your connection.") }
  if(raw&&r.ok) return r.text();
  var j=null; try{ j=await r.json() }catch(e){}
  if(!r.ok){
    var m=(j&&j.message)||r.statusText;
    if(r.status===401) throw new Error("GitHub rejected the token. Check it's copied correctly and hasn't expired.");
    if(r.status===404) throw new Error("Couldn't find that repository, branch or file — or the token doesn't have access to it.");
    if(r.status===403) throw new Error("The token can't write to this repository. Give it Contents: Read and write. ("+m+")");
    if(r.status===409) throw new Error("The file changed on GitHub while you were editing. Reload and try again.");
    throw new Error("GitHub: "+m);
  }
  return j;
}
async function ghGet(path){
  var j=await gh("GET",cUrl(path)+"?ref="+encodeURIComponent(S.cfg.branch));
  if(Array.isArray(j)) throw new Error('"'+path+'" is a folder. Enter the path to your index.html file.');
  var text=(j.encoding==="base64"&&j.content)?b64utf8(j.content):await gh("GET",cUrl(path)+"?ref="+encodeURIComponent(S.cfg.branch),null,true);
  return {text:text,sha:j.sha};
}
function ghPut(path,b64,sha,msg){
  var body={message:msg,content:b64,branch:S.cfg.branch}; if(sha) body.sha=sha;
  return gh("PUT",cUrl(path),body);
}

/* ───────── base64 helpers ───────── */
function b64bytes(u){var s="",CH=0x8000; for(var i=0;i<u.length;i+=CH) s+=String.fromCharCode.apply(null,u.subarray(i,i+CH)); return btoa(s)}
function utf8b64(str){return b64bytes(new TextEncoder().encode(str))}
function b64utf8(b){var bin=atob(b.replace(/\s/g,"")),u=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return new TextDecoder().decode(u)}
async function fileB64(f){return b64bytes(new Uint8Array(await f.arrayBuffer()))}

/* ───────── login ───────── */
function dialog(html){
  var m=d.createElement("div"); m.className="rca-modal rca-ui"; m.innerHTML='<div class="rca-card" role="dialog" aria-modal="true">'+html+'</div>';
  d.body.appendChild(m); return m;
}
function showLogin(msg){
  var cfg={}; try{ cfg=JSON.parse(ls(K.cfg)||"{}") }catch(e){}
  var m=dialog(
    '<h2><img src="favicon.svg?v=2" alt="" />Site admin</h2>'+
    '<p class="rca-sub">Sign in to edit the text and images on this page.</p>'+
    '<div class="rca-tabs" role="tablist">'+
      '<button type="button" role="tab" data-tab="gh" aria-selected="true">Publish to GitHub</button>'+
      '<button type="button" role="tab" data-tab="dl" aria-selected="false">Edit &amp; download</button></div>'+
    '<form data-pane="gh" novalidate>'+
      '<p class="rca-help">Changes go straight to the GitHub repository your site is deployed from. Your access token is the login: only a token with write access to the repo can publish anything.</p>'+
      '<label class="rca-f">Repository <small>owner/name</small><input class="field" name="repo" required placeholder="your-username/rivacomputech" autocomplete="off" spellcheck="false" /></label>'+
      '<div class="rca-row"><label class="rca-f">Branch<input class="field" name="branch" required value="main" autocomplete="off" spellcheck="false" /></label>'+
      '<label class="rca-f">File<input class="field" name="path" required value="index.html" autocomplete="off" spellcheck="false" /></label></div>'+
      '<label class="rca-f">Access token <small>fine-grained token with Contents: Read and write on this repo</small><input class="field" name="token" type="password" required autocomplete="off" spellcheck="false" /></label>'+
      '<label class="rca-chk"><input type="checkbox" name="remember" /> Keep me signed in on this device</label>'+
      '<p class="rca-err" role="alert"></p>'+
      '<div class="rca-acts"><button type="button" class="btn btn-std btn-sm" data-act="cancel">Cancel</button><button type="submit" class="btn btn-accent btn-sm">Sign in</button></div>'+
    '</form>'+
    '<div data-pane="dl" hidden>'+
      '<p class="rca-help">Edit right on the page, then download the updated <b>index.html</b> and upload it to your web host the way you normally do. Nothing is saved to the server from here, so no sign-in is needed. Replaced images are embedded in the file.</p>'+
      '<div class="rca-acts"><button type="button" class="btn btn-std btn-sm" data-act="cancel">Cancel</button><button type="button" class="btn btn-accent btn-sm" data-act="dl">Start editing</button></div>'+
    '</div>');
  var f=$("form",m), err=$(".rca-err",m);
  if(cfg.repo) f.repo.value=cfg.repo; if(cfg.branch) f.branch.value=cfg.branch; if(cfg.path) f.path.value=cfg.path;
  if(msg) err.textContent=msg;
  $$("[data-tab]",m).forEach(function(b){ b.addEventListener("click",function(){
    $$("[data-tab]",m).forEach(function(x){x.setAttribute("aria-selected",x===b)});
    $$("[data-pane]",m).forEach(function(p){p.hidden=p.getAttribute("data-pane")!==b.getAttribute("data-tab")});
  })});
  $$('[data-act="cancel"]',m).forEach(function(b){ b.addEventListener("click",function(){ m.remove(); leave() }) });
  $('[data-act="dl"]',m).addEventListener("click",function(){ m.remove(); S.mode="dl"; ss(K.mode,"dl"); start() });
  f.addEventListener("submit",async function(e){
    e.preventDefault(); err.textContent="";
    var repo=f.repo.value.trim().replace(/^https?:\/\/github\.com\//i,"").replace(/\.git$/,"").replace(/\/+$/,"");
    var c={repo:repo,branch:f.branch.value.trim()||"main",path:f.path.value.trim().replace(/^\/+/,"")||"index.html"};
    var tok=f.token.value.trim();
    if(!/^[\w.-]+\/[\w.-]+$/.test(c.repo)){ err.textContent="Enter the repository as owner/name, e.g. devik/rivacomputech."; return }
    if(!tok){ err.textContent="Paste your GitHub access token."; return }
    var btn=$('button[type="submit"]',f); btn.disabled=true; btn.textContent="Signing in…";
    S.cfg=c; S.token=tok;
    try{
      var file=await ghGet(c.path);
      checkSame(file.text);
      ls(K.cfg,JSON.stringify(c));
      if(f.remember.checked){ ls(K.token,tok); ss(K.token,null) } else { ss(K.token,tok); ls(K.token,null) }
      S.mode="gh"; ss(K.mode,"gh"); m.remove(); start();
    }catch(x){ err.textContent=x.message; S.token=null; btn.disabled=false; btn.textContent="Sign in" }
  });
  setTimeout(function(){ (f.repo.value?f.token:f.repo).focus() },30);
}
/* make sure the file we'd save into is really this page */
function checkSame(src){
  var doc=new DOMParser().parseFromString(src,"text/html");
  if(editables(doc).length!==editables(d).length)
    throw new Error("That file doesn't match the page you're on. Check the file path — or, if you published very recently, wait a minute for the site to update and reload.");
}
function leave(){
  ss(K.flag,null); ss(K.mode,null);
  try{ history.replaceState(null,"",location.pathname) }catch(e){}
  root.classList.remove("rca-on","rca-editing");
}

/* ───────── toolbar ───────── */
var bar, countEl, saveBtn, editSw;
function buildBar(){
  bar=d.createElement("div"); bar.className="rca-bar rca-ui"; bar.setAttribute("role","toolbar"); bar.setAttribute("aria-label","Site admin");
  var who=S.mode==="gh"?"GitHub · "+S.cfg.repo+" @ "+S.cfg.branch:"Download mode";
  bar.innerHTML=
    '<span class="rca-badge"><img src="favicon.svg?v=2" alt="" />Admin</span>'+
    '<span class="rca-who" title="'+esc(who)+'">'+esc(who)+'</span>'+
    '<span class="rca-hint">Click text to edit · click an image to replace it</span>'+
    '<span class="rca-sp"></span>'+
    '<span class="rca-count" aria-live="polite">No changes</span>'+
    '<label class="rca-tg">Edit<span class="sw"><input type="checkbox" role="switch" checked /><i></i></span></label>'+
    '<button type="button" class="btn btn-std btn-sm" data-act="settings">Site settings</button>'+
    '<button type="button" class="btn btn-std btn-sm" data-act="discard">Discard</button>'+
    '<button type="button" class="btn btn-accent btn-sm" data-act="save">'+(S.mode==="gh"?"Publish":"Download")+'</button>'+
    '<button type="button" class="btn btn-std btn-sm" data-act="out">Sign out</button>';
  d.body.appendChild(bar);
  countEl=$(".rca-count",bar); saveBtn=$('[data-act="save"]',bar); editSw=$(".rca-tg input",bar);
  editSw.addEventListener("change",function(){ setEditing(editSw.checked) });
  $('[data-act="settings"]',bar).addEventListener("click",showSettings);
  $('[data-act="discard"]',bar).addEventListener("click",function(){
    if(!changes()||confirm("Discard all unsaved changes?")){ S.dirty.clear(); S.images.clear(); S.settings={}; leaving=true; location.reload() }
  });
  $('[data-act="save"]',bar).addEventListener("click",save);
  $('[data-act="out"]',bar).addEventListener("click",function(){
    if(changes()&&!confirm("You have unsaved changes. Sign out anyway?")) return;
    ss(K.token,null); ls(K.token,null); leaving=true; leave(); location.href=location.pathname;
  });
  count();
}
function changes(){ return S.dirty.size+S.images.size+Object.keys(S.settings).length }
function count(){
  var n=changes();
  countEl.textContent=n?n+" unsaved change"+(n===1?"":"s"):"No changes";
  countEl.classList.toggle("on",!!n);
  saveBtn.disabled=!n||S.saving;
}

/* ───────── editing ───────── */
function start(){
  ss(K.flag,"1");
  root.classList.add("rca-on");
  $$(".rv").forEach(function(e){e.classList.add("in")});
  live=editables(d);
  live.forEach(function(el,i){ el.__rcaI=i });
  buildBar(); setEditing(true);
  notify("You're in admin mode","Click any text to edit it, or any image to replace it. "+(S.mode==="gh"?"Publish":"Download")+" when you're done.");
}
function setEditing(on){
  S.editing=on; root.classList.toggle("rca-editing",on);
  live.forEach(function(el){
    if(on){ el.setAttribute("contenteditable","true"); el.setAttribute("data-rca-edit","") }
    else { el.removeAttribute("contenteditable"); el.removeAttribute("data-rca-edit"); el.blur() }
  });
}
d.addEventListener("input",function(e){
  var el=e.target.closest&&e.target.closest("[data-rca-edit]"); if(!el||el.__rcaI==null) return;
  S.dirty.add(el.__rcaI); el.classList.add("rca-dirty"); count();
});
d.addEventListener("keydown",function(e){
  var el=e.target.closest&&e.target.closest("[data-rca-edit]"); if(!el) return;
  if(e.key==="Enter"){ e.preventDefault(); if(e.shiftKey) d.execCommand("insertLineBreak"); else el.blur() }
  else if(e.key==="Escape"){ el.blur() }
});
d.addEventListener("paste",function(e){
  var el=e.target.closest&&e.target.closest("[data-rca-edit]"); if(!el) return;
  e.preventDefault(); var t=(e.clipboardData||window.clipboardData).getData("text/plain").replace(/\s*\n\s*/g," ");
  d.execCommand("insertText",false,t);
});
/* while editing, links/buttons/switches on the page don't fire, and images open a file picker */
window.addEventListener("click",function(e){
  if(!S.editing) return;
  var t=e.target; if(!(t instanceof Element)||t.closest(".rca-ui")) return;
  var img=t.closest("img");
  if(img&&img.closest("main, footer, .taskbar")){ e.preventDefault(); e.stopPropagation(); pickImage(img); return }
  if(t.closest("main, footer")&&t.closest("a, label, button, [data-cap]")){ e.preventDefault(); e.stopPropagation() }
},true);
var leaving=false;
window.addEventListener("beforeunload",function(e){ if(!leaving&&changes()){ e.preventDefault(); e.returnValue="" } });

/* ───────── images ───────── */
var picker=d.createElement("input"); picker.type="file"; picker.accept="image/*"; picker.hidden=true; picker.className="rca-ui"; d.body.appendChild(picker);
function origOf(img){ return img.getAttribute("data-rca-orig")||img.getAttribute("src") }
function pickImage(img){
  var orig=origOf(img); if(!orig) return;
  picker.onchange=function(){
    var f=picker.files[0]; picker.value=""; if(!f) return;
    if(!/^image\//.test(f.type)){ notify("That isn't an image","Choose a PNG, JPG, SVG or WebP file."); return }
    if(f.size>5*1024*1024){ notify("That image is too big","Please use a file under 5 MB."); return }
    S.images.set(orig,f);
    var url=URL.createObjectURL(f), n=0;
    $$("img").forEach(function(i){ if(i.closest(".rca-ui")) return; if(origOf(i)===orig){ i.setAttribute("data-rca-orig",orig); i.src=url; i.removeAttribute("srcset"); i.classList.add("rca-dirty"); n++ } });
    count();
    notify("Image replaced","Updated in "+n+" place"+(n===1?"":"s")+" on the page.");
  };
  picker.click();
}

/* ───────── site settings ───────── */
function showSettings(){
  var cur={title:S.settings.title!=null?S.settings.title:base.title,desc:S.settings.desc!=null?S.settings.desc:base.desc,email:S.settings.email!=null?S.settings.email:base.email};
  var m=dialog(
    '<h2>Site settings</h2><p class="rca-sub">These apply when you '+(S.mode==="gh"?"publish":"download")+'.</p>'+
    '<form novalidate>'+
    '<label class="rca-f">Page title <small>shown in the browser tab and Google results</small><input class="field" name="title" /></label>'+
    '<label class="rca-f">Description <small>the summary Google shows under your title</small><textarea class="field rca-ta" name="desc" rows="3"></textarea></label>'+
    '<label class="rca-f">Contact email <small>replaced everywhere on the site, including the contact form and links</small><input class="field" name="email" type="email" /></label>'+
    '<p class="rca-err" role="alert"></p>'+
    '<div class="rca-acts"><button type="button" class="btn btn-std btn-sm" data-act="cancel">Cancel</button><button type="submit" class="btn btn-accent btn-sm">Apply</button></div></form>');
  var f=$("form",m); f.title.value=cur.title; f.desc.value=cur.desc; f.email.value=cur.email;
  $('[data-act="cancel"]',m).addEventListener("click",function(){m.remove()});
  m.addEventListener("click",function(e){ if(e.target===m) m.remove() });
  f.addEventListener("submit",function(e){
    e.preventDefault();
    var v={title:f.title.value.trim(),desc:f.desc.value.trim(),email:f.email.value.trim()};
    if(!v.title){ $(".rca-err",m).textContent="The page title can't be empty."; return }
    if(base.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)){ $(".rca-err",m).textContent="That email address doesn't look right."; return }
    S.settings={};
    ["title","desc","email"].forEach(function(k){ if(v[k]!==base[k]) S.settings[k]=v[k] });
    d.title=v.title; count(); m.remove();
  });
  f.title.focus();
}

/* ───────── build the new index.html from the original source ───────── */
function attr(s){ return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;") }
function clean(el){
  var c=el.cloneNode(true);
  $$("[contenteditable],[data-rca-edit]",c).forEach(function(x){x.removeAttribute("contenteditable");x.removeAttribute("data-rca-edit")});
  $$("span[style]:not([class]),font",c).forEach(function(x){ while(x.firstChild) x.parentNode.insertBefore(x.firstChild,x); x.remove() });
  return c.innerHTML;
}
function build(src,imgMap){
  var doc=new DOMParser().parseFromString(src,"text/html");
  var targets=editables(doc);
  if(targets.length!==live.length) throw new Error("The saved copy of the page doesn't match the one you're editing — it may have changed since you opened it. Reload and try again.");
  S.dirty.forEach(function(i){ targets[i].innerHTML=clean(live[i]) });
  var st=S.settings;
  if(st.title!=null){ var t=doc.querySelector("title"); if(t) t.textContent=st.title }
  if(st.desc!=null){ ['meta[name="description"]','meta[property="og:description"]'].forEach(function(q){ var x=doc.querySelector(q); if(x) x.setAttribute("content",st.desc) }) }
  var out="<!doctype html>\n"+doc.documentElement.outerHTML+"\n";
  Object.keys(imgMap).forEach(function(o){ out=out.split('src="'+attr(o)+'"').join('src="'+attr(imgMap[o])+'"') });
  if(st.email!=null&&base.email) out=out.split(base.email).join(st.email);
  return out;
}
function safeName(n){ var p=n.toLowerCase().replace(/[^a-z0-9.]+/g,"-").replace(/^-+|-+$/g,""); return p||"image" }

async function save(){
  if(S.saving||!changes()) return;
  if(d.activeElement&&d.activeElement.blur) d.activeElement.blur();
  S.saving=true; count(); var label=saveBtn.textContent; saveBtn.textContent=S.mode==="gh"?"Publishing…":"Preparing…";
  try{
    var src, sha, imgMap={}, dir="";
    if(S.mode==="gh"){
      var f=await ghGet(S.cfg.path); src=f.text; sha=f.sha;
      dir=S.cfg.path.indexOf("/")>-1?S.cfg.path.replace(/[^/]+$/,""):"";
    } else {
      var r=await fetch(location.pathname,{cache:"no-store"});
      if(!r.ok) throw new Error("Couldn't load the page source ("+r.status+"). Open the site through its web address, not as a local file.");
      src=await r.text();
    }
    build(src,{}); /* fail early, before uploading anything, if the page doesn't match */
    var entries=Array.from(S.images.entries());
    for(var i=0;i<entries.length;i++){
      var orig=entries[i][0], file=entries[i][1];
      if(S.mode==="gh"){
        var rel="assets/uploads/"+Date.now().toString(36)+"-"+safeName(file.name);
        await ghPut(dir+rel,await fileB64(file),null,"Upload "+file.name+" (site admin)");
        imgMap[orig]=rel;
      } else {
        imgMap[orig]="data:"+(file.type||"image/png")+";base64,"+await fileB64(file);
      }
    }
    var html=build(src,imgMap);
    if(S.mode==="gh"){
      await ghPut(S.cfg.path,utf8b64(html),sha,"Update site content (site admin)");
      /* what's on GitHub is now the new baseline */
      Object.keys(imgMap).forEach(function(o){ $$('img[data-rca-orig="'+o.replace(/"/g,'\\"')+'"]').forEach(function(i){ i.setAttribute("data-rca-orig",imgMap[o]); i.classList.remove("rca-dirty") }) });
      ["title","desc","email"].forEach(function(k){ if(S.settings[k]!=null) base[k]=S.settings[k] });
      S.dirty.clear(); S.images.clear(); S.settings={};
      $$(".rca-dirty").forEach(function(x){x.classList.remove("rca-dirty")});
      notify("Published","Your changes are saved to GitHub. The live site usually updates within a minute or two.");
    } else {
      var a=d.createElement("a"), url=URL.createObjectURL(new Blob([html],{type:"text/html"}));
      a.href=url; a.download="index.html"; a.className="rca-ui"; d.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){URL.revokeObjectURL(url)},4000);
      notify("Downloaded index.html","Upload it to your host, replacing the current index.html. Your edits stay here until you sign out, so you can keep going and download again.");
    }
  }catch(err){
    notify(S.mode==="gh"?"Couldn't publish":"Couldn't download",err.message||String(err));
  }finally{
    S.saving=false; saveBtn.textContent=label; count();
  }
}

/* ───────── boot ───────── */
(function boot(){
  if(ss(K.flag)==="1"&&ss(K.mode)==="dl"){ S.mode="dl"; start(); return }
  if(ss(K.flag)==="1"&&ss(K.mode)==="gh"){
    var tok=ss(K.token)||ls(K.token), cfg=null; try{ cfg=JSON.parse(ls(K.cfg)||"null") }catch(e){}
    if(tok&&cfg){ S.mode="gh"; S.token=tok; S.cfg=cfg; start(); return }
  }
  var tok2=ls(K.token), cfg2=null; try{ cfg2=JSON.parse(ls(K.cfg)||"null") }catch(e){}
  if(tok2&&cfg2){ S.mode="gh"; S.token=tok2; S.cfg=cfg2; ss(K.mode,"gh"); start(); return }
  showLogin();
})();
})();
