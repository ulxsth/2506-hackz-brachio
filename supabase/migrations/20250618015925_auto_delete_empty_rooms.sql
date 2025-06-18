-- 【🤔】空になったルームを自動削除するトリガー

-- トリガー関数: ルームの参加者数をチェックして0になったら削除
CREATE OR REPLACE FUNCTION delete_empty_room()
RETURNS TRIGGER AS $$
BEGIN
  -- DELETE操作の場合のみ実行
  IF TG_OP = 'DELETE' THEN
    -- 削除されたプレイヤーのroom_idで残りの参加者数をチェック
    IF NOT EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_id = OLD.room_id
    ) THEN
      -- 参加者が0人になったらルームを削除
      DELETE FROM rooms WHERE id = OLD.room_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成: room_playersでDELETEが発生した際に実行
CREATE TRIGGER trigger_delete_empty_room
  AFTER DELETE ON room_players
  FOR EACH ROW
  EXECUTE FUNCTION delete_empty_room();

-- コメント追加
COMMENT ON FUNCTION delete_empty_room() IS 'ルームの参加者が0人になった際に自動でルームを削除する関数';
COMMENT ON TRIGGER trigger_delete_empty_room ON room_players IS 'プレイヤーが退出してルームが空になった際にルームを自動削除するトリガー';
