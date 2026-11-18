// 생선 짝꿍 찾기(1탄) 오프라인 지원.
// 이 저장소에는 2~11탄도 들어 있으므로, 1탄 파일만 미리 담아 두고
// 나머지 요청은 손대지 않고 그대로 인터넷으로 보낸다.
const CACHE = "fish-pair-v1";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./images/back.webp", "./images/cat216.webp",
  ...Array.from({ length: 12 }, (_, i) => `./images/fish${i + 1}.webp`),
  "./sound/bgm.mp3", "./sound/flip.mp3", "./sound/match.mp3", "./sound/fail.mp3", "./sound/clear.mp3",
  "./icons/icon-192.png", "./icons/icon-512.png",
];
const BASE = new URL("./", self.location).href;
const OWN = new Set(FILES.map((f) => new URL(f, BASE).href));

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("fish-pair-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  url.search = "";
  if (!OWN.has(url.href)) return; // 2~11탄, 외부 글꼴 등은 그대로 통과

  // 첫 화면은 새 버전을 먼저 시도하고, 안 되면 담아 둔 것을 쓴다
  if (req.mode === "navigate" || url.href === BASE || url.href.endsWith("/index.html")) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // 그림·소리는 담아 둔 것을 먼저
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
