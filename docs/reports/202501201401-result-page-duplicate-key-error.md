# リザルトページ同名ユーザ重複キーエラー調査レポート 🔍

## 📋 問題概要

リザルトページで同名ユーザが存在する場合、Reactのkey重複エラーが発生する。

```
Encountered two children with the same key, `yotu2`. 
Keys should be unique so that components maintain their identity across updates. 
Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.
```

## 🔍 原因分析

### 問題箇所
- **ファイル**: `/home/yotu/github/2506-hackz-brachio/frontend/app/result/page.tsx`
- **行番号**: 217行目
- **問題コード**:
```tsx
{results.map((player, index) => (
  <div
    key={player.name}  // ← ここが問題！同名ユーザでkey重複
    className={`flex items-center justify-between p-4 rounded-lg...`}
  >
```

### 根本原因
1. **プレイヤー識別にnameを使用**: `key={player.name}`でname基準のキーを設定
2. **同名ユーザの存在**: 複数ユーザが同じニックネーム（例：`yotu2`）を設定可能
3. **ユニークID不使用**: プレイヤーのユニークIDではなく、重複可能なnameを使用

## 🛠️ 解決方法

### 1. インデックスベースのキー（応急処置）
```tsx
{results.map((player, index) => (
  <div
    key={index}  // インデックスを使用
    // ...
  >
```

### 2. プレイヤーIDベースのキー（推奨）
```tsx
{results.map((player, index) => (
  <div
    key={player.id || `player-${index}`}  // ユニークIDを使用
    // ...
  >
```

### 3. 複合キーの使用（安全策）
```tsx
{results.map((player, index) => (
  <div
    key={`${player.name}-${player.score}-${index}`}  // 複合キー
    // ...
  >
```

## 🔍 影響範囲確認

### 他の潜在的問題箇所
1. **game/page.tsx**: プレイヤーリストでの同様の問題
2. **room/page.tsx**: 参加者一覧での同様の問題

### 検索結果
- game/page.tsx: `key={player.name}` (line 493)
- room/page.tsx: `key={player.id}` ✅ 正しく実装済み

## 💡 推奨実装

### PlayerResultインターフェースの拡張
```tsx
interface PlayerResult {
  id: string;        // ← ユニークIDを追加
  name: string;
  score: number;
  rank: number;
  wordCount: number;
  maxCombo: number;
  accuracy: number;
}
```

### データベースクエリの修正
```typescript
// API結果→UI表示用の変換時にIDを含める
const convertedResults: PlayerResult[] = result.data.results.map((player: any) => ({
  id: player.id,      // ← プレイヤーIDを含める
  name: player.name,
  score: player.score,
  rank: player.rank,
  wordCount: player.wordCount,
  maxCombo: player.maxCombo,
  accuracy: player.accuracy
}));
```

## 🚨 優先度

**高**: ユーザエクスペリエンスに直接影響し、同名ユーザが参加した場合に必ず発生する問題

## 📝 修正手順

1. **即座の対応**: インデックスベースキーへの変更
2. **根本対策**: PlayerResultインターフェースにidを追加
3. **データ取得の修正**: getGameResults関数でIDを含むデータ取得
4. **同様問題の修正**: game/page.tsxの同様箇所の修正

## 🔄 テストケース

- 同名ユーザ2人でゲーム実行
- リザルトページ遷移
- Reactキーエラーの解消確認
- UI表示の正常動作確認

---
**作成日**: 2025-06-20  
**関連ファイル**: 
- `/frontend/app/result/page.tsx` 
- `/frontend/app/game/page.tsx`
- `/frontend/hooks/useRoom.ts`
