# リアルタイムランキング不具合調査レポート

## 📅 日時
2025-01-23 (JST)

## 🎯 調査対象
デュアルターンタイピングゲームにて、他のユーザーのスコアがリアルタイムで更新されない問題

## 🔍 調査結果

### 現在の状況
- ✅ ローカルユーザーのスコアは正常にリアルタイム更新される
- ❌ 他のユーザーのスコア変更が他のクライアントに反映されない
- ✅ データベースのスコア更新自体は正常に動作している

### 根本原因特定

#### 1. Supabaseリアルタイム購読設定の不備
**ファイル**: `/frontend/lib/room.ts` の `setupRealtimeChannel`関数

**現在の購読イベント**:
```typescript
// ✅ 設定済み
- プレイヤー参加 (room_players INSERT)
- プレイヤー退出 (room_players DELETE)  
- ルーム状態変更 (rooms UPDATE)

// ❌ 欠落
- プレイヤースコア更新 (room_players UPDATE)
```

#### 2. データフロー確認
```
1. ユーザーが単語入力 → GamePageMVP
2. updatePlayerScore実行 → Supabase DB更新 ✅
3. Supabase Realtimeがイベント発火 → room_players UPDATE
4. 他のクライアントが変更を受信 → ❌ 購読されていない
5. playersAtom更新 → ❌ 発生しない
6. ランキング再計算 → ❌ 古いデータのまま
```

### 実装状況確認

#### updatePlayerScore関数 ✅
- 正常にDB更新を実行
- エラーハンドリング適切
- ログ出力も正常

#### useRoomフック ✅  
- players atom管理は正常
- realtimeChannel設定は正常
- onPlayerJoin/onPlayerLeave設定済み

#### GamePageMVP ✅
- useMemoでリアルタイムランキング計算
- 実際のプレイヤーデータを使用（モックデータ削除済み）

## 🛠️ 解決方法

`setupRealtimeChannel`関数に以下を追加：

```typescript
// プレイヤー更新イベント（スコア変更等）
channel.on('postgres_changes',
  {
    event: 'UPDATE',
    schema: 'public', 
    table: 'room_players',
    filter: `room_id=eq.${roomId}`
  },
  (payload) => {
    debugLog('📊 realtime: プレイヤー更新イベント受信', payload.new)
    onPlayerUpdate(payload.new as RoomPlayer)
  }
)
```

同時に、useRoomフックでプレイヤー更新ハンドラーを追加する必要あり。

## ⚡ 緊急度
**高** - リアルタイムマルチプレイヤーゲームの核心機能

## 📊 影響範囲
- ゲーム中のリーダーボード表示
- プレイヤー間の競争感
- ユーザー体験全般

## 🔄 次のアクション
1. setupRealtimeChannelにプレイヤー更新イベント追加
2. useRoomフックにonPlayerUpdateハンドラー追加  
3. 動作テスト（複数ブラウザでの確認）
4. コミット・デプロイ
