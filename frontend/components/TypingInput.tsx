/**
 * WanaKanaベースリアルタイムタイピング入力コンポーネント
 */

'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { useWanaKanaValidator, type UseWanaKanaValidatorProps } from '@/hooks/useWanaKanaValidator';

interface TypingInputProps extends UseWanaKanaValidatorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onFocus?: () => void;
  placeholder?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showSuggestions?: boolean;
}

/**
 * WanaKanaリアルタイムタイピング入力フィールド
 */
export const TypingInput = forwardRef<HTMLInputElement, TypingInputProps>(({
  value,
  onChange,
  onSubmit,
  onFocus,
  placeholder = 'ローマ字で入力...',
  disabled = false,
  showPreview = true,
  showSuggestions = true,
  itTerms,
  targetWord,
  constraintChar,
  ...props
}, ref) => {
  const {
    validateInput,
    hiraganaPreview,
    isValid,
    isPartialMatch,
    suggestions,
    constraintTerms,
    stats
  } = useWanaKanaValidator({
    itTerms,
    targetWord,
    constraintChar
  });

  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  // リアルタイム検証
  useEffect(() => {
    validateInput(value);
  }, [value, validateInput]);

  // 入力変更ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedSuggestion(-1);
  };

  // キーボードイベント
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(value);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Tab':
        if (selectedSuggestion >= 0) {
          e.preventDefault();
          onChange(suggestions[selectedSuggestion]);
        }
        break;
      case 'Escape':
        setSelectedSuggestion(-1);
        break;
    }
  };

  // 候補選択
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSelectedSuggestion(-1);
  };

  return (
    <div>
      {/* メイン入力フィールド */}
      <div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          {...props}
        />
        
        {/* 検証ステータスインジケーター */}
        <div>
          {isValid && (
            <span>✓</span>
          )}
          {isPartialMatch && !isValid && (
            <span>📝</span>
          )}
        </div>
      </div>

      {/* ひらがなプレビュー */}
      {showPreview && hiraganaPreview && (
        <div>
          <span>"{hiraganaPreview}"</span>
          {isValid && (
            <span>✓ 有効</span>
          )}
        </div>
      )}

      {/* 候補表示 */}
      {showSuggestions && suggestions.length > 0 && (
        <div>
          <div>
            候補 ({suggestions.length}件) - Tab/↑↓で選択
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div>
                <span>{suggestion}</span>
                <span>IT用語</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 制約情報表示 */}
      {constraintChar && constraintTerms.length > 0 && (
        <div>
          <div>
            <strong>制約:</strong> 「{constraintChar}」を含む用語 ({constraintTerms.length}件対象)
          </div>
        </div>
      )}

      {/* デバッグ情報（開発用） */}
      {process.env.NODE_ENV === 'development' && (
        <div>
          <div>辞書: {stats.totalTerms}件 | ひらがな: {stats.hiraganaVariations}種 | ゆらぎ: {stats.supportedVariations}パターン</div>
        </div>
      )}
    </div>
  );
});

TypingInput.displayName = 'TypingInput';
