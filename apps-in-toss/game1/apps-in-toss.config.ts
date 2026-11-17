import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 앱인토스 콘솔에서 앱을 만들 때 넣는 appName과 똑같아야 해요.
  appName: 'ieum-fish-match',
  permissions: [],
  // 게임은 화면 전체를 쓰고, 오른쪽 위에 토스의 더보기·닫기 버튼만 떠요.
  navigationBar: {
    transparentBackground: true,
    theme: 'light',
  },
  webView: {
    bounces: false,
    overScrollMode: 'never',
    pullToRefreshEnabled: false,
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: false,
  },
  webBundleDir: 'dist',
});
