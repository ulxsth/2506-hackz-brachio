# ゲーム画面での単語説明表示機能の計画

## 📋 概要
- **日時**: 2025/06/22
- **目的**: 正解したIT用語の説明（description）をゲーム画面に表示し、学習効果を向上させる
- **対象**: `frontend/app/game/page.tsx`、関連コンポーネント

## 🎯 要件

### 1. 表示タイミング
- ✅ **正解時**: 単語を正しく入力した直後
- ⏳ **表示時間**: 3-5秒間表示後、自動で非表示
- 🎮 **ゲーム継続**: 説明表示中も次のターンに進行可能

### 2. 表示内容
- 📝 **単語名**: 正解したIT用語
- 📖 **説明文**: database.description フィールドの内容
- 🏆 **得点情報**: 獲得ポイント、コンボ数
- ⭐ **難易度**: 単語の難易度レベル

### 3. 表示内容（機能のみ）
- 📝 **単語名**: 正解したIT用語
- 📖 **説明文**: database.description フィールドの内容
- 🏆 **得点情報**: 獲得ポイント、コンボ数
- ⭐ **難易度**: 単語の難易度レベル（数値）

### 4. 表示制御（機能のみ）
- 🔄 **自動消去**: 3-5秒後に自動で非表示
- ❌ **手動閉じる**: ユーザーが手動で閉じるボタン
- ⏭️ **次ターン**: 説明表示中でも入力・ターン進行は可能
- � **テキスト表示**: 最小限のHTML構造のみ

## 🏗️ 実装計画

### Phase 1: データ構造とState管理
```typescript
// 説明表示用のState
interface WordExplanation {
  word: string;
  description: string;
  difficulty: number;
  score: number;
  combo: number;
  isVisible: boolean;
}

const [explanation, setExplanation] = useState<WordExplanation | null>(null);
```

### Phase 2: 表示ロジック実装
- `handleInputSubmit` での正解時処理に説明表示を追加
- 自動消去タイマーの実装
- 手動閉じる機能の実装

### Phase 3: UIコンポーネント作成（機能のみ）
```typescript
// 新しいコンポーネント
interface WordExplanationModalProps {
  explanation: WordExplanation | null;
  onClose: () => void;
}

export const WordExplanationModal: React.FC<WordExplanationModalProps> = ({ ... }) => {
  // 最小限のHTML構造のみ（スタイルなし）
};
```

### Phase 4: 統合・テスト
- ゲーム画面への統合
- 機能テスト（表示・自動消去・手動閉じる）

## 📂 変更対象ファイル

### 1. メインゲーム画面
- `frontend/app/game/page.tsx`
  - State追加
  - 正解時の説明表示処理
  - 自動消去タイマー

### 2. 新規コンポーネント
- `frontend/components/WordExplanationModal.tsx`
  - 説明表示用コンポーネント（スタイルなし）
  - 難易度表示機能（数値のみ）
  - 閉じるボタン

### 3. 型定義（必要に応じて）
- `frontend/types/game.ts`
  - WordExplanation インターフェース
  - 関連型定義

## 🔧 技術仕様

### データ取得
- 既存の `itTerms` state から description を取得
- `matchedTerm.description` の活用
- 日本語・英語説明の両方表示

### タイマー制御
```typescript
useEffect(() => {
  if (explanation?.isVisible) {
    const timer = setTimeout(() => {
      setExplanation(null);
    }, 5000); // 5秒後に自動消去
    
    return () => clearTimeout(timer);
  }
}, [explanation]);
```

### アクセシビリティ
- キーボードナビゲーション対応
- Escキーで閉じる機能
- スクリーンリーダー対応

## 🎮 ゲームフロー統合

1. **単語入力** → 検証
2. **正解判定** → ポイント計算
3. **説明表示** → WordExplanationModal表示開始
4. **次ターン生成** → 並行してターン進行
5. **自動消去** → 5秒後または手動で説明非表示

## 📊 期待効果

### 学習効果
- 🧠 **知識習得**: IT用語の正確な理解
- 🔗 **関連知識**: 英語説明による国際的な理解
- 📈 **記憶定着**: 視覚的説明による記憶強化

### ゲーム体験
- 🎯 **達成感**: 正解時の満足感向上
- 📚 **教育性**: エンターテイメント + 学習
- 🔄 **継続性**: 知識欲による継続プレイ

## ⚠️ 注意事項

### パフォーマンス
- 説明表示がゲーム進行を妨げないよう配慮
- 長い説明文の場合のスクロール対応
- メモリリーク防止（タイマーのクリーンアップ）

### UX考慮
- 説明が邪魔にならない配置
- 素早いプレイヤーへの配慮
- 説明をスキップしたいユーザーへの配慮
- 最小限のHTML構造で軽量実装

## 🚀 実装順序

1. **Phase 1**: データ構造とState管理 (30分)
2. **Phase 2**: 表示ロジック実装 (1時間)  
3. **Phase 3**: UIコンポーネント作成（機能のみ） (30分-1時間)
4. **Phase 4**: 統合・テスト (30分)

**総推定時間**: 2.5-3.5時間
