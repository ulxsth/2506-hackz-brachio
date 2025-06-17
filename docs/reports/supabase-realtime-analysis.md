# Supabase Realtime スケーラビリティ分析 🚀

## 概要
TYPE 2 LIVE（リアルタイム100人規模のタイピングゲーム）におけるSupabase Realtimeの適性を調査しました。

## 制限・性能の調査結果 📊

### 同時接続数の制限
- **Free Plan**: 200同時接続
- **Pro Plan**: 500同時接続 (その後$10/1000接続)
- **Team Plan**: 500同時接続 (その後$10/1000接続)
- **Enterprise**: カスタム（相談）

### メッセージ容量・頻度
- **Free Plan**: 月間200万メッセージ
- **Pro Plan**: 月間500万メッセージ (その後$2.50/100万メッセージ)
- **最大メッセージサイズ**: 
  - Free: 250KB
  - Pro/Team: 3MB

### アーキテクチャ特性
- **技術**: Elixir + Phoenix Framework
- **WebSocket**: 高性能な接続管理
- **メッセージ配信**: 保証なし（ベストエフォート）
- **データ処理**: Broadcastは一時的、Presenceは計算集約的

## 100人規模のタイピングゲームでの適性分析 🎯

### ✅ 適している点

1. **接続数**: 100人ならFree Planでも十分（200接続制限）
2. **低遅延**: Broadcastは一時的メッセージでDB経由なし
3. **リアルタイム性**: WebSocketベースで高性能
4. **技術的信頼性**: Elixir/Phoenixの並行処理に強み

### ⚠️ 懸念点・制約

1. **メッセージ配信保証なし**
   - 重要なゲーム状態は別途DBに保存必要
   - タイピング進捗の一部ロストの可能性

2. **Presence機能の計算負荷**
   - 100人の状態同期は計算集約的
   - 公式でも「控えめに使用」推奨

3. **高頻度更新での課題**
   - タイピング速度によってはメッセージ量が急増
   - 月間制限への影響

## 推奨アーキテクチャ設計 🏗️

### 1. ハイブリッド設計
```
- Broadcast: キーストローク、リアルタイム表示
- Presence: 参加者状態、「誰が入力中」表示
- Postgres Changes: ゲーム結果、重要な状態変更
```

### 2. 負荷分散戦略
```
- 部屋ごとにChannelを分離
- 不要なメッセージをフィルタリング
- Presenceの更新頻度を制御（スロットリング）
```

### 3. フォールバック設計
```
- 重要なデータは必ずDB永続化
- 接続断での状態復旧機能
- メッセージロスト時の再同期機能
```

## TYPE 2 LIVEでの実装推奨 🎮

### メッセージ設計
```typescript
// 軽量なBroadcastメッセージ
interface TypingEvent {
  userId: string;
  progress: number;  // 0-100%
  timestamp: number;
}

// Presenceでの状態管理
interface UserPresence {
  userId: string;
  status: 'playing' | 'finished' | 'disconnected';
  lastSeen: number;
}
```

### 負荷軽減のための工夫
1. **デバウンス**: キーストロークを100ms間隔で送信
2. **差分更新**: 進捗の変化時のみ送信
3. **Channel分離**: ゲーム部屋ごとに独立したチャンネル

## 結論 📋

### 🟢 適性: 十分に可能
- 100人規模なら技術的に実現可能
- 適切な設計により高いユーザー体験を提供

### 🟡 条件付き推奨
- メッセージ配信保証なしを前提とした設計
- 重要データの永続化は必須
- 適切な負荷分散とスロットリング

### 🔴 注意点
- 急激なスケール（300人超）では再検討必要
- メッセージ量の継続的な監視が必要
- 代替手段（WebRTC、専用サーバー）の検討も視野に

## 次のステップ 🎯
1. プロトタイプでの負荷テスト実施
2. メッセージ量の実測値取得
3. 段階的スケーリング計画の策定

---

## 🎯 Broadcast vs Presence 比較分析

### 前提条件
- **イベント発生タイミング**: 単語入力完了 → 正誤判定完了後
- **想定頻度**: 平均1分間に5-10回の単語送信
- **データ特性**: 単語、得点、進捗状況の更新

### 📡 Broadcast の特性

**✅ 適している理由**:
1. **単発イベント向け**: 「単語送信完了」という瞬間的なイベントに最適
2. **軽量**: 一時的メッセージでDBを経由しない
3. **低遅延**: 直接的なメッセージ配信
4. **スケーラブル**: 100人規模でも負荷が少ない

**⚠️ 注意点**:
- メッセージ配信保証なし
- 新規参加者は過去の状態を受信できない

**推奨データ構造**:
```typescript
interface WordSubmissionEvent {
  userId: string;
  word: string;
  isCorrect: boolean;
  score: number;
  totalScore: number;
  comboCount: number;
  timestamp: number;
}
```

### 👥 Presence の特性

**✅ 適している理由**:
1. **状態同期**: 全プレイヤーの現在状態を自動同期
2. **新規参加者対応**: 途中参加でも現在状態を即座に取得
3. **自動cleanup**: 切断時の状態自動削除

**⚠️ 懸念点**:
- **計算集約的**: 100人の状態更新は重い処理
- **頻繁更新に不向き**: 1分間に5-10回の更新は負荷大
- **公式推奨**: 「控えめに使用」との記載

**データ構造例**:
```typescript
interface PlayerPresence {
  userId: string;
  totalScore: number;
  comboCount: number;
  status: 'playing' | 'finished';
  lastWordTime: number;
  rank: number;
}
```

## 🏆 推奨: **Broadcast中心の設計**

### 理由
1. **イベント特性にマッチ**: 単語送信は単発イベント
2. **頻度への適応**: 1分間5-10回程度なら問題なし
3. **パフォーマンス**: Presenceより軽量
4. **拡張性**: 将来的な機能追加に柔軟

### 補完的なPresence活用
```typescript
// 軽量なPresence（更新頻度を抑制）
interface MinimalPresence {
  userId: string;
  status: 'active' | 'inactive';
  lastSeen: number;
  // スコアなど頻繁に変わるデータは含めない
}
```

## 🎮 実装戦略

### 1. メインフロー（Broadcast）
```
単語送信 → 正誤判定 → Broadcast配信 → 全員に即座反映
```

### 2. 状態管理（DB + 軽量Presence）
```
- 重要データ: PostgreSQL永続化
- 接続状態: 軽量Presence
- リアルタイム同期: Broadcast
```

### 3. 負荷分散
```typescript
// デバウンス例
const debouncedBroadcast = debounce((data) => {
  channel.send({
    type: 'broadcast',
    event: 'word_submitted',
    payload: data
  })
}, 50) // 50ms間隔制限
```

## 📊 予想メッセージ量
- **100人 × 8単語/分 × 60分**: 48,000メッセージ/時間
- **月間換算**: 約100万メッセージ（Free Planの半分程度）
- **判定**: 十分に許容範囲内 ✅
