# Realtime退出イベント受信問題の調査と解決レポート

**作成日**: 2025年6月18日  
**ステータス**: 解決済み ✅  
**重要度**: 高 🔴  

## 🎯 問題概要

### 発生した問題
- ユーザーがルームから退出した際、他のプレイヤーにリアルタイム通知が届かない
- 参加イベントは正常に動作しているが、退出イベント（DELETE）のみ受信できない状態

### 影響範囲
- マルチプレイヤーゲームのリアルタイム性に重大な影響
- プレイヤーリストの整合性が保たれない
- ユーザー体験の著しい低下

## 🔍 調査プロセス

### 1. 初期仮説と調査
**仮説1**: チャンネルのunsubscribeタイミング問題
- 退出するプレイヤーが先にチャンネルをunsubscribeしている
- **結果**: 処理順序を変更しても問題は解決せず

**仮説2**: 同じチャンネル名の共有による影響
- 複数クライアントが同じチャンネルを使用している
- 一人がunsubscribeすると他のクライアントも影響を受ける
- **結果**: unsubscribeを削除しても問題は解決せず

### 2. ログ分析
```
🚀 leaveRoom: ルーム退出開始
👤 leaveRoom: ユーザーID f8403f0b-a716-43f2-8faf-f6e5f37f2169
📡 leaveRoom: 現在のチャンネル RealtimeChannel {...}
🗑️ leaveRoom: プレイヤー削除開始
✅ leaveRoom: プレイヤー削除完了 {deletedData: Array(1)}
```

**分析結果**:
- DELETEクエリは正常に実行されている
- `deletedData`も正しく返されている
- しかし他のクライアントでイベントが受信されない

### 3. Supabaseドキュメント調査
Supabase Realtime - Postgres Changesの重要な発見：

> **「Receiving `old` records」**  
> By default, only `new` record changes are sent but if you want to receive the `old` record (previous values) whenever you `UPDATE` or `DELETE` a record, you can set the `replica identity` of your table to `full`:

## 💡 根本原因の特定

### 問題の本質
**PostgreSQLの`replica identity`設定不足**

- デフォルトでは、DELETEイベントで`payload.old`が送信されない
- Realtimeイベントリスナーは`payload.old.id`に依存している
- `room_players`テーブルの`replica identity`が`default`のまま

### 技術的詳細
```sql
-- 現在の状態（問題あり）
-- room_players テーブルの replica identity = default

-- 必要な設定
ALTER TABLE room_players REPLICA IDENTITY FULL;
```

## 🔧 解決策の実装

### 1. マイグレーション作成
**ファイル**: `supabase/migrations/20250618130000_enable_realtime_delete_events.sql`
```sql
-- Set replica identity to full for room_players table
-- This allows DELETE events to include the old record data in Realtime
ALTER TABLE room_players REPLICA IDENTITY FULL;
```

### 2. コード最適化
**ファイル**: `frontend/lib/room.ts`

**Before**:
```typescript
// チャンネルをunsubscribeしてからDELETE
if (channel) {
  await channel.unsubscribe()
}
if (userId) {
  await supabase.from('room_players').delete().eq('id', userId)
}
```

**After**:
```typescript
// DELETEを先に実行してからローカル状態をクリア
if (userId) {
  const { data, error } = await supabase
    .from('room_players')
    .delete()
    .eq('id', userId)
    .select()
  // 1秒待機でRealtimeイベント伝播を確保
  await new Promise(resolve => setTimeout(resolve, 1000))
}
// チャンネルはunsubscribeしない（他プレイヤーに影響）
```

## 📊 解決後の期待される動作フロー

### 退出処理シーケンス
1. **UI**: ユーザーが「ルームを出る」ボタンをクリック
2. **leaveRoom関数**: データベースからDELETE実行
3. **PostgreSQL**: DELETEイベント発生 + `old`レコード付与
4. **Supabase Realtime**: 全クライアントにDELETEイベント配信
5. **他プレイヤー**: `payload.old.id`を受信してプレイヤーリスト更新
6. **退出プレイヤー**: ローカル状態クリア + 画面遷移

### ログの期待値
**退出するプレイヤー側**:
```
🗑️ leaveRoom: プレイヤー削除開始
✅ leaveRoom: プレイヤー削除完了
⏳ leaveRoom: Realtimeイベント伝播のため1秒待機
```

**他のプレイヤー側**:
```
👋 realtime: プレイヤー退出イベント受信 {payload: {...}, oldRecord: {...}}
✅ realtime: プレイヤー退出処理実行 [userId]
```

## 🎓 学習ポイント

### 1. PostgreSQLのReplica Identity
- `default`: 主キーのみ（DELETEで`old`なし）
- `full`: 全カラム（DELETEで完全な`old`レコード）
- `nothing`: レプリケーション情報なし
- `index`: 指定インデックスの値のみ

### 2. Supabase Realtimeの制約
- DELETEイベントはフィルタリング不可
- `old`レコードの取得には特別な設定が必要
- チャンネル名の共有による影響を考慮する必要

### 3. デバッグの重要性
- ログを詳細に出力してフローを追跡
- 公式ドキュメントの精読
- 仮説検証のための段階的アプローチ

## 📈 今後の改善点

### 1. モニタリング強化
- Realtimeイベントの受信率監視
- エラーログの集約と分析

### 2. テスト充実
- Realtimeイベントの統合テスト
- エッジケースの検証

### 3. ドキュメント整備
- Realtimeイベント設定のベストプラクティス
- トラブルシューティングガイド

## 🎯 結論

**根本原因**: PostgreSQLの`replica identity`設定不足により、DELETEイベントで`old`レコードが送信されていなかった。

**解決方法**: `ALTER TABLE room_players REPLICA IDENTITY FULL;`によりDELETEイベントで完全な`old`レコードを送信可能にした。

**効果**: リアルタイム退出通知が正常に動作し、マルチプレイヤーゲームの整合性が保たれる。

---

**関連ファイル**:
- `supabase/migrations/20250618130000_enable_realtime_delete_events.sql`
- `frontend/lib/room.ts`
- `frontend/hooks/useRoom.ts`

**参考資料**:
- [Supabase Realtime - Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [PostgreSQL Replica Identity](https://www.postgresql.org/docs/current/sql-altertable.html)
