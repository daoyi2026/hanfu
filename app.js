'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const recordById = id => RECORDS.find(record => record.id === id);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const behavior = () => reducedMotion() ? 'instant' : 'smooth';
let saved = new Set();
try { const stored = JSON.parse(localStorage.getItem('yizhang-saved') || '[]'); if (Array.isArray(stored)) saved = new Set(stored.filter(id => typeof id === 'string')); } catch {}
let activeEra = 'qin', filter = 'all', scrollMode = 'redraw', currentRecord = null, currentTab = 'artwork', artworkMode = 'original', selectedImage = 0;
let lastDetailTrigger = null, toastTimer;
const viewport = $('#scroll-viewport'), detail = $('#detail-dialog'), zoom = $('#zoom-dialog');
const tabs = [['artwork','原图与重绘'],['flat','平面展开'],['research','学术解读'],['accessories','配饰与细节']];

function landscape() {
  return '<svg class="scroll-landscape" viewBox="0 0 4600 500" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#8a9274" stroke-width="1"><path d="M0 419Q140 365 290 415T610 404T940 422T1250 402T1580 416T1930 398T2240 420T2540 400T2880 415T3220 401T3540 420T3840 401T4170 417T4600 398"/><path d="M0 432Q200 407 360 436T700 425T1060 437T1430 422T1830 440T2220 423T2590 440T3000 422T3400 443T3810 424T4210 440T4600 421"/><path d="M0 446Q370 432 580 450T1150 451T1700 450T2300 451T2870 450T3500 453T4070 450T4600 447"/></g><g fill="#9ea98b" opacity=".25"><path d="M0 372L78 330L115 346L163 304L226 344L283 312L348 363L420 349L502 391L602 416H0Z"/><path d="M760 395L810 365L840 382L902 306L939 329L992 265L1040 299L1073 282L1154 370L1260 397L1350 428H720Z"/><path d="M1550 405L1610 360L1660 380L1720 310L1762 346L1790 330L1870 375L1970 418H1550Z"/><path d="M2390 415L2450 360L2490 380L2550 310L2615 267L2660 319L2710 300L2790 370L2890 400L2950 425H2360Z"/><path d="M3470 412L3535 330L3580 352L3640 281L3690 315L3730 303L3820 386L3920 410L4030 434H3430Z"/></g></svg>';
}
function renderScroll() {
  $('#scroll-track').innerHTML = landscape() + '<div class="scroll-preface"><h2>衣冠千年</h2><p>一襟一袖皆有来处<br>一针一线俱是时光</p><span class="small-seal">衣章</span></div>' + RECORDS.map((r,index) => `<article class="scroll-scene ${r.type}${scrollMode==='original'?' original-mode':''}" id="scene-${r.id}" data-scene="${r.id}" style="--accent:${r.color}"><div class="scene-era"><strong>${r.era}</strong><span>${r.en} · ${r.range}</span></div><button class="scene-painting" data-detail="${r.id}" aria-label="细看${r.era}：${r.name}"><img src="${r[scrollMode]}" alt="${r.name} · ${scrollMode==='redraw'?'据文物原图重绘，细节以原图为准':'文物来源图'}" loading="${index<3?'eager':'lazy'}" draggable="false"></button><div class="scene-caption"><div><h3>${r.title}</h3><p>${r.name}</p></div><span class="scene-index">${String(index+1).padStart(2,'0')}</span></div></article>`).join('') + '<div class="scroll-ending"><h2>衣脉相承</h2><p>看过来时路<br>再穿今日衣</p><span class="small-seal">续</span></div>';
}
function renderTimeline() {
  $('#timeline').innerHTML = RECORDS.map(r => `<button data-era="${r.id}" class="${r.id===activeEra?'active':''}" aria-pressed="${r.id===activeEra}" aria-controls="scroll-viewport">${r.era}<small>${r.range}</small></button>`).join('');
}
function updateScrollState() {
  const max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
  const offset = viewport.scrollLeft;
  $('#scroll-position').value = Math.round(offset / max * 1000);
  $('#scroll-position').setAttribute('aria-valuetext', `长卷已展开 ${Math.round(offset/max*100)}%`);
  $('#scroll-prev').disabled = offset < 2;
  $('#scroll-next').disabled = offset >= max - 2;
  const center = offset + viewport.clientWidth * .5;
  let closest = RECORDS[0], distance = Infinity;
  for (const r of RECORDS) {
    const scene = $(`#scene-${r.id}`), d = Math.abs(scene.offsetLeft + scene.offsetWidth/2 - center);
    if (d < distance) { distance=d; closest=r; }
  }
  if (offset < 50) closest=RECORDS[0];
  activeEra=closest.id;
  $$('[data-era]').forEach(button=>{const on=button.dataset.era===activeEra;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
  $('#scroll-readout').textContent = offset<10 ? '卷首 · 先秦' : offset>max-10 ? '卷末 · 衣脉相承' : `${String(RECORDS.indexOf(closest)+1).padStart(2,'0')} / 09 · ${closest.era}`;
}
function goToEra(id) {
  const scene = $(`#scene-${id}`); if (!scene) return;
  viewport.scrollTo({left: Math.max(0,scene.offsetLeft-(viewport.clientWidth-scene.offsetWidth)/2), behavior:behavior()});
}
function setScrollMode(mode) {
  scrollMode=mode;
  $$('[data-scroll-mode]').forEach(button=>{const on=button.dataset.scrollMode===mode;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
  RECORDS.forEach(r=>{const scene=$(`#scene-${r.id}`);scene.classList.toggle('original-mode',mode==='original');const img=scene.querySelector('img');img.src=r[mode];img.alt=`${r.name} · ${mode==='original'?'文物来源图':'据原图重绘，细节以原图为准'}`;});
}
function updateSavedButtons() {
  $$('[data-save]').forEach(button=>{const id=button.dataset.save;const on=saved.has(id);const r=recordById(id);button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',`${on?'取消收藏':'收藏'}${r.name}`);button.textContent=button.classList.contains('save-card')?(on?'♥':'♡'):(on?'♥ 已收入藏衣 · 点击移出':'♡ 收入我的藏衣');});
  $('#saved-count').textContent=String(RECORDS.filter(r=>saved.has(r.id)).length).padStart(2,'0');
}
function renderCards() {
  const query=$('#search').value.trim().toLocaleLowerCase();
  const matches=RECORDS.filter(r=>(filter==='all'||(filter==='saved'?saved.has(r.id):r.type===filter))&&[r.era,r.name,r.material,r.museum,r.date,...r.tags].join(' ').toLocaleLowerCase().includes(query));
  $('#cards').innerHTML=matches.length?matches.map(r=>`<article class="card"><button class="card-open" data-detail="${r.id}" aria-label="查看${r.name}"><div class="card-art"><span class="card-era">${r.era}</span><img src="${r.redraw}" loading="lazy" alt="${r.name}依据原图重绘"><span class="card-status">${r.type==='textile'?'实物有据':'古画有据'} · 可对照原图</span></div><h3 class="card-title"><span>${r.name}</span><span>↗</span></h3><div class="card-meta">${r.museum}<br>${r.short}</div></button><button class="save-card" data-save="${r.id}"></button></article>`).join(''):`<div class="empty">${filter==='saved'&&!query?'藏衣匣尚空。点击画卷上的 ♡，收藏喜欢的衣冠档案。':'没有找到相符的衣冠档案。试试其他朝代、衣名或材料。'}<button id="clear-filters">查看全部衣冠</button></div>`;
  $('#result-count').textContent=`共 ${matches.length} 份档案 · 原图、结构、研究与配饰可展开阅读`;
  $$('[data-filter]').forEach(button=>{const on=button.dataset.filter===filter;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));});
  updateSavedButtons();
}
function toast(message) {$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function toggleSaved(id) {
  saved.has(id)?saved.delete(id):saved.add(id);
  let persistent=true;
  try{localStorage.setItem('yizhang-saved',JSON.stringify([...saved]));}catch{persistent=false;}
  if(filter==='saved')renderCards();else updateSavedButtons();
  toast(persistent?(saved.has(id)?'已收入藏衣匣':'已从藏衣匣移出'):'本次收藏已更新，当前浏览器未能持久保存');
}
function sourceBlock(ids) {
  return `<section class="source-block"><h3>本页依据 · 可追溯来源</h3>${[...new Set(ids)].map(id=>{const s=SOURCES[id];return `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a>`;}).join('')}<p>解读由本站依据公开资料整理，重绘为 AI 视觉转译。未确定的细节保留为未知。</p></section>`;
}
function showDialog(markup) {
  lastDetailTrigger=document.activeElement;
  $('#dialog-content').innerHTML=markup;
  if(!detail.open)detail.showModal();
  document.body.style.overflow='hidden';
  detail.scrollTop=0;
}
function openDetail(id,tab='artwork') {
  const r=recordById(id);if(!r)return;
  currentRecord=r;currentTab=tab;artworkMode='original';selectedImage=0;
  showDialog(`<header class="detail-header"><p class="eyebrow">${r.en} · ${r.date}</p><h2 id="dialog-title">${r.name}</h2><div class="detail-subline"><span>${r.museum}</span><span>${r.type==='textile'?'服装实物档案':'绘画衣装档案'}</span><span>衣章 · 卷${String(RECORDS.indexOf(r)+1).padStart(2,'0')}</span></div></header><div class="detail-tabs" role="tablist" aria-label="衣冠档案内容">${tabs.map(([key,label])=>`<button role="tab" id="tab-${key}" data-tab="${key}" aria-selected="${key===tab}" tabindex="${key===tab?0:-1}" aria-controls="detail-panel">${label}</button>`).join('')}</div><div class="detail-panel" id="detail-panel" role="tabpanel" tabindex="0" aria-labelledby="tab-${tab}"></div>`);
  renderDetailPanel();
}
function originalImages(r) {return [{src:r.original,label:r.name},...(r.extra||[])];}
function artworkPanel(r) {
  const images=originalImages(r),chosen=artworkMode==='original'?images[selectedImage]:{src:r.redraw,label:'依据文物重绘'};
  return `<div class="artwork-layout"><div class="object-visual"><div class="image-mode"><div><button data-art-mode="original" class="${artworkMode==='original'?'active':''}" aria-pressed="${artworkMode==='original'}">文物原图</button><button data-art-mode="redraw" class="${artworkMode==='redraw'?'active':''}" aria-pressed="${artworkMode==='redraw'}">依据重绘</button></div><span>点击图像，可放大细看</span></div><button class="image-frame ${artworkMode==='redraw'?'redraw':''}" data-zoom-src="${chosen.src}" data-zoom-label="${escapeHTML(chosen.label)}" data-zoom-note="${escapeHTML(artworkMode==='original'?r.imageNote:'AI依据参考图重绘；色彩与细节整理属于视觉转译，不能代替原图。')}" aria-label="放大${artworkMode==='original'?'文物原图':'依据重绘'}"><img src="${chosen.src}" alt="${escapeHTML(chosen.label)}"></button>${artworkMode==='original'&&images.length>1?`<div class="image-thumbs" aria-label="选择文物图片">${images.map((item,i)=>`<button data-original-index="${i}" class="${i===selectedImage?'active':''}" aria-label="查看${item.label}" aria-pressed="${i===selectedImage}"><img src="${item.src}" alt="${item.label}"></button>`).join('')}</div>`:''}<p class="image-caption">${artworkMode==='original'?r.imageNote:'依据本档案原图进行的 AI 淡彩重绘。保留主体形态与配色关系；微小纹样、线条与色泽不作为史实证据。'}</p></div><div class="object-info"><blockquote>${r.intro}</blockquote><dl class="metadata">${[['年代',r.date],['馆藏',r.museum],['来源',r.origin],['编号',r.number],['材料',r.material],['尺寸',r.size]].map(([label,value])=>`<dt>${label}</dt><dd>${value}</dd>`).join('')}</dl><div class="evidence-badges">${r.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><button class="primary" data-save="${r.id}"></button></div></div>${sourceBlock(r.refs)}`;
}
function flatPanel(r) {
  return `<div class="flat-header"><h3>${r.type==='textile'?'平展结构 · 构件关系':'图像所见 · 结构关系'}</h3><span>${r.type==='textile'?'依实物与公开尺寸示意':'虚线为解释性轮廓'}</span></div><button class="image-frame flat-frame" data-zoom-src="assets/diagrams/${r.diagram}.svg" data-zoom-label="${escapeHTML(r.name)} · 结构示意" data-zoom-note="${escapeHTML(r.flatNote)}" aria-label="放大平面结构图"><img src="assets/diagrams/${r.diagram}.svg" alt="${r.name}结构示意，非裁剪纸样"></button><dl class="measurement-list">${r.measurements.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><p class="reading-intro">${r.flatNote}</p><button class="text-link" data-zoom-src="${r.original}" data-zoom-label="${escapeHTML(r.name)} · 原图对照" data-zoom-note="${escapeHTML(r.imageNote)}">${r.type==='textile'?'放大实物平展照片':'放大原画，核对可见衣纹'} ↗</button>${sourceBlock(r.refs)}`;
}
function researchPanel(r) {
  return `<p class="reading-intro">从具体文物出发，区分能被确认的事实、图像提供的线索与仍然未知的细节。</p><div class="reading-grid">${r.research.map(([title,text],i)=>`<section class="reading-block"><span>0${i+1}</span><h3>${title}</h3><p>${text}</p></section>`).join('')}</div><section class="fact-list"><h3>读图要点</h3><ul>${r.facts.map(fact=>`<li>${fact}</li>`).join('')}</ul></section>${sourceBlock(r.refs)}`;
}
function accessoriesPanel(r) {
  return `<p class="reading-intro">先识别原件构件与画中可见之物，再阅读同期参照。没有配套出土或图像证据的饰物，不自动拼入这套衣装。</p><div class="accessory-grid">${r.accessories.map(([title,text,kind])=>`<section class="accessory-card"><span>${kind==='same'?'原件／同图可见':'同期参照 · 非配套证据'}</span><h3>${title}</h3><p>${text}</p></section>`).join('')}</div><div class="accessory-gallery">${originalImages(r).map(image=>`<button class="image-frame" data-zoom-src="${image.src}" data-zoom-label="${escapeHTML(image.label)} · 配饰细看" data-zoom-note="${escapeHTML(r.imageNote)}" aria-label="放大细看${image.label}"><img src="${image.src}" alt="${image.label}"></button>`).join('')}</div>${sourceBlock(r.refs)}`;
}
function renderDetailPanel() {
  const r=currentRecord;if(!r)return;
  const renderers={artwork:artworkPanel,flat:flatPanel,research:researchPanel,accessories:accessoriesPanel};
  $('#detail-panel').innerHTML=renderers[currentTab](r);
  $('#detail-panel').setAttribute('aria-labelledby',`tab-${currentTab}`);
  $$('[data-tab]').forEach(button=>{const on=button.dataset.tab===currentTab;button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;});
  updateSavedButtons();
}
function selectTab(key,focus=false) {currentTab=key;renderDetailPanel();if(focus)$(`#tab-${key}`).focus();}
function showEssay(id) {
  const essay=ESSAYS.find(item=>item.id===id);if(!essay)return;
  currentRecord=null;
  showDialog(`<article class="text-article"><p class="eyebrow">READING BETWEEN THE THREADS · ${essay.index}</p><h2 id="dialog-title">${essay.title}</h2><p>${essay.subtitle}</p>${essay.body.map(([title,text])=>`<h3>${title}</h3><p>${text}</p>`).join('')}${sourceBlock(essay.refs)}</article>`);
}
function showSources() {
  currentRecord=null;
  showDialog(`<article class="text-article"><p class="eyebrow">SOURCES & COLLECTIONS</p><h2 id="dialog-title">让每一袭衣裳，都有来处</h2><p>本版收录9份服饰档案、12幅来源图、9幅依据重绘及9张结构示意。下列 ${Object.keys(SOURCES).length} 项资料区分馆藏档案、研究文章与图像出处；核对日期为2026年10月3日。</p>${Object.values(SOURCES).map((s,index)=>`<section class="source-item"><span>${String(index+1).padStart(2,'0')} · ${s.kind}</span><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a><p>${s.note}</p></section>`).join('')}</article>`);
}
function showAbout() {
  currentRecord=null;
  showDialog(`<article class="text-article"><p class="eyebrow">ABOUT THIS SCROLL</p><h2 id="dialog-title">古意相接，有据可寻</h2><h3>一幅不断开的长卷</h3><p>先秦至明清的九段内容在同一横向画布上连续排列。可以拖动、触摸滑动、使用方向键或下方位置条展卷；时代按钮只是定位，不切断相邻画面。</p><h3>三种图像，各守其位</h3><p>文物原图保留采集时的像素与颜色。淡彩重绘由AI根据这些原图生成，用于统一长卷的画风；它不是经学术鉴定的复原。结构示意由公开图像与尺寸整理，区分实线和虚线，没有缝份与完整后身数据，不能当作一比一裁剪纸样。</p><h3>年代与范围</h3><p>时间轴是阅读分期，并非完整政权年表；辽金与两宋等时期存在重叠。辽金元章节当前选取一组元代实物，先秦及隋唐等章节也各选具体样本，不声称覆盖分期内所有朝代、阶层与服制。当代延续保留在卷尾。</p><h3>来源与使用</h3><p>文物图片采集自公开的博物馆馆藏页面，女史箴图局部来自Wikimedia Commons。图片权属与署名归原提供方；网页可访问不等于图片获得任意商用授权。本地页面保留出处，不将馆藏照片或机构名称标为本站原创。</p><h3>收藏与阅读</h3><p>沿用原有的浏览器本地收藏，未上传个人数据。正文使用在线思源宋体，无法联网时回退至设备宋体；档案、图片与主要交互可在本地打开。收藏与当前浏览器、访问地址相关。</p><button class="primary" data-show-sources>展开资料来源</button></article>`);
}

let zoomScale=1, fitWidth=0, imageNaturalWidth=0, imageNaturalHeight=0, lastZoomTrigger=null;
const zoomImage=$('#zoom-image'), zoomStage=$('#zoom-stage');
function fitZoomImage() {
  if(!imageNaturalWidth||!imageNaturalHeight)return;
  fitWidth=Math.min(zoomStage.clientWidth-44,(zoomStage.clientHeight-44)*imageNaturalWidth/imageNaturalHeight);
  fitWidth=Math.max(80,fitWidth);
  applyZoom(1,false);
}
function applyZoom(value,preserveCenter=true) {
  const old=zoomScale;zoomScale=Math.max(1,Math.min(4,value));
  const x=(zoomStage.scrollLeft+zoomStage.clientWidth/2)/old,y=(zoomStage.scrollTop+zoomStage.clientHeight/2)/old;
  zoomImage.style.width=`${fitWidth*zoomScale}px`;
  zoomImage.style.height=`${fitWidth*imageNaturalHeight/imageNaturalWidth*zoomScale}px`;
  $('#zoom-range').value=Math.round(zoomScale*100);$('#zoom-value').value=`${Math.round(zoomScale*100)}%`;
  $('#zoom-out').disabled=zoomScale<=1;$('#zoom-in').disabled=zoomScale>=4;
  if(preserveCenter){zoomStage.scrollLeft=x*zoomScale-zoomStage.clientWidth/2;zoomStage.scrollTop=y*zoomScale-zoomStage.clientHeight/2;}else{zoomStage.scrollLeft=0;zoomStage.scrollTop=0;}
}
function openZoom(src,label,note) {
  lastZoomTrigger=document.activeElement;imageNaturalWidth=0;imageNaturalHeight=0;zoomScale=1;
  $('#zoom-title').textContent=label;$('#zoom-caption').textContent=note;
  zoomImage.alt=label;zoomImage.style.width='auto';zoomImage.style.height='auto';
  zoomImage.onload=()=>{imageNaturalWidth=zoomImage.naturalWidth;imageNaturalHeight=zoomImage.naturalHeight;fitZoomImage();$('#zoom-caption').textContent=note+(src.endsWith('.svg')?' · 矢量结构图，可无损缩放。':` · 来源图像 ${imageNaturalWidth} × ${imageNaturalHeight} 像素；放大不增加原图信息。`);};
  zoomImage.onerror=()=>{$('#zoom-caption').textContent='图像未能加载，请返回资料来源页查看。';};
  if(!zoom.open)zoom.showModal();document.body.style.overflow='hidden';
  zoomImage.src=src;
}
function unlockBody(){if(!detail.open&&!zoom.open)document.body.style.overflow='';}
$('#zoom-close').onclick=()=>zoom.close();$('#detail-close').onclick=()=>detail.close();
zoom.addEventListener('close',()=>{unlockBody();if(lastZoomTrigger?.isConnected)lastZoomTrigger.focus({preventScroll:true});});
detail.addEventListener('close',()=>{unlockBody();if(lastDetailTrigger?.isConnected)lastDetailTrigger.focus({preventScroll:true});});
for(const dialog of [detail,zoom])dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
$('#zoom-in').onclick=()=>applyZoom(zoomScale+.25);$('#zoom-out').onclick=()=>applyZoom(zoomScale-.25);$('#zoom-range').oninput=event=>applyZoom(Number(event.target.value)/100);$('#zoom-reset').onclick=()=>fitZoomImage();
zoomStage.addEventListener('dblclick',()=>applyZoom(zoomScale===1?2:1));
zoomStage.addEventListener('keydown',event=>{if(event.key==='+'||event.key==='='){event.preventDefault();applyZoom(zoomScale+.25);}if(event.key==='-'){event.preventDefault();applyZoom(zoomScale-.25);}if(event.key==='0'){event.preventDefault();fitZoomImage();}});
zoomStage.addEventListener('wheel',event=>{if(event.ctrlKey){event.preventDefault();applyZoom(zoomScale+(event.deltaY<0?.1:-.1));}},{passive:false});
let pan=null;
zoomStage.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;pan={x:event.clientX,y:event.clientY,left:zoomStage.scrollLeft,top:zoomStage.scrollTop};zoomStage.setPointerCapture(event.pointerId);zoomStage.classList.add('dragging');event.preventDefault();});
zoomStage.addEventListener('pointermove',event=>{if(!pan)return;zoomStage.scrollLeft=pan.left-(event.clientX-pan.x);zoomStage.scrollTop=pan.top-(event.clientY-pan.y);});
const endPan=()=>{pan=null;zoomStage.classList.remove('dragging');};zoomStage.addEventListener('pointerup',endPan);zoomStage.addEventListener('pointercancel',endPan);

let drag=null,suppressClickUntil=0,scrollFrame=0;
viewport.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,start:viewport.scrollLeft,moved:false};});
viewport.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x;if(Math.abs(dx)>6){drag.moved=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('dragging');event.preventDefault();}if(drag.moved)viewport.scrollLeft=drag.start-dx;});
function endDrag(){if(drag?.moved)suppressClickUntil=Date.now()+250;drag=null;viewport.classList.remove('dragging');}
viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);viewport.addEventListener('lostpointercapture',endDrag);
viewport.addEventListener('click',event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}},true);
viewport.addEventListener('dragstart',event=>event.preventDefault());
viewport.addEventListener('keydown',event=>{if(event.target!==viewport)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const left=event.key==='Home'?0:event.key==='End'?viewport.scrollWidth:viewport.scrollLeft+(event.key==='ArrowRight'?1:-1)*viewport.clientWidth*.65;viewport.scrollTo({left,behavior:behavior()});}});
viewport.addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{updateScrollState();scrollFrame=0;});},{passive:true});
$('#scroll-prev').onclick=()=>viewport.scrollBy({left:-viewport.clientWidth*.7,behavior:behavior()});$('#scroll-next').onclick=()=>viewport.scrollBy({left:viewport.clientWidth*.7,behavior:behavior()});$('#scroll-position').oninput=event=>{viewport.scrollLeft=Number(event.target.value)/1000*(viewport.scrollWidth-viewport.clientWidth);updateScrollState();};
window.addEventListener('resize',()=>{updateScrollState();if(zoom.open)fitZoomImage();});
$('#search').addEventListener('input',renderCards);
$('#show-saved').onclick=()=>{filter='saved';$('#search').value='';renderCards();$('#collection').scrollIntoView({behavior:behavior()});};
$('#sources').onclick=showSources;$('#about').onclick=showAbout;$('#methodology').onclick=()=>showEssay('evidence');
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  const d=button.dataset;
  if(d.detail)return openDetail(d.detail);
  if(d.era)return goToEra(d.era);
  if(d.scrollMode)return setScrollMode(d.scrollMode);
  if(d.save)return toggleSaved(d.save);
  if(d.filter){filter=d.filter;renderCards();return;}
  if(button.id==='clear-filters'){filter='all';$('#search').value='';renderCards();return;}
  if(d.tab)return selectTab(d.tab);
  if(d.artMode){artworkMode=d.artMode;selectedImage=0;renderDetailPanel();$('#detail-panel').querySelector(`[data-art-mode="${artworkMode}"]`).focus({preventScroll:true});return;}
  if(d.originalIndex!==undefined){selectedImage=Number(d.originalIndex);renderDetailPanel();$('#detail-panel').querySelector(`[data-original-index="${selectedImage}"]`).focus({preventScroll:true});return;}
  if(d.zoomSrc)return openZoom(d.zoomSrc,d.zoomLabel,d.zoomNote||'');
  if(d.essay)return showEssay(d.essay);
  if(d.showSources!==undefined)return showSources();
});
detail.addEventListener('keydown',event=>{const tab=event.target.closest('[role=tab]');if(!tab)return;const index=tabs.findIndex(([key])=>key===tab.dataset.tab);let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();selectTab(tabs[next][0],true);}});
$('#essay-list').innerHTML=ESSAYS.map(essay=>`<button class="essay" data-essay="${essay.id}"><span>${essay.index}</span><h3>${essay.title}</h3><p>${essay.subtitle}</p><b>↗</b></button>`).join('');
renderScroll();renderTimeline();renderCards();updateScrollState();
