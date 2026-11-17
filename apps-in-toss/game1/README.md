# 생선 짝꿍 찾기 · 앱인토스판

웹판(저장소 맨 위 `index.html`)과 같은 게임을 토스 앱 안에서 돌아가게 만든 프로젝트예요.

- appName: `ieum-fish-match` (콘솔에 앱을 만들 때 똑같이 넣어야 해요. 한 번 정하면 못 바꿔요.)
- SDK: `@apps-in-toss/web-framework` 3.x

## 웹판과 다른 점

| 항목 | 앱인토스판 |
|---|---|
| 화면 | 화면 전체 사용, 오른쪽 위 토스 버튼(더보기·닫기) 자리를 비워 둠, Safe Area 반영 |
| 판 크기 | 24장이 휴대폰 한 화면에 다 들어오도록 판 너비를 자동 조절 |
| 사용자 | 처음 열 때 토스 익명 사용자 키를 받아 기기에 저장 |
| 기록 | 최고 기록·소리 설정을 토스 기기 저장소에 보관 (앱을 껐다 켜도 남음) |
| 햅틱 | 뒤집기·짝 맞춤·틀림·성공마다 진동 |
| 소리 | 켜기/끄기 버튼, 다른 앱으로 가면 멈추고 돌아오면 다시 재생 |
| 뒤로가기 | 창 닫기 → 진행 중이면 "처음으로 갈까요?" → 시작 화면이면 "게임을 끝낼까요?" 확인 후 종료 |
| 공유 | 토스 공유 시트로 기록 자랑 (토스 앱 링크 포함) |
| 외부 링크 | 가게·깃허브 링크는 뺌 (앱인토스 규정: 자사 서비스 이동 유도 금지) |
| 글꼴 | Jua·고운돋움을 게임에 쓰는 글자만 남겨 넣음 (인터넷에서 받지 않음) |

## 만들기

```sh
npm install
npm run dev     # 브라우저에서 확인 (오른쪽 아래 AIT 버튼으로 토스 환경 흉내)
npm run build   # dist/ 와 ieum-fish-match.ait 가 만들어짐
```

`ieum-fish-match.ait`를 앱인토스 콘솔에 올리면 돼요.

## 글자를 바꿨다면

글꼴은 쓰는 글자만 남긴 파일이라, `index.html`이나 `src/main.js`에 새 한글을 넣으면 그 글자가 기본 글꼴로 보여요.
아래처럼 다시 만들어 주세요. (원본 글꼴: Google Fonts의 Jua, Gowun Dodum — OFL 라이선스, `src/fonts/OFL-*.txt`)

```sh
python3 -c "s=open('index.html').read()+open('src/main.js').read(); open('chars.txt','w').write(''.join(sorted({c for c in s if '가'<=c<='힣'})))"
pyftsubset Jua-Regular.ttf --text-file=chars.txt --unicodes="U+0020-007E,U+00B7,U+2026,U+2018-201D" --flavor=woff2 --layout-features='*' --output-file=src/fonts/jua-subset.woff2
pyftsubset GowunDodum-Regular.ttf --text-file=chars.txt --unicodes="U+0020-007E,U+00B7,U+2026,U+2018-201D" --flavor=woff2 --layout-features='*' --output-file=src/fonts/gowun-dodum-subset.woff2
```
