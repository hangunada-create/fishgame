// 생선 짝꿍 찾기 · 앱인토스판
// 게임 규칙은 웹판(fishgame/index.html)과 같고, 토스 안에서 필요한 것만 더했다:
//   사용자 식별키, 기기 저장소(기록 유지), 햅틱, Safe Area, 뒤로가기·종료 확인, 토스 공유.
// 토스 밖(일반 브라우저)에서도 돌아가도록 SDK 호출은 모두 실패해도 괜찮게 감쌌다.
import { User, Storage, Device, SafeArea, Screen, Share, graniteEvent } from "@apps-in-toss/web-framework";

const APP_NAME = "ieum-fish-match";
// 그림 번호 순서대로의 생선 이름 (images/fish1~12)
const NAMES = ["광어","홍어","웅어","숭어","병어","밴댕이","아나고","참돔","전어","민어","준치","삼치"];
const MODES = {
  full: { pairs: 12, label: "도전", key: "best-full" },
  easy: { pairs: 8,  label: "연습", key: "best-easy" },
};
const $ = (id) => document.getElementById(id);
const img = (name) => "images/" + name;

/* ---------- 토스 SDK 감싸기 ---------- */
const safe = async (fn, fallback) => { try { return await fn(); } catch (e) { return fallback; } };

// Safe Area: 토스가 주는 값으로 CSS 변수를 채운다 (일반 브라우저에서는 env() 그대로)
function applyInsets(i) {
  if (!i) return;
  const r = document.documentElement.style;
  r.setProperty("--sat", (i.top || 0) + "px");
  r.setProperty("--sab", (i.bottom || 0) + "px");
  r.setProperty("--sal", (i.left || 0) + "px");
  r.setProperty("--sar", (i.right || 0) + "px");
}
try { applyInsets(SafeArea.get()); SafeArea.subscribe({ onEvent: applyInsets }); } catch (e) {}

// 기록 저장: 토스 기기 저장소 → 안 되면 localStorage
const store = {
  async get(k) {
    const v = await safe(() => Storage.getItem(k), undefined);
    if (v !== undefined) return v;
    try { return localStorage.getItem(k); } catch (e) { return null; }
  },
  async set(k, v) {
    const ok = await safe(async () => { await Storage.setItem(k, v); return true; }, false);
    if (!ok) { try { localStorage.setItem(k, v); } catch (e) {} }
  },
};
const getBest = async (k) => { const v = parseInt(await store.get(k), 10); return isNaN(v) ? null : v; };

// 사용자 식별키: 게임 시작 전에 한 번만 받아 저장해 둔다
async function ensureUserKey() {
  const saved = await store.get("user-key");
  if (saved) return saved;
  const res = await safe(async () => (User.getAnonymousKey.isSupported() ? await User.getAnonymousKey() : null), null);
  const hash = res && res.hash;
  if (hash) await store.set("user-key", hash);
  return hash || null;
}

// 햅틱: 연타로 과하게 부르지 않도록 짧은 간격을 둔다
let lastHaptic = 0;
function haptic(type) {
  const now = Date.now();
  if (now - lastHaptic < 60) return;
  lastHaptic = now;
  safe(() => Device.triggerHaptic({ type }));
}

/* ---------- 소리 ---------- */
const snd = (n) => { const a = new Audio("sound/" + n + ".mp3"); a.preload = "auto"; return a; };
const S = { bgm: snd("bgm"), flip: snd("flip"), match: snd("match"), fail: snd("fail"), clear: snd("clear") };
S.bgm.loop = true; S.bgm.volume = .3; S.flip.volume = .6; S.match.volume = .8; S.fail.volume = .6; S.clear.volume = .8;
let soundOn = true;
const play = (a) => {
  if (!soundOn) return;
  try { a.currentTime = 0; const p = a.play(); if (p) p.catch(() => {}); } catch (e) {}
};
const resumeBgm = () => { if (soundOn && playing && document.visibilityState === "visible") { const p = S.bgm.play(); if (p) p.catch(() => {}); } };
// 다른 앱으로 넘어가면 바로 멈추고, 돌아오면 이어서
document.addEventListener("visibilitychange", () => { if (document.hidden) S.bgm.pause(); else resumeBgm(); });
window.addEventListener("pagehide", () => S.bgm.pause());

/* ---------- 게임 ---------- */
let mode = "full", inPlay = [], first = null, lock = false, matched = 0, flips = 0, time = 0, timer = null, playing = false;

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

