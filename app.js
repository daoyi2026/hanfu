'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const recordById = id => RECORDS.find(record => record.id === id);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const behavior = () => reducedMotion() ? 'instant' : 'smooth';
let saved = new Set();
try { const stored = JSON.parse(localStorage.getItem('yizhang-saved') || '[]'); if (Array.isArray(stored)) saved = new Set(stored.filter(id => typeof id === 'string')); } catch {}
let activeEra = 'qin', filter = 'all', currentRecord = null, currentTab = 'ensemble', currentPairIndex = 0;
const pairChoice = Object.fromEntries(RECORDS.map(record => [record.id, 0]));
let lastDetailTrigger = null, toastTimer;
const viewport = $('#scroll-viewport'), detail = $('#detail-dialog'), zoom = $('#zoom-dialog');
const tabs = [['ensemble','男女衣装'],['hair','发型配饰'],['research','衣装解读'],['sources','史料来源']];

function selectedPair(id, index = pairChoice[id] || 0) { return PAIRS[id].sets[index] || PAIRS[id].sets[0]; }
function pairDisplayTitle(record, pair) { return pair.title.includes(record.era) ? pair.title : `${pair.title}（${record.era}）`; }
function pairPicker(id, selected) {
  return `<div class="pair-picker" role="group" aria-label="选择${recordById(id).era}的男女成对造型">${PAIRS[id].sets.map((set,index)=>`<button data-pair-choice="${id}:${index}" aria-pressed="${index===selected}"><span>${String(index+1).padStart(2,'0')}</span>${set.label}<small>${set.title}</small></button>`).join('')}</div>`;
}
function choosePair(id, index) {
  if (!PAIRS[id]?.sets[index]) return;
  pairChoice[id] = index;
  const pair = selectedPair(id, index);
  const displayTitle = pairDisplayTitle(recordById(id), pair);
  const scene = $(`#scene-${id}`);
  if (scene) {
    scene.querySelector('.scene-painting').setAttribute('aria-label', `细看${displayTitle}男女成对衣装`);
    const image = scene.querySelector('.scene-painting img');
    image.src = pair.image; image.alt = `${displayTitle}，一男一女古画风造型`;
    scene.querySelector('.scene-title').textContent = pair.title;
    scene.querySelector('.scene-meta').textContent = `${pair.female.name} · ${pair.male.name}`;
    scene.querySelectorAll('[data-pair-choice]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.pairChoice.split(':')[1])===index)));
  }
  const card = $(`#card-${id}`);
  if (card) {
    card.querySelector('.card-image').setAttribute('aria-label', `查看${displayTitle}`);
    const image = card.querySelector('.card-image img');
    image.src = pair.image; image.alt = `${displayTitle}，一男一女古画风造型`;
    card.querySelector('.card-title strong').textContent = `${recordById(id).era} · ${pair.title}`;
    card.querySelector('.card-meta').textContent = `${pair.female.name} · ${pair.male.name}`;
    card.querySelectorAll('[data-pair-choice]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.pairChoice.split(':')[1])===index)));
  }
  if (currentRecord?.id===id) { currentPairIndex=index; renderDetailPanel(); }
}

let scrollMotion = 0;
function smoothScrollTo(left) {
  const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const target = Math.max(0, Math.min(max, left));
  const start = viewport.scrollLeft, distance = target - start;
  const token = ++scrollMotion;
  if (reducedMotion() || Math.abs(distance) < 1) { viewport.scrollLeft=target; return; }
  const duration = Math.max(1050, Math.min(2100, 850 + Math.abs(distance) / Math.max(1,viewport.clientWidth) * 250));
  const startTime = performance.now();
  const tick = now => {
    if (token !== scrollMotion) return;
    const t = Math.min(1,(now-startTime)/duration);
    const ease = t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
    viewport.scrollLeft = start + distance * ease;
    if (t<1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function landscape() {
  return '<svg class="scroll-landscape" viewBox="0 0 4600 500" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#8a9274" stroke-width="1"><path d="M0 419Q140 365 290 415T610 404T940 422T1250 402T1580 416T1930 398T2240 420T2540 400T2880 415T3220 401T3540 420T3840 401T4170 417T4600 398"/><path d="M0 432Q200 407 360 436T700 425T1060 437T1430 422T1830 440T2220 423T2590 440T3000 422T3400 443T3810 424T4210 440T4600 421"/><path d="M0 446Q370 432 580 450T1150 451T1700 450T2300 451T2870 450T3500 453T4070 450T4600 447"/></g><g fill="#9ea98b" opacity=".25"><path d="M0 372L78 330L115 346L163 304L226 344L283 312L348 363L420 349L502 391L602 416H0Z"/><path d="M760 395L810 365L840 382L902 306L939 329L992 265L1040 299L1073 282L1154 370L1260 397L1350 428H720Z"/><path d="M1550 405L1610 360L1660 380L1720 310L1762 346L1790 330L1870 375L1970 418H1550Z"/><path d="M2390 415L2450 360L2490 380L2550 310L2615 267L2660 319L2710 300L2790 370L2890 400L2950 425H2360Z"/><path d="M3470 412L3535 330L3580 352L3640 281L3690 315L3730 303L3820 386L3920 410L4030 434H3430Z"/></g></svg>';
}
function renderScroll() {
  $('#scroll-track').innerHTML = landscape() + '<div class="scroll-preface"><h2>衣冠千年</h2><p>一襟一袖皆有来处<br>一针一线俱是时光</p><span class="small-seal">衣章</span></div>' + RECORDS.map((r,index) => {const pair=selectedPair(r.id);const displayTitle=pairDisplayTitle(r,pair);return `<article class="scroll-scene ${r.type}" id="scene-${r.id}" data-scene="${r.id}" style="--accent:${r.color}"><div class="scene-era"><strong>${r.era}</strong><span>${r.en} · ${r.range}</span></div><button class="scene-painting" data-detail="${r.id}" aria-label="细看${displayTitle}男女成对衣装"><img class="painting-art" src="${pair.image}" alt="${displayTitle}，一男一女古画风造型" loading="${index<3?'eager':'lazy'}" draggable="false"></button>${pairPicker(r.id,pairChoice[r.id]||0)}<div class="scene-caption"><div><h3 class="scene-title">${pair.title}</h3><p class="scene-meta">${pair.female.name} · ${pair.male.name}</p></div><span class="scene-index">${String(index+1).padStart(2,'0')}</span></div></article>`;}).join('') + '<div class="scroll-ending"><h2>衣脉相承</h2><p>看过来时路<br>再穿今日衣</p><span class="small-seal">续</span></div>';
}
function renderTimeline() {
  $('#timeline').innerHTML = RECORDS.map(r => `<button data-era="${r.id}" class="${r.id===activeEra?'active':''}" aria-pressed="${r.id===activeEra}" aria-controls="scroll-viewport">${r.era}<small>${r.range}</small></button>`).join('');
}
function updateScrollState() {
  const max = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
  const offset = viewport.scrollLeft;
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
  smoothScrollTo(Math.max(0,scene.offsetLeft-(viewport.clientWidth-scene.offsetWidth)/2));
}
function updateSavedButtons() {
  $$('[data-save]').forEach(button=>{const id=button.dataset.save;const on=saved.has(id);const r=recordById(id);button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',`${on?'取消收藏':'收藏'}${r.era}衣冠`);button.textContent=button.classList.contains('save-card')?(on?'♥':'♡'):(on?'♥ 已收入藏衣 · 点击移出':'♡ 收入我的藏衣');});
  $('#saved-count').textContent=String(RECORDS.filter(r=>saved.has(r.id)).length).padStart(2,'0');
}
function renderCards() {
  const query=$('#search').value.trim().toLocaleLowerCase();
  const searchable=r=>{const pairs=PAIRS[r.id].sets;return [r.era,r.material,r.museum,r.date,...r.tags,PAIRS[r.id].focus,...pairs.flatMap(pair=>[pair.title,pair.activity,pair.female.name,...pair.female.layers,pair.female.hair,...pair.female.accessories.flat(),pair.male.name,...pair.male.layers,pair.male.hair,...pair.male.accessories.flat()])].join(' ').toLocaleLowerCase();};
  const matches=RECORDS.filter(r=>(filter==='all'||(filter==='saved'?saved.has(r.id):r.type===filter))&&searchable(r).includes(query));
  $('#cards').innerHTML=matches.length?matches.map(r=>{const selected=pairChoice[r.id]||0,pair=selectedPair(r.id,selected),displayTitle=pairDisplayTitle(r,pair);return `<article class="card" id="card-${r.id}"><div class="card-art"><button class="card-image" data-detail="${r.id}" aria-label="查看${displayTitle}"><img class="painting-art" src="${pair.image}" loading="lazy" alt="${displayTitle}，一男一女古画风造型"></button><span class="card-era">${r.era}</span><span class="card-status">三种生活场景</span><button class="save-card" data-save="${r.id}"></button></div>${pairPicker(r.id,selected)}<button class="card-title" data-detail="${r.id}"><strong>${r.era} · ${pair.title}</strong><span>↗</span></button><p class="card-meta">${pair.female.name} · ${pair.male.name}</p></article>`;}).join(''):`<div class="empty">${filter==='saved'&&!query?'藏衣匣尚空。打开喜欢的时代，收藏喜欢的服饰造型。':'没有找到相符的衣名、场景、发型或配饰。'}<button id="clear-filters">查看全部衣冠</button></div>`;
  $('#result-count').textContent=`共 ${matches.length} 个历史分期 · ${matches.length*3} 组生活场景`;
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
  return `<section class="source-block"><h3>相关馆藏与图像</h3>${[...new Set(ids)].map(id=>{const s=SOURCES[id];return `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a>`;}).join('')}<p>插画以这些馆藏说明、人物画与出土服饰为造型参考。</p></section>`;
}
function showDialog(markup) {
  lastDetailTrigger=document.activeElement;
  $('#dialog-content').innerHTML=markup;
  if(!detail.open)detail.showModal();
  document.body.style.overflow='hidden';
  detail.scrollTop=0;
}
function openDetail(id,tab='ensemble') {
  const r=recordById(id);if(!r)return;
  currentPairIndex=pairChoice[id]||0;
  currentRecord=r;currentTab=tab;
  const pair=selectedPair(id,currentPairIndex);
  showDialog(`<header class="detail-header"><p class="eyebrow">${r.en} · ${r.date}</p><h2 id="dialog-title">${r.era} · ${pair.title}</h2><div class="detail-subline"><span>${pair.label}</span><span>一男一女成对造型</span><span>${pair.activity}</span></div></header><div class="detail-tabs" role="tablist" aria-label="衣冠档案内容">${tabs.map(([key,label])=>`<button role="tab" id="tab-${key}" data-tab="${key}" aria-selected="${key===tab}" tabindex="${key===tab?0:-1}" aria-controls="detail-panel">${label}</button>`).join('')}</div><div class="detail-panel" id="detail-panel" role="tabpanel" tabindex="0" aria-labelledby="tab-${tab}"></div>`);
  renderDetailPanel();
}
function originalImages(r) {return [{src:r.original,label:r.name},...(r.extra||[])];}
function ensemblePanel(r) {
  const pair=selectedPair(r.id,currentPairIndex);
  const people=[['female','女性',pair.female],['male','男性',pair.male]];
  return `${pairPicker(r.id,currentPairIndex)}<div class="ensemble-layout"><div class="ensemble-visual"><button class="image-frame ensemble-frame" data-zoom-src="${pair.image}" data-zoom-art="true" data-zoom-label="${escapeHTML(r.era)} · ${escapeHTML(pair.title)}" data-zoom-note="淡彩古画风插画 · 以馆藏服饰、人物画和出土造型为参考" aria-label="放大查看${pair.title}"><img class="painting-art" src="${pair.image}" alt="${pairDisplayTitle(r,pair)}，左侧女性、右侧男性完整造型"></button><p class="image-caption">点击放大 · 左为女性，右为男性。${pair.activity}</p></div><div class="ensemble-members">${people.map(([key,label,person])=>`<section class="ensemble-member ${key}"><span>${label} · ${pair.label}</span><h3>${person.name}</h3><ul>${person.layers.map(item=>`<li>${item}</li>`).join('')}</ul><p class="hair-summary"><b>发式</b>${person.hair}</p><div class="accessory-summary">${person.accessories.map(([title,text])=>`<p><b>${title}</b>${text}</p>`).join('')}</div></section>`).join('')}</div></div><button class="primary" data-save="${r.id}"></button>`;
}
function researchPanel(r) {
  const reading=PAIRS[r.id].reading;
  return `<p class="reading-intro">${PAIRS[r.id].focus}</p><div class="reading-grid">${reading.map(([title,text],i)=>`<section class="reading-block"><span>0${i+1}</span><h3>${title}</h3><p>${text}</p></section>`).join('')}</div>${sourceBlock([...r.refs,...selectedPair(r.id,currentPairIndex).refs])}`;
}
function hairPanel(r) {
  const pair=selectedPair(r.id,currentPairIndex);
  return `${pairPicker(r.id,currentPairIndex)}<p class="reading-intro">${pair.title} · ${pair.activity}</p><div class="hair-grid">${[['female','女性',pair.female],['male','男性',pair.male]].map(([key,label,person])=>`<section class="hair-card"><span>${label} · ${pair.label}</span><h3>${person.name}</h3><p class="hair-copy">${person.hair}</p><div class="hair-accessories">${person.accessories.map(([title,text])=>`<article><b>${title}</b><p>${text}</p></article>`).join('')}</div></section>`).join('')}</div>`;
}
function sourcesPanel(r) {
  const pair=selectedPair(r.id,currentPairIndex);
  return `<p class="reading-intro">${pair.title} · ${pair.activity}</p><div class="source-gallery">${originalImages(r).map(image=>`<button class="image-frame" data-zoom-src="${image.src}" data-zoom-label="${escapeHTML(image.label)} · 史料原图" data-zoom-note="${escapeHTML(r.imageNote)}" aria-label="放大查看${image.label}史料图"><img src="${image.src}" alt="${image.label}史料原图"></button>`).join('')}</div><p class="source-caption">${r.imageNote}</p>${sourceBlock([...r.refs,...pair.refs])}`;
}
function renderDetailPanel() {
  const r=currentRecord;if(!r)return;
  const renderers={ensemble:ensemblePanel,hair:hairPanel,research:researchPanel,sources:sourcesPanel};
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
  showDialog(`<article class="text-article"><p class="eyebrow">COLLECTIONS & REFERENCES</p><h2 id="dialog-title">服饰图像与馆藏资料</h2><p>本页按九个历史分期整理二十七幅男女衣装场景，涵盖礼仪、日常与出行。插画参考博物馆藏品、古画、俑像和纺织品资料。</p><section class="source-advice"><h3>查看原始资料</h3><p>点开具体时代的“史料来源”，可放大该段所依据的馆藏图像；下列馆藏网站也支持按时代、材质、衣物类别和人物形象检索。</p></section>${Object.values(SOURCES).map((s,index)=>`<section class="source-item"><span>${String(index+1).padStart(2,'0')} · ${s.kind}</span><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a><p>${s.note}</p></section>`).join('')}</article>`);
}
function showAbout() {
  currentRecord=null;
  showDialog(`<article class="text-article"><p class="eyebrow">ABOUT THE SCROLL</p><h2 id="dialog-title">从场合看一身衣裳</h2><h3>一卷连续的衣冠长卷</h3><p>拖动画面、按左右方向键，或点选下方朝代，即可从先秦一路展卷至清代。朝代切换会沿着长卷缓缓移动。</p><h3>礼仪、日常与出行</h3><p>每个时代呈现三种穿着场合；每幅插画由一位女性与一位男性共同呈现，并介绍衣裳层次、发式与随身配饰。</p><h3>图像与原物</h3><p>主图以博物馆藏品、古画、陶俑、雕塑和纺织品为样式参考，统一绘成淡彩古画。点开“史料来源”，可对照原始图像和馆藏介绍。</p><h3>收藏</h3><p>收藏保存在当前浏览器，可随时从“我的藏衣”打开。</p><button class="primary" data-show-sources>查阅资料来源</button></article>`);
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
function openZoom(src,label,note,art=false) {
  lastZoomTrigger=document.activeElement;imageNaturalWidth=0;imageNaturalHeight=0;zoomScale=1;
  $('#zoom-title').textContent=label;$('#zoom-caption').textContent=note;
  zoomImage.alt=label;zoomImage.classList.toggle('painting-art',art);zoomImage.style.width='auto';zoomImage.style.height='auto';
  zoomImage.onload=()=>{imageNaturalWidth=zoomImage.naturalWidth;imageNaturalHeight=zoomImage.naturalHeight;fitZoomImage();$('#zoom-caption').textContent=note+` · 图像 ${imageNaturalWidth} × ${imageNaturalHeight} 像素；放大不增加原图信息。`;};
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
viewport.addEventListener('pointerdown',event=>{scrollMotion++;if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,start:viewport.scrollLeft,moved:false};});
viewport.addEventListener('touchstart',()=>{scrollMotion++;},{passive:true});
viewport.addEventListener('wheel',event=>{
  if(event.ctrlKey||event.metaKey)return;
  scrollMotion++;
  if(event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  const rawDelta=event.deltaY;
  const scale=event.deltaMode===1?40:event.deltaMode===2?viewport.clientWidth:1;
  const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
  const next=Math.max(0,Math.min(max,viewport.scrollLeft+rawDelta*scale));
  if(next===viewport.scrollLeft)return;
  event.preventDefault();viewport.scrollLeft=next;
},{passive:false});
viewport.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x;if(Math.abs(dx)>6){drag.moved=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('dragging');event.preventDefault();}if(drag.moved)viewport.scrollLeft=drag.start-dx;});
function endDrag(){if(drag?.moved)suppressClickUntil=Date.now()+250;drag=null;viewport.classList.remove('dragging');}
viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);viewport.addEventListener('lostpointercapture',endDrag);
viewport.addEventListener('click',event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopPropagation();}},true);
viewport.addEventListener('dragstart',event=>event.preventDefault());
viewport.addEventListener('keydown',event=>{if(event.target!==viewport)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const left=event.key==='Home'?0:event.key==='End'?viewport.scrollWidth:viewport.scrollLeft+(event.key==='ArrowRight'?1:-1)*viewport.clientWidth*.65;smoothScrollTo(left);}});
viewport.addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{updateScrollState();scrollFrame=0;});},{passive:true});
$('#scroll-prev').onclick=()=>smoothScrollTo(viewport.scrollLeft-viewport.clientWidth*.7);$('#scroll-next').onclick=()=>smoothScrollTo(viewport.scrollLeft+viewport.clientWidth*.7);
window.addEventListener('resize',()=>{updateScrollState();if(zoom.open)fitZoomImage();});
$('#search').addEventListener('input',renderCards);
$('#show-saved').onclick=()=>{filter='saved';$('#search').value='';renderCards();$('#collection').scrollIntoView({behavior:behavior()});};
$('#about').onclick=showAbout;$('#methodology').onclick=()=>showEssay('evidence');
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  const d=button.dataset;
  if(d.pairChoice){const [id,index]=d.pairChoice.split(':');return choosePair(id,Number(index));}
  if(d.detail)return openDetail(d.detail);
  if(d.era)return goToEra(d.era);
  if(d.save)return toggleSaved(d.save);
  if(d.filter){filter=d.filter;renderCards();return;}
  if(button.id==='clear-filters'){filter='all';$('#search').value='';renderCards();return;}
  if(d.tab)return selectTab(d.tab);
  if(d.zoomSrc)return openZoom(d.zoomSrc,d.zoomLabel,d.zoomNote||'',d.zoomArt==='true');
  if(d.essay)return showEssay(d.essay);
  if(d.showSources!==undefined)return showSources();
});
detail.addEventListener('keydown',event=>{const tab=event.target.closest('[role=tab]');if(!tab)return;const index=tabs.findIndex(([key])=>key===tab.dataset.tab);let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();selectTab(tabs[next][0],true);}});
renderScroll();
if(matchMedia('(max-width:700px)').matches)viewport.scrollLeft=$('#scene-qin').offsetLeft;
renderTimeline();renderCards();updateScrollState();
