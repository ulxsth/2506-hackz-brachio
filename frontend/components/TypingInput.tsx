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
  className?: string;
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
  className = '',
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

  // スタイル計算
  const inputStyles = `
    w-full px-4 py-3 text-lg border-2 rounded-lg transition-all duration-200
    ${isValid ? 'border-green-500 bg-green-50' : 
      isPartialMatch ? 'border-blue-500 bg-blue-50' : 
      'border-gray-300 bg-white'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-blue-500'}
    ${className}
  `;

  return (
    <div className="relative w-full">
      {/* メイン入力フィールド */}
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={inputStyles}
          autoComplete="off"
          spellCheck={false}
          {...props}
        />
        
        {/* 検証ステータスインジケーター */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValid && (
            <span className="text-green-500">✓</span>
          )}
          {isPartialMatch && !isValid && (
            <span className="text-blue-500">📝</span>
          )}
        </div>
      </div>

      {/* ひらがなプレビュー */}
      {showPreview && hiraganaPreview && (
        <div className="mt-1 px-2 py-1 text-sm text-gray-600 bg-gray-100 rounded">
          <span className="font-mono">"{hiraganaPreview}"</span>
          {isValid && (
            <span className="ml-2 text-green-600 font-semibold">✓ 有効</span>
          )}
        </div>
      )}

      {/* 候補表示 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-gray-500 border-b">
            候補 ({suggestions.length}件) - Tab/↑↓で選択
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors
                ${index === selectedSuggestion ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
              `}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{suggestion}</span>
                <span className="text-xs text-gray-400">IT用語</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 制約情報表示 */}
      {constraintChar && constraintTerms.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            <strong>制約:</strong> 「{constraintChar}」を含む用語 ({constraintTerms.length}件対象)
          </div>
        </div>
      )}

      {/* デバッグ情報（開発用） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <div>辞書: {stats.totalTerms}件 | ひらがな: {stats.hiraganaVariations}種 | ゆらぎ: {stats.supportedVariations}パターン</div>
        </div>
      )}
    </div>
  );
});

TypingInput.displayName = 'TypingInput';
