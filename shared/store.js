
(function(){
"use strict";
var D = document.body.getAttribute('data-design');
var PAGE = document.body.getAttribute('data-page');
var K = { cart:'af10-'+D+'-cart', wish:'af10-'+D+'-wish', col:'af10-'+D+'-color', ord:'af10-'+D+'-order' };
var P = window.AF_PRODUCTS || [];
var ICONS = window.AF_ICONS || {};
var IMG = window.AF_IMG || '';
var byId = {}; P.forEach(function(p){ byId[p.id] = p; });
var $ = function(s, c){ return (c||document).querySelector(s); };
var $$ = function(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
/* Standing rule for this client's projects: animations are NEVER gated on
   prefers-reduced-motion (the owner's phone reports it and gated animations
   never showed). RM stays false so reveals, fly-to-cart and sliders always run. */
var RM = false;
function fmt(n){ return 'Rs ' + new Intl.NumberFormat('en-PK').format(n); }
window.AFfmt = fmt;
function load(k, dft){ try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : dft; } catch(e){ return dft; } }
function save(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

/* ---------- toast ---------- */
function toast(msg){
  var w = $('#toastWrap'); if(!w) return;
  var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  w.appendChild(t);
  setTimeout(function(){ t.classList.add('out'); setTimeout(function(){ t.remove(); }, 320); }, 2500);
}

/* ---------- colour picker ---------- */
function lum(hex){
  var c = hex.replace('#',''); if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  var r = parseInt(c.substr(0,2),16)/255, g = parseInt(c.substr(2,2),16)/255, b = parseInt(c.substr(4,2),16)/255;
  function f(v){ return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
}
function shade(hex, f){
  var c = hex.replace('#',''); if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  var r = Math.round(parseInt(c.substr(0,2),16)*f), g = Math.round(parseInt(c.substr(2,2),16)*f), b = Math.round(parseInt(c.substr(4,2),16)*f);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function applyColor(hex, name){
  var root = document.documentElement.style;
  root.setProperty('--brand', hex);
  root.setProperty('--brand-d', shade(hex, 0.76));
  root.setProperty('--on-brand', lum(hex) > 0.179 ? '#141414' : '#FFFFFF');
  var nm = $('#cName'); if (nm) nm.textContent = name || '';
  $$('.csw').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-hex') === hex); });
  save(K.col, hex);
}
function initPicker(){
  var pal = window.AF_PALETTE || []; var box = $('#cswatches'); if (!box || !pal.length) return;
  pal.forEach(function(c){
    var b = document.createElement('button');
    b.className = 'csw'; b.type = 'button'; b.style.background = c.hex;
    b.setAttribute('data-hex', c.hex); b.setAttribute('aria-label', 'Accent colour ' + c.name);
    b.addEventListener('click', function(){ applyColor(c.hex, c.name); toast('Accent colour: ' + c.name); });
    box.appendChild(b);
  });
  box.addEventListener('keydown', function(e){
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var btns = $$('.csw', box); var i = btns.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault();
    var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length;
    btns[n].focus();
  });
  var saved = load(K.col, null);
  var start = pal.filter(function(c){ return c.hex === saved; })[0] || pal[0];
  applyColor(start.hex, start.name);
}

/* ---------- cart + wishlist ---------- */
var cart = load(K.cart, []);
var wish = load(K.wish, []);
function cartCount(){ return cart.reduce(function(s, i){ return s + i.qty; }, 0); }
function cartSubtotal(){ return cart.reduce(function(s, i){ return s + byId[i.id].price * i.qty; }, 0); }
function shipFee(sub){ return sub === 0 ? 0 : (sub >= 25000 ? 0 : 300); }
function updateBadges(){
  var cc = $('#cartCount'); if (cc) cc.textContent = cartCount();
  var wc = $('#wishCount'); if (wc) wc.textContent = wish.length;
}
function bumpBadge(){
  var cc = $('#cartCount'); if (!cc) return;
  cc.classList.remove('bump'); void cc.offsetWidth; cc.classList.add('bump');
}
function lineHTML(i, page){
  var p = byId[i.id];
  return '<div class="citem" data-line="' + p.id + '">' +
    '<span class="cv">' + (ICONS[p.icon] || '') + '</span>' +
    '<div><b>' + p.name + '</b><div class="cp">' + fmt(p.price * i.qty) + '</div>' +
    '<span class="qty"><button data-qact="-1" data-qid="' + p.id + '" aria-label="Decrease quantity">-</button>' +
    '<span class="qv">' + i.qty + '</span>' +
    '<button data-qact="1" data-qid="' + p.id + '" aria-label="Increase quantity">+</button></span></div>' +
    '<button class="rm" data-rm="' + p.id + '" aria-label="Remove ' + p.name + ' from cart">' +
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
}
function renderCart(){
  var sub = cartSubtotal(), ship = shipFee(sub);
  var items = $('#cartItems');
  if (items){
    items.innerHTML = cart.length ? cart.map(function(i){ return lineHTML(i); }).join('') :
      '<div class="emptybox"><b style="display:block;font-size:17px;color:var(--ink);margin-bottom:6px">Your cart is empty</b>Add products from the shop and they will appear here.</div>';
  }
  var s = $('#cartSub'); if (s) s.textContent = fmt(sub);
  var sh = $('#cartShip'); if (sh) sh.textContent = sub > 0 && ship === 0 ? 'FREE' : fmt(ship);
  var t = $('#cartTot'); if (t) t.textContent = fmt(sub + ship);
  var lines = $('#cartLines');
  if (lines){
    lines.innerHTML = cart.length ? cart.map(function(i){ return lineHTML(i, true); }).join('') :
      '<div class="emptybox"><b style="display:block;font-size:19px;color:var(--ink);margin-bottom:6px">Your cart is empty</b>Nothing here yet. Browse the shop and add what your building needs.<div style="margin-top:16px"><a class="btn" href="shop.html">Go to Shop</a></div></div>';
    var cs = $('#cpSub'); if (cs) cs.textContent = fmt(sub);
    var csh = $('#cpShip'); if (csh) csh.textContent = sub > 0 && ship === 0 ? 'FREE' : fmt(ship);
    var ct = $('#cpTot'); if (ct) ct.textContent = fmt(sub + ship);
    var co = $('#toCheckout'); if (co) co.style.display = cart.length ? '' : 'none';
  }
  updateBadges();
}
function setQty(id, qty){
  var it = cart.filter(function(i){ return i.id === id; })[0];
  if (!it) return;
  it.qty = Math.max(0, qty);
  if (it.qty === 0) cart = cart.filter(function(i){ return i.id !== id; });
  save(K.cart, cart); renderCart();
  var qv = document.querySelector('[data-line="' + id + '"] .qv');
  if (qv){ qv.classList.remove('qpop'); void qv.offsetWidth; qv.classList.add('qpop'); }
}
function removeLine(id, el){
  var item = el ? el.closest('.citem') : null;
  function done(){ cart = cart.filter(function(i){ return i.id !== id; }); save(K.cart, cart); renderCart(); }
  if (item && !RM){
    item.style.height = item.offsetHeight + 'px';
    requestAnimationFrame(function(){
      item.style.height = '0px'; item.style.opacity = '0'; item.style.paddingTop = '0'; item.style.paddingBottom = '0';
      setTimeout(done, 310);
    });
  } else done();
  toast('Removed from cart');
}
function flyToCart(srcEl){
  var btn = $('#cartBtn');
  if (!srcEl || !btn || RM) { bumpBadge(); return; }
  var r1 = srcEl.getBoundingClientRect(), r2 = btn.getBoundingClientRect();
  if (r2.width === 0) { bumpBadge(); return; }
  var ghost = srcEl.cloneNode(true);
  ghost.style.cssText = 'position:fixed;z-index:300;pointer-events:none;margin:0;left:' + r1.left + 'px;top:' + r1.top + 'px;width:' + r1.width + 'px;height:' + r1.height + 'px;border-radius:6px;overflow:hidden;';
  document.body.appendChild(ghost);
  var dx = (r2.left + r2.width/2) - (r1.left + r1.width/2);
  var dy = (r2.top + r2.height/2) - (r1.top + r1.height/2);
  var midY = Math.min(r1.top, r2.top) - 110;
  var anim = ghost.animate([
    { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
    { transform: 'translate(' + (dx*0.5) + 'px,' + (midY - r1.top - r1.height/2) + 'px) scale(.42)', opacity: .95, offset: .55 },
    { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.05)', opacity: .55 }
  ], { duration: 700, easing: 'cubic-bezier(.3,.7,.4,1)' });
  anim.onfinish = function(){ ghost.remove(); bumpBadge(); };
  setTimeout(function(){ if (ghost.parentNode) { ghost.remove(); bumpBadge(); } }, 900);
}
function addToCart(id, qty, srcEl){
  qty = qty || 1;
  var it = cart.filter(function(i){ return i.id === id; })[0];
  if (it) it.qty += qty; else cart.push({ id: id, qty: qty });
  save(K.cart, cart); renderCart();
  var pv = srcEl ? (srcEl.closest('.pcard') ? srcEl.closest('.pcard').querySelector('.pv') : srcEl.closest('.gal-stage') || srcEl) : null;
  flyToCart(pv);
  toast(byId[id].name + ' added to cart');
}
function toggleWish(id, btn){
  var on = wish.indexOf(id) > -1;
  if (on) wish = wish.filter(function(x){ return x !== id; }); else wish.push(id);
  save(K.wish, wish); updateBadges();
  $$('[data-wish="' + id + '"]').forEach(function(b){ b.classList.toggle('on', !on); });
  toast(on ? 'Removed from wishlist' : 'Saved to wishlist');
}

/* ---------- scroll lock / drawers / menu ---------- */
var savedY = 0;
function lockScroll(){
  savedY = window.scrollY || 0;
  document.body.style.position = 'fixed'; document.body.style.top = (-savedY) + 'px';
  document.body.style.left = '0'; document.body.style.right = '0';
}
function unlockScroll(){
  document.body.style.position = ''; document.body.style.top = ''; document.body.style.left = ''; document.body.style.right = '';
  window.scrollTo(0, savedY);
}
function openLayer(sel){
  var el = $(sel); if (!el) return;
  el.classList.add('show'); $('#backdrop').classList.add('show'); lockScroll();
  if (sel === '.mnav') $$('.mnav nav a').forEach(function(a, i){ a.style.transitionDelay = (0.05 + i*0.05) + 's'; });
}
function closeLayers(){
  $$('.drawer.show,.mnav.show').forEach(function(el){ el.classList.remove('show'); });
  var bd = $('#backdrop'); if (bd) bd.classList.remove('show');
  if (document.body.style.position === 'fixed') unlockScroll();
}

/* ---------- modal (quick view) ---------- */
var lastFocus = null;
function openModal(){
  var m = $('#quickModal'); if (!m) return;
  lastFocus = document.activeElement;
  m.classList.add('show'); lockScroll();
  var box = $('.box', m); if (box) { var f = $('button', box); if (f) f.focus(); }
}
function closeModal(){
  var m = $('#quickModal'); if (!m) return;
  m.classList.remove('show');
  if (document.body.style.position === 'fixed') unlockScroll();
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){ closeLayers(); closeModal(); var sd = $('.searchdrop.show'); if (sd) sd.classList.remove('show'); }
  if (e.key === 'Tab'){
    var m = $('#quickModal.show'); if (!m) return;
    var f = $$('button, a[href], input, select', $('.box', m)).filter(function(el){ return !el.disabled; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
});

/* ---------- product cards ---------- */
var STAR = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="vertical-align:-1px"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>';
var HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20.5C7 16.5 3 13.2 3 9.3 3 6.4 5.2 4.5 7.7 4.5c1.7 0 3.3.9 4.3 2.4 1-1.5 2.6-2.4 4.3-2.4 2.5 0 4.7 1.9 4.7 4.8 0 3.9-4 7.2-9 11.2z"/></svg>';
function cardHTML(p, i){
  var wished = wish.indexOf(p.id) > -1 ? ' on' : '';
  return '<article class="pcard rv" style="transition-delay:' + Math.min((i % 8) * (window.innerWidth < 760 ? 45 : 70), 420) + 'ms">' +
    '<div class="pv"><img src="' + IMG + p.gallery[0] + '" alt="' + p.name + '" loading="lazy" width="640" height="400">' +
    '<button class="wish' + wished + '" data-wish="' + p.id + '" aria-label="Toggle wishlist for ' + p.name + '">' + HEART + '</button>' +
    '<button class="btn sm darkb qvbtn" data-qv="' + p.id + '">Quick View</button></div>' +
    '<div class="pb"><span class="pc">' + p.cat + '</span>' +
    '<h3><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3>' +
    '<span class="rate"><b>' + STAR + ' ' + p.rating.toFixed(1) + '</b> / 5 rating</span>' +
    '<div class="prow"><span class="pr">' + fmt(p.price) + '</span>' +
    '<button class="btn sm" data-add="' + p.id + '">Add to Cart</button></div></div></article>';
}
function renderGrid(el, list){
  if (!el) return;
  el.innerHTML = list.length ? list.map(cardHTML).join('') :
    '<div class="emptybox" style="grid-column:1/-1"><b style="display:block;font-size:18px;color:var(--ink);margin-bottom:6px">No products found</b>Try a different search or filter combination.</div>';
  observeRv(el);
}

/* ---------- reveal engine ---------- */
var io = null;
function observeRv(scope){
  var els = $$('.rv', scope || document);
  if (!('IntersectionObserver' in window) || RM && false){ els.forEach(function(el){ el.classList.add('in'); }); return; }
  if (!io){
    io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  }
  els.forEach(function(el){ io.observe(el); });
  setTimeout(function(){ els.forEach(function(el){ el.classList.add('in'); }); }, 2000);
}

/* ---------- search ---------- */
function bindSearch(box){
  if (!box) return;
  var input = $('input', box), drop = $('.searchdrop', box);
  var sel = -1, hits = [];
  function close(){ drop.classList.remove('show'); sel = -1; }
  function render(){
    var q = input.value.trim().toLowerCase();
    if (!q){ close(); return; }
    hits = P.filter(function(p){ return (p.name + ' ' + p.cat).toLowerCase().indexOf(q) > -1; }).slice(0, 6);
    drop.innerHTML = hits.length ? hits.map(function(p, i){
      return '<button type="button" data-hit="' + p.id + '" class="' + (i === sel ? 'sel' : '') + '"><span>' + p.name + '</span><b>' + fmt(p.price) + '</b></button>';
    }).join('') : '<div class="sd-empty">No products match "' + input.value.trim() + '". Try "extinguisher" or "detector".</div>';
    drop.classList.add('show');
  }
  input.addEventListener('input', function(){ sel = -1; render(); });
  input.addEventListener('keydown', function(e){
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault(); if (!hits.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length; render();
    } else if (e.key === 'Enter'){
      if (sel > -1 && hits[sel]) location.href = 'product.html?id=' + hits[sel].id;
      else if (PAGE !== 'shop') location.href = 'shop.html';
    } else if (e.key === 'Escape') close();
  });
  drop.addEventListener('click', function(e){
    var b = e.target.closest('[data-hit]');
    if (b) location.href = 'product.html?id=' + b.getAttribute('data-hit');
  });
  document.addEventListener('click', function(e){ if (!box.contains(e.target)) close(); });
}

/* ---------- shop page ---------- */
var shopState = { cat: 'All', price: 'all', rate: 0, sort: 'featured', q: '' };
function shopList(){
  var list = P.filter(function(p){
    if (shopState.cat !== 'All' && p.cat !== shopState.cat) return false;
    if (shopState.price === 'u5' && p.price >= 5000) return false;
    if (shopState.price === '5to20' && (p.price < 5000 || p.price > 20000)) return false;
    if (shopState.price === 'o20' && p.price <= 20000) return false;
    if (shopState.rate && p.rating < shopState.rate) return false;
    if (shopState.q && (p.name + ' ' + p.cat).toLowerCase().indexOf(shopState.q) < 0) return false;
    return true;
  });
  if (shopState.sort === 'low') list.sort(function(a, b){ return a.price - b.price; });
  if (shopState.sort === 'high') list.sort(function(a, b){ return b.price - a.price; });
  if (shopState.sort === 'name') list.sort(function(a, b){ return a.name.localeCompare(b.name); });
  if (shopState.sort === 'rating') list.sort(function(a, b){ return b.rating - a.rating; });
  return list;
}
function initShop(){
  var grid = $('#pgrid'); if (!grid) return;
  var qc = new URLSearchParams(location.search).get('cat');
  if (qc && P.some(function(p){ return p.cat === qc; })){
    shopState.cat = qc;
    $$('.fchip').forEach(function(c){ c.classList.toggle('on', c.getAttribute('data-fcat') === qc); });
  }
  grid.innerHTML = Array(8).fill('<div class="skel"><div class="sk" style="height:150px"></div><div class="sk" style="height:16px;margin-top:12px"></div><div class="sk" style="height:16px;margin-top:8px;width:60%"></div></div>').join('');
  setTimeout(function(){
    renderGrid(grid, shopList());
    var rc = $('#resultCount'); if (rc) rc.textContent = shopList().length + ' products';
  }, 450);
  $$('.fchip').forEach(function(c){
    c.addEventListener('click', function(){
      $$('.fchip').forEach(function(x){ x.classList.remove('on'); });
      c.classList.add('on'); shopState.cat = c.getAttribute('data-fcat');
      renderGrid(grid, shopList());
      var rc = $('#resultCount'); if (rc) rc.textContent = shopList().length + ' products';
    });
  });
  var fc = $('#fltCat');
  if (fc){
    if (shopState.cat !== 'All') fc.value = shopState.cat;
    fc.addEventListener('change', function(){
      shopState.cat = fc.value; renderGrid(grid, shopList());
      var rc = $('#resultCount'); if (rc) rc.textContent = shopList().length + ' products';
    });
  }
  var ps = $('#fltPrice'); if (ps) ps.addEventListener('change', function(){ shopState.price = ps.value; renderGrid(grid, shopList()); });
  var rt = $('#fltRate'); if (rt) rt.addEventListener('change', function(){ shopState.rate = parseFloat(rt.value) || 0; renderGrid(grid, shopList()); });
  var so = $('#sortSel'); if (so) so.addEventListener('change', function(){ shopState.sort = so.value; renderGrid(grid, shopList()); });
  var si = $('#shopSearchIn');
  if (si) si.addEventListener('input', function(){ shopState.q = si.value.trim().toLowerCase(); renderGrid(grid, shopList()); });
}

/* ---------- product page ---------- */
function initProduct(){
  var stage = $('#galTrack'); if (!stage) return;
  var id = parseInt(new URLSearchParams(location.search).get('id') || '1', 10);
  var p = byId[id] || P[0];
  document.title = p.name + ' — ANTIFIRE';
  $('#pdCat').textContent = p.cat;
  $('#pdName').textContent = p.name;
  $('#pdPrice').textContent = fmt(p.price);
  $('#pdRate').innerHTML = '<b>' + STAR + ' ' + p.rating.toFixed(1) + '</b> / 5 rating';
  $('#pdDesc').textContent = p.desc;
  $('#pdSpecs').innerHTML = p.specs.map(function(s){ return '<li>' + s + '</li>'; }).join('');
  var slides = p.gallery.map(function(g){ return '<div class="gs"><img src="' + IMG + g + '" alt="' + p.name + '" width="900" height="560"></div>'; }).join('') +
    '<div class="gs"><span class="svgp" style="width:100%;height:100%">' + (ICONS[p.icon] || '') + '</span></div>';
  stage.innerHTML = slides;
  var thumbs = $('#galThumbs');
  thumbs.innerHTML = p.gallery.map(function(g, i){ return '<button data-g="' + i + '" class="' + (i === 0 ? 'on' : '') + '" aria-label="View photo ' + (i + 1) + '"><img src="' + IMG + g + '" alt="" loading="lazy" width="152" height="116"></button>'; }).join('') +
    '<button data-g="' + p.gallery.length + '" aria-label="View diagram"><span class="svgp" style="width:100%;height:100%">' + (ICONS[p.icon] || '') + '</span></button>';
  var idx = 0, total = p.gallery.length + 1;
  function go(n){
    idx = (n + total) % total;
    stage.style.transform = 'translateX(-' + (idx * 100) + '%)';
    $$('#galThumbs button').forEach(function(b, i){ b.classList.toggle('on', i === idx); });
  }
  thumbs.addEventListener('click', function(e){ var b = e.target.closest('[data-g]'); if (b) go(parseInt(b.getAttribute('data-g'), 10)); });
  var pv = $('#gPrev'), nx = $('#gNext');
  if (pv) pv.addEventListener('click', function(){ go(idx - 1); });
  if (nx) nx.addEventListener('click', function(){ go(idx + 1); });
  document.addEventListener('keydown', function(e){
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === 'ArrowLeft') go(idx - 1);
    if (e.key === 'ArrowRight') go(idx + 1);
  });
  var sx = null, stageBox = $('.gal-stage');
  stageBox.addEventListener('pointerdown', function(e){ sx = e.clientX; });
  stageBox.addEventListener('pointerup', function(e){
    if (sx === null) return;
    var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45) go(idx + (dx < 0 ? 1 : -1));
  });
  var qty = 1, qv = $('#pdQtyVal');
  $('#pdMinus').addEventListener('click', function(){ qty = Math.max(1, qty - 1); qv.textContent = qty; });
  $('#pdPlus').addEventListener('click', function(){ qty = Math.min(99, qty + 1); qv.textContent = qty; });
  $('#pdAdd').addEventListener('click', function(){ addToCart(p.id, qty, stageBox); });
  $('#pdBuy').addEventListener('click', function(){
    var it = cart.filter(function(i){ return i.id === p.id; })[0];
    if (it) it.qty += qty; else cart.push({ id: p.id, qty: qty });
    save(K.cart, cart); renderCart(); location.href = 'checkout.html';
  });
  var rel = P.filter(function(x){ return x.id !== p.id && x.cat === p.cat; });
  if (rel.length < 3) rel = rel.concat(P.filter(function(x){ return x.id !== p.id && x.cat !== p.cat; })).slice(0, 3);
  renderGrid($('#related'), rel.slice(0, 3));
}

/* ---------- hero slider ---------- */
function initSlider(){
  var root = $('.hslider'); if (!root) return;
  var track = $('.htrack', root), slides = $$('.hsl', root), segs = $$('.hseg', root);
  var i = 0, timer = null;
  function paint(){
    track.style.transform = 'translateX(-' + (i * 100) + '%)';
    segs.forEach(function(s, k){
      s.classList.toggle('on', k === i); s.classList.toggle('done', k < i);
      var f = $('i', s); if (f && k === i){ f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }
    });
  }
  function auto(){ if (timer) clearInterval(timer); timer = setInterval(function(){ i = (i + 1) % slides.length; paint(); }, 5500); }
  function manual(n){ i = (n + slides.length) % slides.length; paint(); auto(); }
  var pv = $('#hPrev'), nx = $('#hNext');
  if (pv) pv.addEventListener('click', function(){ manual(i - 1); });
  if (nx) nx.addEventListener('click', function(){ manual(i + 1); });
  segs.forEach(function(s, k){ s.addEventListener('click', function(){ manual(k); }); });
  if (window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches){
    root.addEventListener('mouseenter', function(){ if (timer) clearInterval(timer); });
    root.addEventListener('mouseleave', auto);
  }
  var sx = null;
  root.addEventListener('pointerdown', function(e){ sx = e.clientX; });
  root.addEventListener('pointerup', function(e){
    if (sx === null) return; var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 45) manual(i + (dx < 0 ? 1 : -1));
  });
  paint(); auto();
}

/* ---------- checkout + confirmation ---------- */
function initCheckout(){
  var form = $('#coForm'); if (!form) return;
  renderCart();
  function bad(id, msg){
    var f = $('#f-' + id); if (!f) return false;
    f.classList.add('bad'); var e = $('.err', f); if (e && msg) e.textContent = msg;
    return false;
  }
  function ok(id){ var f = $('#f-' + id); if (f) f.classList.remove('bad'); return true; }
  function val(id){
    var v = ($('#co-' + id).value || '').trim();
    if (id === 'name') return v.length >= 3 ? ok(id) : bad(id, 'Please enter your full name.');
    if (id === 'phone') return /^[0-9+\s-]{10,15}$/.test(v) ? ok(id) : bad(id, 'Enter a valid phone number (10 to 15 digits).');
    if (id === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? ok(id) : bad(id, 'Enter a valid email address.');
    if (id === 'city') return v.length >= 2 ? ok(id) : bad(id, 'Please enter your city.');
    if (id === 'address') return v.length >= 8 ? ok(id) : bad(id, 'Please enter your complete delivery address.');
    return ok(id);
  }
  ['name','phone','email','city','address'].forEach(function(id){
    var el = $('#co-' + id);
    if (el) el.addEventListener('input', function(){ val(id); });
  });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var all = ['name','phone','email','city','address'].map(val);
    if (all.indexOf(false) > -1){ toast('Please fix the highlighted fields.'); return; }
    if (!cart.length){ toast('Your cart is empty.'); return; }
    var btn = $('#placeBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Placing Order...';
    var sub = cartSubtotal(), ship = shipFee(sub);
    var order = {
      no: 'AF-2026-' + Math.floor(1000 + Math.random() * 9000),
      name: $('#co-name').value.trim(), city: $('#co-city').value.trim(),
      pay: $('#co-pay').value,
      items: cart.map(function(i){ var p = byId[i.id]; return { name: p.name, qty: i.qty, price: p.price }; }),
      sub: sub, ship: ship, total: sub + ship
    };
    setTimeout(function(){
      var ov = $('#orderOverlay'); if (ov) ov.classList.add('show');
      setTimeout(function(){
        save(K.ord, order);
        cart = []; save(K.cart, cart); renderCart();
        location.href = 'confirmation.html';
      }, 1500);
    }, 900);
  });
}
function initConfirmation(){
  var w = $('#confWrap'); if (!w) return;
  var o = load(K.ord, null);
  if (!o){ $('#confEmpty').style.display = 'block'; return; }
  $('#confMain').style.display = 'block';
  $('#confNo').textContent = o.no;
  $('#confName').textContent = o.name;
  $('#confItems').innerHTML = o.items.map(function(i){
    return '<div class="row"><span>' + i.name + ' x ' + i.qty + '</span><b>' + fmt(i.price * i.qty) + '</b></div>';
  }).join('');
  $('#confSub').textContent = fmt(o.sub);
  $('#confShip').textContent = o.ship === 0 ? 'FREE' : fmt(o.ship);
  $('#confTot').textContent = fmt(o.total);
}

/* ---------- global wiring ---------- */
document.addEventListener('click', function(e){
  var add = e.target.closest('[data-add]');
  if (add){ addToCart(parseInt(add.getAttribute('data-add'), 10), 1, add); return; }
  var w = e.target.closest('[data-wish]');
  if (w){ toggleWish(parseInt(w.getAttribute('data-wish'), 10), w); return; }
  var qv = e.target.closest('[data-qv]');
  if (qv){
    var p = byId[parseInt(qv.getAttribute('data-qv'), 10)];
    if (p){
      $('#qImg').src = IMG + p.gallery[0];
      $('#qName').textContent = p.name;
      $('#qCat').textContent = p.cat;
      $('#qPrice').textContent = fmt(p.price);
      $('#qDesc').textContent = p.desc;
      $('#qAdd').setAttribute('data-qadd', p.id);
      $('#qView').href = 'product.html?id=' + p.id;
      openModal();
    }
    return;
  }
  var qa = e.target.closest('[data-qadd]');
  if (qa){ addToCart(parseInt(qa.getAttribute('data-qadd'), 10), 1, null); closeModal(); return; }
  var qb = e.target.closest('[data-qact]');
  if (qb){ var id = parseInt(qb.getAttribute('data-qid'), 10); var it = cart.filter(function(i){ return i.id === id; })[0]; if (it) setQty(id, it.qty + parseInt(qb.getAttribute('data-qact'), 10)); return; }
  var rm = e.target.closest('[data-rm]');
  if (rm){ removeLine(parseInt(rm.getAttribute('data-rm'), 10), rm); return; }
});
document.addEventListener('DOMContentLoaded', function(){
  initPicker();
  renderCart();
  var cb = $('#cartBtn'); if (cb) cb.addEventListener('click', function(){ openLayer('.drawer'); });
  var cx = $('#cartX'); if (cx) cx.addEventListener('click', closeLayers);
  var mb = $('#menuBtn'); if (mb) mb.addEventListener('click', function(){ openLayer('.mnav'); });
  var mx = $('#menuX'); if (mx) mx.addEventListener('click', closeLayers);
  var bd = $('#backdrop'); if (bd) bd.addEventListener('click', closeLayers);
  var qx = $('#quickX'); if (qx) qx.addEventListener('click', closeModal);
  var qm = $('#quickModal'); if (qm) qm.addEventListener('click', function(e){ if (e.target === qm) closeModal(); });
  $$('.searchbox').forEach(bindSearch);
  /* categories dropdown + accordions */
  $$('.dropbtn').forEach(function(b){
    b.addEventListener('click', function(e){
      e.stopPropagation();
      var wrap = b.closest('.has-drop'), was = wrap.classList.contains('open');
      $$('.has-drop.open').forEach(function(x){ x.classList.remove('open'); });
      if (!was){ wrap.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
      else b.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', function(e){
    if (!e.target.closest('.has-drop')) $$('.has-drop.open').forEach(function(x){ x.classList.remove('open'); });
  });
  $$('.mcat > button').forEach(function(b){
    b.addEventListener('click', function(){
      var w = b.parentElement, open = w.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  /* header hide on scroll */
  var hd = $('.site-hd'), lastY = 0, ticking = false;
  if (hd){
    window.addEventListener('scroll', function(){
      if (ticking) return; ticking = true;
      requestAnimationFrame(function(){
        var y = Math.max(0, window.scrollY || 0), d = y - lastY;
        if (y > 170 && d > 6) hd.classList.add('hide');
        else if (d < -4 || y < 170) hd.classList.remove('hide');
        lastY = y; ticking = false;
      });
    }, { passive: true });
  }
  observeRv(document);
  if (PAGE === 'shop') initShop();
  if (PAGE === 'product') initProduct();
  if (PAGE === 'home') initSlider();
  if (PAGE === 'checkout') initCheckout();
  if (PAGE === 'confirmation') initConfirmation();
  if (PAGE === 'home'){ var rel = $('#featured'); if (rel) renderGrid(rel, P.slice(0, 8)); }
});
})();
