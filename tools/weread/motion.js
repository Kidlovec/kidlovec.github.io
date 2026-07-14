const reduce = matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.classList.toggle('reduce-motion', reduce.matches);
reduce.addEventListener?.('change', event => document.documentElement.classList.toggle('reduce-motion', event.matches));
const canMove = () => !reduce.matches;

const loading = document.createElement('div');
loading.className = 'app-loading-bar';
loading.setAttribute('aria-hidden', 'true');
document.body.prepend(loading);

const dataSurfaces = [...document.querySelectorAll('#lifetime,#footprint,#annual,#shelf,#notes')];
dataSurfaces.forEach(el => el.classList.add('data-surface'));
function startLoading(){ loading.classList.add('active'); dataSurfaces.forEach(el => el.classList.add('is-updating')) }
function stopLoading(){ loading.classList.remove('active'); dataSurfaces.forEach(el => el.classList.remove('is-updating')) }
$('#refresh')?.addEventListener('click', startLoading, true);
if(new URLSearchParams(location.search).has('autoload')) startLoading();

function $(selector){ return document.querySelector(selector) }
const toast = $('#toast');
if(toast) new MutationObserver(() => {
  if(/已完成同步|已更新|失败|需要升级|预览演示/.test(toast.textContent)) stopLoading();
}).observe(toast,{childList:true,subtree:true,characterData:true});

const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
  if(entry.isIntersecting){ entry.target.classList.add('revealed'); reveal.unobserve(entry.target) }
}),{threshold:.08,rootMargin:'0px 0px -6%'});
document.querySelectorAll('main>section').forEach((section,index) => {
  if(index<=1) return;
  section.classList.add('reveal-ready'); reveal.observe(section);
});
if(location.hash){const target=document.querySelector(location.hash);target?.classList.add('revealed');requestAnimationFrame(()=>target?.scrollIntoView({block:'start'}))}

function animateGroup(container,selector,keyframes,options={}){
  if(!canMove() || !container) return;
  [...container.querySelectorAll(selector)].forEach((el,index) => el.animate(keyframes,{duration:options.duration||520,delay:Math.min(index*(options.stagger||22),options.maxDelay||650),easing:'cubic-bezier(.22,1,.36,1)',fill:'both'}));
}
const animations = new Map([
  ['lifetimeMetrics',['.lifetime-metric',[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:560,stagger:70}]],
  ['yearTimeline',['.year-card',[{opacity:0,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:560,stagger:45,maxDelay:500}]],
  ['titleWheel',['.title-ring-group',[{opacity:0},{opacity:.75}],{duration:850,stagger:45,maxDelay:520}]],
  ['lifetimeLongest',['li',[{opacity:0,transform:'translateX(10px)'},{opacity:1,transform:'translateX(0)'}],{duration:430,stagger:55,maxDelay:380}]],
  ['lifetimePreferences',['.archive-preference-list>div,.archive-authors',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:430,stagger:50,maxDelay:360}]],
  ['lifetimePortrait',['.compact-dimensions>div',[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:430,stagger:55,maxDelay:380}]],
  ['heatmap', ['i:not(.blank)',[{opacity:0,transform:'scale(.15)'},{opacity:1,transform:'scale(1)'}],{duration:420,stagger:2,maxDelay:720}]],
  ['monthChart',['.month-bar i',[{opacity:.25,transform:'scaleY(0)'},{opacity:1,transform:'scaleY(1)'}],{duration:650,stagger:45}]],
  ['categories',['.category b i',[{opacity:.2,transform:'scaleX(0)',transformOrigin:'left'},{opacity:1,transform:'scaleX(1)',transformOrigin:'left'}],{duration:650,stagger:70}]],
  ['authors',['.rank-line i',[{opacity:.2,transform:'scaleX(0)',transformOrigin:'left'},{opacity:1,transform:'scaleX(1)',transformOrigin:'left'}],{duration:650,stagger:70}]],
  ['timeBars',['i',[{opacity:.15,transform:'scaleY(0)'},{opacity:1,transform:'scaleY(1)'}],{duration:520,stagger:18}]],
  ['bookRing',['.ring-title',[{opacity:0,transform:'translate(-50%,-50%) scale(.65)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}],{duration:580,stagger:24}]],
  ['bookList',['.book-card',[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:440,stagger:24,maxDelay:420}]],
  ['noteRanking',['.note-row',[{opacity:0,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}],{duration:420,stagger:25,maxDelay:450}]]
]);
for(const [id,[selector,frames,options]] of animations){
  const container=document.getElementById(id); if(!container) continue;
  new MutationObserver(() => requestAnimationFrame(() => animateGroup(container,selector,frames,options))).observe(container,{childList:true});
}

const metricState = new WeakMap();
function numericParts(text){ return [...text.matchAll(/[\d,.]+/g)].map(m => ({index:m.index,length:m[0].length,value:Number(m[0].replaceAll(',',''))})) }
function animateMetric(el,target){
  const previous=metricState.get(el)||el.textContent,from=numericParts(previous),to=numericParts(target);
  if(previous===target) return;
  metricState.set(el,target);
  if(!canMove()||from.length!==to.length){el.textContent=target;return}
  const start=performance.now(),duration=620; el.dataset.counting='true';
  const tick=now=>{const t=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-t,3);let output=target,offset=0;to.forEach((part,i)=>{const value=Math.round(from[i].value+(part.value-from[i].value)*eased).toLocaleString();const at=part.index+offset;output=output.slice(0,at)+value+output.slice(at+part.length);offset+=value.length-part.length});el.textContent=output;if(t<1)requestAnimationFrame(tick);else{el.textContent=target;delete el.dataset.counting}};requestAnimationFrame(tick)
}
document.querySelectorAll('.metrics strong,.lifetime-metric strong').forEach(el => metricState.set(el,el.textContent));
const metricObserver = new MutationObserver(records => records.forEach(record => {
  const el=record.target.nodeType===3?record.target.parentElement:record.target;
    if(!el?.matches?.('.metrics strong,.lifetime-metric strong')||el.dataset.counting) return;
  animateMetric(el,el.textContent);
}));
document.querySelectorAll('.metrics strong,.lifetime-metric strong').forEach(el => metricObserver.observe(el,{childList:true,characterData:true,subtree:true}));

document.addEventListener('click',event=>{
  const period=event.target.closest('.periods button,#yearSelect');
  if(period){startLoading();setTimeout(stopLoading,900)}
  const tab=event.target.closest('.drawer-tabs button');
  if(tab&&canMove()){requestAnimationFrame(()=>{const pane=document.querySelector('.drawer-pane.active');if(!pane)return;pane.classList.remove('motion-enter');void pane.offsetWidth;pane.classList.add('motion-enter')})}
});