async function showStart() {
  clearInterval(timer); timer = null; playing = false; S.bgm.pause();
  const [bf, be] = await Promise.all([getBest(MODES.full.key), getBest(MODES.easy.key)]);
  $("bestFull").textContent = bf == null ? "" : "최고 " + bf + "초";
  $("bestEasy").textContent = be == null ? "" : "최고 " + be + "초";
  $("clear").hidden = true; $("start").hidden = false;
}

function begin(m) {
  mode = m; $("start").hidden = true; $("clear").hidden = true;
  deal();
  resumeBgm();
}

function deal() {
  clearInterval(timer); timer = null;
  const M = MODES[mode];
  first = null; lock = false; matched = 0; flips = 0; time = 0; playing = true;
  $("time").textContent = 0; $("flips").textContent = 0; $("count").textContent = 0; $("total").textContent = "/ " + M.pairs;
  $("news").textContent = "아무 카드나 눌러 시작하세요. 시간은 첫 카드부터 재요.";
  $("shareMsg").textContent = "";
  // 연습 판은 12종 가운데 8종을 골라 쓴다
  inPlay = shuffle([...Array(12).keys()]).slice(0, M.pairs).sort((a, b) => a - b);
  const board = $("board"); board.innerHTML = "";
  board.classList.toggle("small", M.pairs === 8);
  shuffle([...inPlay, ...inPlay]).forEach((f) => {
    const el = document.createElement("button");
    el.type = "button"; el.className = "card";
    el.setAttribute("aria-label", "뒤집힌 카드");
    el.innerHTML = '<div class="inner"><div class="face back"><img src="' + img("back.webp") + '" alt=""></div>' +
      '<div class="face front"><img src="' + img("fish" + (f + 1) + ".webp") + '" alt=""><span class="tag">' + NAMES[f] + "</span></div></div>";
    el.addEventListener("click", () => flip(el, f));
    board.appendChild(el);
  });
}

function startClock() {
  if (timer) return;
  timer = setInterval(() => { time++; $("time").textContent = time; }, 1000);
}

function flip(el, f) {
  if (lock || el.classList.contains("flipped") || el.classList.contains("matched")) return;
  startClock();
  el.classList.add("flipped");
  el.setAttribute("aria-label", NAMES[f]);
  flips++; $("flips").textContent = flips;
  play(S.flip); haptic("tickWeak");
  if (!first) { first = { el, f }; if (flips === 1) $("news").textContent = ""; return; }
  const a = first; first = null;
  if (a.f === f) {
    [a.el, el].forEach((x) => { x.classList.remove("flipped"); x.classList.add("matched"); x.setAttribute("aria-label", NAMES[f] + " 짝 완성"); });
    play(S.match); haptic("success");
    matched++; $("count").textContent = matched;
    $("news").textContent = NAMES[f] + " 짝꿍 찾았다!";
    if (matched === MODES[mode].pairs) finish();
  } else {
    lock = true; play(S.fail); haptic("error");
    [a.el, el].forEach((x) => x.classList.add("wrong"));
    setTimeout(() => {
      [a.el, el].forEach((x) => { x.classList.remove("flipped", "wrong"); x.setAttribute("aria-label", "뒤집힌 카드"); });
      lock = false;
    }, 900);
  }
}

async function finish() {
  clearInterval(timer); timer = null; playing = false;
  S.bgm.pause(); play(S.clear); haptic("confetti");
  const M = MODES[mode], prev = await getBest(M.key);
  $("clearTitle").textContent = M.pairs + "쌍 모두 찾았어요!";
  $("result").textContent = M.label + " · " + time + "초 · 뒤집기 " + flips + "번";
  $("genius").hidden = !(mode === "full" && time <= 60);
  let msg;
  if (prev == null) msg = "첫 기록이에요. 다음 판은 이 기록과 겨뤄 봐요.";
  else if (time < prev) msg = "지난 최고 기록보다 " + (prev - time) + "초 빨라졌어요!";
  else if (time === prev) msg = "최고 기록과 똑같아요. 한 끗 차이!";
  else msg = "최고 기록은 " + prev + "초. 지난번의 나에게 조금씩 다가가는 중이에요.";
  if (mode === "easy") msg += " 이제 도전 판(12쌍)도 해 볼까요?";
  $("msg").textContent = msg;
  if (prev == null || time < prev) await store.set(M.key, String(time));
  $("switch").textContent = mode === "easy" ? "도전 판으로" : "연습 판으로";
  document.querySelectorAll("#fishList .fish").forEach((d, k) => d.classList.toggle("dim", !inPlay.includes(k)));
  setTimeout(() => { $("clear").hidden = false; }, 600);
}

