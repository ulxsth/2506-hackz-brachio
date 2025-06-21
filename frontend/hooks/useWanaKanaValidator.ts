/**
 * WanaKana検証システム用React Hook
 */

import { useState, useEffect, useCallback } from 'react';
import { WanaKanaValidator, type ValidationResult, type ITTermData } from '@/lib/wanakana-validator';

export interface UseWanaKanaValidatorProps {
  itTerms: ITTermData[];
  targetWord?: string;
  constraintChar?: string;
}

export interface UseWanaKanaValidatorReturn {
  validator: WanaKanaValidator;
  validateInput: (input: string) => ValidationResult;
  currentValidation: ValidationResult | null;
  suggestions: string[];
  hiraganaPreview: string;
  isValid: boolean;
  isPartialMatch: boolean;
  constraintTerms: ITTermData[];
  stats: {
    totalTerms: number;
    hiraganaVariations: number;
    supportedVariations: number;
  };
}

/**
 * WanaKana検証システムを使用するためのReact Hook
 */
export function useWanaKanaValidator({
  itTerms,
  targetWord,
  constraintChar
}: UseWanaKanaValidatorProps): UseWanaKanaValidatorReturn {
  const [validator] = useState(() => new WanaKanaValidator(itTerms));
  const [currentValidation, setCurrentValidation] = useState<ValidationResult | null>(null);
  const [constraintTerms, setConstraintTerms] = useState<ITTermData[]>([]);

  // IT用語辞書の更新
  useEffect(() => {
    console.log('🔍 WanaKanaValidator用語更新:', {
      itTermsLength: itTerms.length,
      itTermsFirst3: itTerms.slice(0, 3).map(t => t.display_text),
      validator: !!validator
    });
    validator.updateTerms(itTerms);
  }, [validator, itTerms]);

  // 制約文字が変更された際の制約対象用語更新
  useEffect(() => {
    if (constraintChar) {
      const terms = validator.findTermsWithConstraint(constraintChar);
      setConstraintTerms(terms);
      console.log(`🎯 制約「${constraintChar}」対象用語: ${terms.length}件`);
    } else {
      setConstraintTerms([]);
    }
  }, [validator, constraintChar]);

  // 入力検証関数
  const validateInput = useCallback((input: string): ValidationResult => {
    const result = validator.validateInput(input, targetWord);
    setCurrentValidation(result);
    return result;
  }, [validator, targetWord]);

  // 統計情報の取得
  const stats = validator.getStats();

  return {
    validator,
    validateInput,
    currentValidation,
    suggestions: currentValidation?.suggestions || [],
    hiraganaPreview: currentValidation?.hiraganaPreview || '',
    isValid: currentValidation?.isValid || false,
    isPartialMatch: currentValidation?.partialMatch || false,
    constraintTerms,
    stats
  };
}
