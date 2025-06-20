#!/bin/bash
# scripts/rename_reports.sh
# docs/reports配下のタイムスタンプなしファイルをyyyymmddhhmm-title.md形式にリネーム

REPORTS_DIR="docs/reports"
BASE_TIMESTAMP="202501201500"  # 2025年01月20日15:00
COUNTER=0

echo "🔍 タイムスタンプなしファイルを検索中..."

# タイムスタンプなしファイルをリストアップ（確認用）
echo "📋 対象ファイル一覧:"
for file in "$REPORTS_DIR"/*.md; do
    filename=$(basename "$file")
    
    # タイムスタンプパターンをチェック（12桁数字で始まる、_または-区切り）
    if [[ ! $filename =~ ^[0-9]{12}[-_] ]]; then
        echo "  - $filename"
    fi
done

echo ""
read -p "上記のファイルをリネームしますか？ (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ キャンセルしました"
    exit 1
fi

echo "🚀 リネーム開始..."

for file in "$REPORTS_DIR"/*.md; do
    filename=$(basename "$file")
    
    # タイムスタンプパターンをチェック（12桁数字で始まる、_または-区切り）
    if [[ ! $filename =~ ^[0-9]{12}[-_] ]]; then
        # 5分間隔でタイムスタンプを生成（基準: 2025-01-20 15:00）
        base_minute=$((15 * 60))  # 15:00 = 900分
        offset_minute=$((base_minute + COUNTER * 5))
        hour=$((offset_minute / 60))
        minute=$((offset_minute % 60))
        timestamp=$(printf "20250120%02d%02d" $hour $minute)
        new_name="${timestamp}-${filename}"
        
        echo "📝 リネーム: $filename -> $new_name"
        mv "$file" "$REPORTS_DIR/$new_name"
        
        ((COUNTER++))
    fi
done

echo "✅ 完了！ $COUNTER ファイルをリネームしました"
echo "🔍 結果確認:"
ls -la "$REPORTS_DIR" | grep "^-.*\.md$" | tail -$COUNTER