/* ---------- 기록 자랑하기: 토스 공유 시트 ---------- */
let sharing = false;
async function brag() {
  if (sharing) return;
  sharing = true;
  const M = MODES[mode];
  const lines = ["🐟 생선 짝꿍 찾기 (" + M.label + ")", "생선 " + M.pairs + "쌍을 " + time + "초 만에 찾았어요! (뒤집기 " + flips + "번)"];
  if (mode === "full" && time <= 60) lines.push("🏅 기억력 천재 인증");
  lines.push("나보다 빨리 찾을 수 있어?");
  const link = await safe(() => Share.createLink({ path: "intoss://" + APP_NAME }), null);
  if (link) lines.push("👉 " + link);
  const text = lines.join("\n");
  const sent = await safe(async () => { await Share.sendMessage({ message: text }); return true; }, false);
  if (sent) $("shareMsg").textContent = "자랑 완료! 친구 기록도 궁금하네요.";
  else {
    const copied = await safe(async () => { await navigator.clipboard.writeText(text); return true; }, false);
    $("shareMsg").textContent = copied ? "복사했어요. 친구에게 붙여 넣어 보세요!" : "지금은 공유할 수 없어요.";
  }
  sharing = false;
}

/* ---------- 확인 창 (뒤로가기·종료) ---------- */
let onYes = null;
function ask(title, text, yesLabel, yes) {
  $("confirmTitle").textContent = title; $("confirmText").textContent = text; $("confirmYes").textContent = yesLabel;
  onYes = yes; $("confirm").hidden = false;
}
$("confirmNo").addEventListener("click", () => { $("confirm").hidden = true; onYes = null; });
$("confirmYes").addEventListener("click", () => { $("confirm").hidden = true; const f = onYes; onYes = null; if (f) f(); });

function exitGame() {
  ask("게임을 끝낼까요?", "최고 기록은 그대로 남아 있어요.", "끝내기", () => {
    S.bgm.pause();
    safe(() => Screen.close());
  });
}

// 안드로이드 뒤로가기: 창 닫기 → 진행 중이면 처음으로 → 시작 화면이면 종료 확인
function onBack() {
  if (!$("confirm").hidden) { $("confirm").hidden = true; onYes = null; return; }
  if (!$("clear").hidden) { showStart(); return; }
  if ($("start").hidden) {
    if (matched > 0 || flips > 0) ask("처음으로 갈까요?", "이번 판 기록은 저장되지 않아요.", "처음으로", showStart);
    else showStart();
    return;
  }
  exitGame();
}
try { graniteEvent.addEventListener("backEvent", { onEvent: onBack, onError: () => {} }); } catch (e) {}

/* ---------- 화면 준비 ---------- */
$("cat").src = img("cat216.webp");
NAMES.forEach((n, k) => {
  const im = document.createElement("img"); im.src = img("fish" + (k + 1) + ".webp"); im.alt = ""; $("shoal").appendChild(im);
  const d = document.createElement("div"); d.className = "fish";
  d.innerHTML = '<img src="' + img("fish" + (k + 1) + ".webp") + '" alt="" loading="lazy"><b>' + n + "</b>";
  $("fishList").appendChild(d);
});
document.querySelectorAll(".mode").forEach((b) => b.addEventListener("click", () => { haptic("tap"); begin(b.dataset.mode); }));
$("music").addEventListener("click", () => {
  soundOn = !soundOn;
  $("music").textContent = soundOn ? "🎵 소리 끄기" : "🔇 소리 켜기";
  $("music").setAttribute("aria-pressed", String(soundOn));
  store.set("sound", soundOn ? "on" : "off");
  if (soundOn) resumeBgm(); else S.bgm.pause();
});
$("menu").addEventListener("click", () => {
  if (playing && (flips > 0)) ask("처음으로 갈까요?", "이번 판 기록은 저장되지 않아요.", "처음으로", showStart);
  else showStart();
});
$("restart").addEventListener("click", () => begin(mode));
$("switch").addEventListener("click", () => begin(mode === "easy" ? "full" : "easy"));
$("brag").addEventListener("click", brag);

(async () => {
  if ((await store.get("sound")) === "off") {
    soundOn = false; $("music").textContent = "🔇 소리 켜기"; $("music").setAttribute("aria-pressed", "false");
  }
  await ensureUserKey();
  await showStart();
})();
