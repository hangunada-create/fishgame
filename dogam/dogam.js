/* 이음수산 생선 도감 — 아임웹 주문 조회 화면에 '도감으로 보기' 버튼을 붙인다.
 * 주문 목록은 건드리지 않고, 버튼을 누르면 도감 창만 띄운다. */
(function () {
  'use strict';

  // 이미지가 올라가 있는 주소 (poster.jpg, 생선 PNG 12장이 있는 폴더). 끝에 / 를 붙인다.
  var BASE = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || '';

  // 대표생선 12종: [파일 이름, 표시 이름, 상품명에서 찾을 낱말들, 포스터 위 자리]
  var FISH = [
    ['byeongeo', '병어', ['병어'], [[68.236, 10.06, 16.63, 0.6, 0]]],
    ['jeoneo', '전어', ['전어'], [[88.859, 11.306, 16.363, 1.7, 0], [87.365, 15.795, 14.376, 1.6, 0]]],
    ['gwangeo', '광어', ['광어', '자광', '넙치'], [[20.231, 18.864, 23.402, 12.6, 0]]],
    ['chamdom', '참돔', ['참돔', '도미'], [[61.863, 19.702, 22.484, 2.1, 0]]],
    ['ungeo', '웅어', ['웅어'], [[40.264, 28.605, 19.409, 1.8, 0]]],
    ['baendaengi', '밴댕이', ['밴댕이'], [[75.418, 29.821, 11.844, 1.3, 0], [79.675, 32.065, 10.781, 1.3, 0], [74.009, 35.113, 9.814, 1.4, 0]]],
    ['sungeo', '숭어', ['숭어'], [[27.064, 44.735, 23.093, -0.1, 0]]],
    ['hongeo', '홍어', ['홍어'], [[64.589, 57.215, 23.667, 15, 0]]],
    ['anago', '아나고', ['아나고', '붕장어'], [[35.254, 58.273, 26.257, -0.2, 0]]],
    ['mineo', '민어', ['민어'], [[23.721, 69.691, 29.036, 339.5, 1]]],
    ['samchi', '삼치', ['삼치'], [[77.563, 69.726, 40.972, -2.3, 1]]],
    ['junchi', '준치', ['준치'], [[62.798, 81.985, 16.142, 1.1, 0]]]
  ];
  // 이 상태인 주문만 도감에 넣는다 (먹은 것으로 본다)
  var EATEN = /배송완료|구매확정/;
  var ANY_STATUS = /결제완료|입금대기|배송준비중|배송대기|배송중|배송완료|구매확정|취소요청|취소완료|반품요청|반품수거중|반품수거완료|반품완료|교환\s?요청|수거진행중|교환수거완료|교환완료|환불완료/;

  var list = document.getElementById('shop_mypage_orderlist');
  if (!list) return; // 주문 조회 페이지가 아니면 아무것도 안 함

  /* ── 스타일 ── */
  var css = '' +
    '.ieum-dg-btn{display:inline-flex;align-items:center;gap:6px;border:0;cursor:pointer;background:#34466a;color:#fff;font:inherit;font-size:14px;font-weight:700;padding:7px 14px 7px 10px;border-radius:999px;line-height:1.4}' +
    '.ieum-dg-btn span{background:#fff;color:#34466a;border-radius:999px;padding:0 7px;font-size:12px}' +
    '.ieum-dg-btn:focus-visible{outline:3px solid #6fa3e3;outline-offset:2px}' +
    '.ieum-dg-btn.m{margin:0 0 14px}' +
    '.ieum-dg{position:fixed;inset:0;z-index:99999;background:rgba(18,28,48,.62);display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:16px 12px}' +
    '.ieum-dg[hidden]{display:none}' +
    '.ieum-dg-box{width:min(520px,100%);background:#fff;color:#22242a;border-radius:14px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);text-align:left}' +
    '.ieum-dg-top{display:flex;align-items:center;gap:12px;padding:14px 16px}' +
    '.ieum-dg-top b{flex:1;font-size:20px}' +
    '.ieum-dg-count{font-size:19px;font-weight:700;color:#34466a}' +
    '.ieum-dg-count small{font-size:13px;color:#6c7280;font-weight:400}' +
    '.ieum-dg-x{border:0;background:none;font-size:26px;line-height:1;color:#6c7280;cursor:pointer;width:36px;height:36px}' +
    '.ieum-dg-poster{position:relative;aspect-ratio:1826/2576;background:#c5e8fa}' +
    '.ieum-dg-poster>img.bg{position:absolute;inset:0;width:100%;height:100%;display:block}' +
    '.ieum-dg-stk{position:absolute;max-width:none!important;pointer-events:none;filter:drop-shadow(0 1.5px 1.5px rgba(10,25,50,.35));animation:ieumStamp .42s cubic-bezier(.2,1.6,.4,1) both}' +
    '@keyframes ieumStamp{from{opacity:0;scale:1.6}to{opacity:1;scale:1}}' +
    '@media (prefers-reduced-motion:reduce){.ieum-dg-stk{animation:none}}' +
    '.ieum-dg-load{position:absolute;left:0;right:0;top:48%;text-align:center;font-size:18px;font-weight:700;color:#34466a}' +
    '.ieum-dg-foot{padding:14px 16px 18px;display:grid;gap:10px}' +
    '.ieum-dg-bar{height:8px;border-radius:99px;background:#e3e5ea;overflow:hidden}' +
    '.ieum-dg-bar i{display:block;height:100%;width:0;background:#3f78bf;border-radius:99px;transition:width .5s}' +
    '.ieum-dg-msg{margin:0;font-size:14px;color:#6c7280}' +
    '.ieum-dg-left{display:flex;flex-wrap:wrap;gap:6px}' +
    '.ieum-dg-left span{font-size:13px;color:#34466a;border:1px solid #e3e5ea;border-radius:999px;padding:3px 10px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ── 버튼 ── */
  function makeBtn(extra) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ieum-dg-btn' + (extra ? ' ' + extra : '');
    b.innerHTML = '<span>도감</span>도감으로 보기';
    b.addEventListener('click', open);
    return b;
  }
  // PC: '주문 조회' 제목 오른쪽
  var titleRow = null;
  var cands = document.querySelectorAll('.tw-flex.tw-justify-between');
  for (var i = 0; i < cands.length; i++) {
    if (cands[i].textContent.replace(/\s/g, '') === '주문조회') { titleRow = cands[i]; break; }
  }
  if (titleRow) titleRow.appendChild(makeBtn());
  // 모바일: 제목이 숨겨지므로 목록 바로 위에 하나 더 (모바일에서만 보임)
  var mBtn = makeBtn('m visible-xs');
  mBtn.style.display = 'none';
  list.parentNode.insertBefore(mBtn, list);
  function syncMobile() { mBtn.style.display = (!titleRow || titleRow.offsetParent === null) ? 'inline-flex' : 'none'; }
  syncMobile(); window.addEventListener('resize', syncMobile);

  /* ── 도감 창 ── */
  var dg = document.createElement('div');
  dg.className = 'ieum-dg'; dg.hidden = true;
  dg.setAttribute('role', 'dialog'); dg.setAttribute('aria-modal', 'true'); dg.setAttribute('aria-label', '나의 생선 도감');
  dg.innerHTML =
    '<div class="ieum-dg-box">' +
      '<div class="ieum-dg-top"><b>나의 생선 도감</b><span class="ieum-dg-count"></span>' +
      '<button type="button" class="ieum-dg-x" aria-label="도감 닫기">×</button></div>' +
      '<div class="ieum-dg-poster"><img class="bg" alt="목포 바다 수심 포스터" src="' + BASE + 'poster.jpg">' +
      '<div class="ieum-dg-load">도감 불러오는 중…</div></div>' +
      '<div class="ieum-dg-foot"><div class="ieum-dg-bar"><i></i></div><p class="ieum-dg-msg"></p><div class="ieum-dg-left"></div></div>' +
    '</div>';
  document.body.appendChild(dg);
  var $ = function (s) { return dg.querySelector(s); };
  $('.ieum-dg-x').addEventListener('click', close);
  dg.addEventListener('click', function (e) { if (e.target === dg) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dg.hidden) close(); });

  function close() { dg.hidden = true; document.documentElement.style.overflow = ''; }

  /* ── 주문 전부 읽기: '더보기'가 있으면 끝까지 눌러서 불러온다 ── */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function moreVisible() {
    var m = document.getElementById('shop_mypage_orderlist_more');
    return m && m.style.display !== 'none' && m.offsetParent !== null;
  }
  async function loadAll() {
    for (var n = 0; n < 40 && moreVisible(); n++) {
      var before = list.innerHTML.length;
      try { window.SITE_SHOP_MYPAGE.C3_getOrderList('order'); } catch (e) { break; }
      for (var t = 0; t < 40 && list.innerHTML.length === before; t++) await wait(150);
      if (list.innerHTML.length === before) break;
    }
    // 첫 화면이 아직 '불러오는 중'이면 잠깐 기다림
    for (var k = 0; k < 30 && !ANY_STATUS.test(list.textContent); k++) await wait(150);
  }
  // 품목 하나 = 주문 상태 글자가 딱 하나 들어 있는 가장 큰 묶음
  function readItems() {
    var out = [];
    var all = list.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i], txt = el.textContent;
      var m = txt.match(new RegExp(ANY_STATUS.source, 'g'));
      if (!m || m.length !== 1) continue;
      var p = el.parentElement, pm = p && p.textContent.match(new RegExp(ANY_STATUS.source, 'g'));
      if (p === list || (pm && pm.length > 1)) out.push({ text: txt, status: m[0] });
    }
    return out;
  }

  async function open() {
    dg.hidden = false; document.documentElement.style.overflow = 'hidden';
    var poster = $('.ieum-dg-poster');
    poster.querySelectorAll('.ieum-dg-stk').forEach(function (n) { n.remove(); });
    $('.ieum-dg-load').hidden = false; $('.ieum-dg-count').textContent = '';
    $('.ieum-dg-bar i').style.width = '0'; $('.ieum-dg-msg').textContent = ''; $('.ieum-dg-left').innerHTML = '';
    $('.ieum-dg-x').focus();

    await loadAll();
    var got = {}, items = readItems();
    items.forEach(function (it) {
      if (!EATEN.test(it.status)) return;
      FISH.forEach(function (f) { if (f[2].some(function (w) { return it.text.indexOf(w) > -1; })) got[f[0]] = 1; });
    });
    $('.ieum-dg-load').hidden = true;

    var n = 0, left = [];
    FISH.forEach(function (f) {
      if (!got[f[0]]) { left.push(f[1]); return; }
      f[3].forEach(function (p) {
        var im = document.createElement('img');
        im.className = 'ieum-dg-stk'; im.alt = f[1] + ' 띠부씰'; im.src = BASE + f[0] + '.png';
        im.style.cssText = 'left:' + p[0] + '%;top:' + p[1] + '%;width:' + p[2] + '%;transform:translate(-50%,-50%) rotate(' + p[3] + 'deg)' + (p[4] ? ' scaleX(-1)' : '') + ';animation-delay:' + (n * 0.12) + 's';
        poster.appendChild(im);
      });
      n++;
    });
    $('.ieum-dg-count').innerHTML = n + '<small> / 12</small>';
    requestAnimationFrame(function () { $('.ieum-dg-bar i').style.width = (n / 12 * 100) + '%'; });
    $('.ieum-dg-msg').textContent = n === 12 ? '12종을 모두 모았습니다!' : '아직 만나지 못한 생선 ' + left.length + '종';
    $('.ieum-dg-left').innerHTML = left.map(function (x) { return '<span>' + x + '</span>'; }).join('');
  }
})();
