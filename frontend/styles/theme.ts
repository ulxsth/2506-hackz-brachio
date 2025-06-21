// frontend/styles/theme.ts
// TailwindCSSやアプリ全体で使うカラーパレット・フォント設定

export const theme = {
  colors: {
    terminalBg: '#000000', // ターミナル背景
    terminalText: '#22d3ee', // メイン文字色（例: text-green-400）
    terminalAccent: '#16a34a', // アクセント（ボタン等）
    terminalBorder: '#374151', // ボーダー色（border-gray-700）
    error: '#f87171', // エラー用（text-red-400）
    info: '#38bdf8', // 情報用（text-sky-400）
    // 必要に応じて追加
  },
  fonts: {
    mono: 'Geist Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    sans: 'Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif',
  },
};

export default theme;
