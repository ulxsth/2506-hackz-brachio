# タイマー終了時のゲーム終了処理不備修正計画 📋

## 問題の概要 🐛
- タイマー終了時に`forceEndGame`が呼ばれず、ルームの`status`が`finished`に更新されない
- 結果ページで`getGameResults`がルーム検索時に`status=finished`条件で絞り込むため、データが見つからない
- エラー: "JSON object requested, multiple (or no) rows returned" (PGRST116)

## 技術的詳細 🔍

### 現在の問題フロー
1. **タイマー終了時**（`timeLeft <= 0`）
   ```tsx
   if (timeLeft <= 0) {
     const roomId = currentRoom?.id || 'unknown';
     router.push(`/result?roomId=${roomId}`); 
     return;
   }
   ```

2. **結果ページで検索**
   ```typescript
   .eq('status', 'finished')  // ← statusがfinishedでないため0件
   ```

### 正常動作フロー（手動終了）
1. **手動ゲーム終了時**
   ```tsx
   const result = await forceEndGame();  // ← RPCでstatus更新
   if (result.success) {
     router.push(`/result?roomId=${roomId}`);
   }
   ```

2. **`forceEndGame`内でRPC呼び出し**
   ```typescript
   await supabase.rpc('end_game_session', { p_room_id: roomId })
   // ↑ ルームstatus='finished'に更新 + game_sessions終了
   ```

### 根本原因
- **タイマー終了時**: ゲーム終了処理なし → `status`更新なし → 結果取得失敗
- **手動終了時**: ゲーム終了処理あり → `status`更新あり → 結果取得成功

## 修正計画 ⚡

### 1. タイマー終了時のゲーム終了処理追加
**対象ファイル**: `/frontend/app/game/page.tsx`
**修正内容**:
```tsx
// 修正前
if (timeLeft <= 0) {
  const roomId = currentRoom?.id || 'unknown';
  router.push(`/result?roomId=${roomId}`);
  return;
}

// 修正後
if (timeLeft <= 0) {
  await handleTimerEndGame();
  return;
}
```

### 2. タイマー終了専用ハンドラー作成
**新規追加関数**:
```tsx
const handleTimerEndGame = async () => {
  try {
    if (!currentRoom?.id || !user?.id || !currentRoom?.host_id) {
      console.error('❌ タイマー終了: 必要な情報が不足');
      const roomId = currentRoom?.id || 'unknown';
      router.push(`/result?roomId=${roomId}`);
      return;
    }

    // ホストのみがゲーム終了処理を実行
    if (user.id === currentRoom.host_id) {
      const result = await forceEndGame({
        userId: user.id,
        roomId: currentRoom.id,
        hostId: currentRoom.host_id
      });
      
      if (!result.success) {
        console.error('❌ タイマー終了: ゲーム終了処理失敗');
      }
    }
    
    // 全プレイヤーが結果ページに遷移
    router.push(`/result?roomId=${currentRoom.id}`);
  } catch (error) {
    console.error('❌ タイマー終了エラー:', error);
    const roomId = currentRoom?.id || 'unknown';
    router.push(`/result?roomId=${roomId}`);
  }
};
```

### 3. 権限と同期の考慮
- **ホストのみ**: `forceEndGame` RPC実行（権限チェック済み）
- **全プレイヤー**: 結果ページ遷移
- **リアルタイム**: ルーム状態変更はSupabaseで全プレイヤーに配信

## 実装範囲 📝
- **必須**: タイマー終了時のゲーム終了処理追加
- **必須**: `handleTimerEndGame`関数の実装
- **検証**: タイマー終了→結果ページでの正常表示

## 非実装範囲 ❌
- `getGameResults`関数の変更（現状の設計が正しい）
- RPCやDBスキーマの変更
- 他の終了パターンの変更

## 期待される結果 ✅
- タイマー終了時もルーム`status`が`finished`に更新される
- 結果ページで正常にゲーム結果が表示される
- 手動終了とタイマー終了で一貫した動作を実現

## テスト方針 🧪
1. **タイマー終了テスト**: 時間切れでゲーム終了→結果ページ表示確認
2. **手動終了テスト**: 手動終了ボタン→結果ページ表示確認（既存機能の回帰テスト）
3. **マルチプレイヤーテスト**: 複数プレイヤーでタイマー終了時の同期確認
