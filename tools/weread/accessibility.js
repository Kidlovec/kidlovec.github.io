const drawer=document.getElementById('bookDrawer');
const content=document.getElementById('drawerContent');
const pageSurfaces=[...document.querySelectorAll('.topbar,main,footer,.mobile-nav')];
let opener=null;

function updateBookUrl(bookId){const params=new URLSearchParams(location.search);if(bookId)params.set('book',bookId);else params.delete('book');history.replaceState(null,'',`${location.pathname}${params.size?`?${params}`:''}${location.hash}`)}
function focusables(){return [...drawer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getClientRects().length)}
function skeleton(){return `<div class="drawer-skeleton" role="status" aria-label="正在读取书籍详情"><i class="sk-cover"></i><div><i></i><i></i><i></i></div><i class="sk-line"></i><i class="sk-line"></i><i class="sk-line short"></i></div>`}

document.addEventListener('click',event=>{const target=event.target.closest('[data-book]');if(target)opener=target},true);
document.addEventListener('keydown',event=>{
  const target=event.target.closest?.('[role="button"][data-book]');
  if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();opener=target;target.click();return}
  const tab=event.target.closest?.('.drawer-tabs [role="tab"]');
  if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();
    const tabs=[...tab.parentElement.querySelectorAll('[role="tab"]')],index=tabs.indexOf(tab);
    const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
    next.click();next.focus();return;
  }
  if(event.key!=='Tab'||drawer.getAttribute('aria-hidden')!=='false')return;
  const list=focusables();if(!list.length){event.preventDefault();drawer.focus();return}
  const first=list[0],last=list.at(-1),inside=drawer.contains(document.activeElement);if(!inside){event.preventDefault();(event.shiftKey?last:first).focus()}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
});

function handleDrawerState(){
  const open=drawer.getAttribute('aria-hidden')==='false';
  document.body.classList.toggle('drawer-open',open);
  pageSurfaces.forEach(surface=>surface.inert=open);
  if(open){opener??=document.activeElement===document.body?null:document.activeElement;updateBookUrl(drawer.dataset.bookId||opener?.dataset.book||new URLSearchParams(location.search).get('book')||'');if(content.textContent.includes('正在读取详情'))content.innerHTML=skeleton();requestAnimationFrame(()=>document.getElementById('drawerClose')?.focus())}
  else{updateBookUrl(null);const target=opener;opener=null;requestAnimationFrame(()=>target?.isConnected&&target.focus?.())}
}
new MutationObserver(handleDrawerState).observe(drawer,{attributes:true,attributeFilter:['aria-hidden']});
handleDrawerState();

new MutationObserver(()=>{
  document.querySelectorAll('[data-book][role="button"]').forEach(el=>{if(!el.hasAttribute('tabindex'))el.tabIndex=0});
}).observe(document.body,{childList:true,subtree:true});

new MutationObserver(()=>{
  const only=content.children.length===1?content.firstElementChild:null;
  if(only?.matches('p.empty')&&!only.textContent.includes('正在')){const message=only.textContent;content.innerHTML=`<div class="empty-state"><strong>这本书暂时没有载入</strong><span>${message}。你可以关闭后重试，其他阅读数据不会受影响。</span><button type="button" id="drawerErrorClose">关闭详情</button></div>`;document.getElementById('drawerErrorClose').onclick=()=>document.getElementById('drawerClose').click()}
}).observe(content,{childList:true});

const navLinks=[...document.querySelectorAll('.topbar nav a,.mobile-nav a')];
const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  navLinks.forEach(link=>{const active=link.getAttribute('href')===`#${entry.target.id}`;if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
}),{rootMargin:'-25% 0px -65%',threshold:0});
document.querySelectorAll('#lifetime,#annual,#shelf,#notes').forEach(section=>sectionObserver.observe(section));
