# 単語の意味解釈・説明文生成モジュール調査レポート 📚🤖

## 📊 調査結果サマリー

| 方法 | 実装難易度 | コスト | 精度 | 日本語対応 | 推奨度 |
|------|-----------|-------|-------|------------|--------|
| **Wikipedia API** | ⭐ 簡単 | $0 | ⭐⭐⭐⭐ | ✅ | 🥇 **最推奨** |
| **WordNet + wordpos** | ⭐⭐ 中級 | $0 | ⭐⭐⭐⭐⭐ | ❌ 英語のみ | 🥈 英語用 |
| **OpenAI API** | ⭐⭐ 中級 | $高 | ⭐⭐⭐⭐⭐ | ✅ | 🥉 高精度 |
| **Gemini API** | ⭐⭐ 中級 | $中 | ⭐⭐⭐⭐⭐ | ✅ | 🥉 高精度 |
| **kuroshiro + 辞書** | ⭐⭐⭐ 高級 | $0 | ⭐⭐⭐ | ✅ | 🔺 専用 |

## 🔍 詳細分析

### 1. Wikipedia API（推奨） 📖

#### 特徴
- ✅ **完全無料**
- ✅ **日本語対応**
- ✅ **豊富な情報**
- ✅ **API安定性**
- ✅ **即座実装可能**

#### 実装例

```typescript
// lib/wikipedia-explainer.ts
import wiki from 'wikipedia';

interface WordExplanation {
  word: string;
  summary: string;
  description: string;
  url: string;
  image?: string;
  isFound: boolean;
}

export class WikipediaExplainer {
  constructor() {
    // 日本語設定
    wiki.setLang('ja');
  }

  async explainWord(word: string): Promise<WordExplanation> {
    try {
      // 検索して最適なページを見つける
      const searchResults = await wiki.search(word, { limit: 1 });
      
      if (searchResults.results.length === 0) {
        return this.createNotFoundResult(word);
      }

      // ページの詳細情報を取得
      const page = await wiki.page(searchResults.results[0].title);
      const summary = await page.summary();
      
      // 一文の説明文を作成（最初の文を抽出）
      const description = this.extractFirstSentence(summary.extract);
      
      return {
        word,
        summary: summary.extract,
        description,
        url: summary.content_urls.desktop.page,
        image: summary.thumbnail?.source,
        isFound: true
      };
    } catch (error) {
      console.error('Wikipedia API error:', error);
      return this.createNotFoundResult(word);
    }
  }

  private extractFirstSentence(text: string): string {
    // 日本語の文区切りを考慮した一文抽出
    const sentences = text.split(/[。！？]/);
    return sentences[0] + (sentences.length > 1 ? '。' : '');
  }

  private createNotFoundResult(word: string): WordExplanation {
    return {
      word,
      summary: '',
      description: `「${word}」の説明が見つかりませんでした。`,
      url: '',
      isFound: false
    };
  }

  // バッチ処理でパフォーマンス向上
  async explainWords(words: string[]): Promise<WordExplanation[]> {
    const explanations = await Promise.allSettled(
      words.map(word => this.explainWord(word))
    );

    return explanations.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return this.createNotFoundResult(words[index]);
      }
    });
  }

  // IT用語専用の検索
  async explainITTerm(word: string): Promise<WordExplanation> {
    try {
      // IT関連のキーワードを追加して検索精度向上
      const searchTerms = [
        word,
        `${word} プログラミング`,
        `${word} コンピュータ`,
        `${word} IT用語`
      ];

      for (const term of searchTerms) {
        const searchResults = await wiki.search(term, { limit: 3 });
        
        // IT関連のページを優先的に選択
        const itRelatedPage = searchResults.results.find(result => 
          result.title.includes('プログラミング') ||
          result.title.includes('コンピュータ') ||
          result.title.includes('ソフトウェア') ||
          result.title.includes('データベース') ||
          result.snippet.includes('プログラミング') ||
          result.snippet.includes('コンピュータ')
        );

        if (itRelatedPage) {
          const page = await wiki.page(itRelatedPage.title);
          const summary = await page.summary();
          
          return {
            word,
            summary: summary.extract,
            description: this.extractFirstSentence(summary.extract),
            url: summary.content_urls.desktop.page,
            image: summary.thumbnail?.source,
            isFound: true
          };
        }
      }

      return this.createNotFoundResult(word);
    } catch (error) {
      console.error('IT term search error:', error);
      return this.createNotFoundResult(word);
    }
  }
}
```

### 2. WordNet + wordpos（英語専用） 🔤

#### 実装例

```typescript
// lib/wordnet-explainer.ts
import WordPOS from 'wordpos';

interface WordNetExplanation {
  word: string;
  definitions: string[];
  description: string;
  partOfSpeech: string[];
  synonyms: string[];
  isFound: boolean;
}

export class WordNetExplainer {
  private wordpos: WordPOS;

  constructor() {
    this.wordpos = new WordPOS();
  }

  async explainWord(word: string): Promise<WordNetExplanation> {
    try {
      // 品詞判定
      const pos = await this.wordpos.getPOS(word);
      
      // 定義の取得
      const definitions: string[] = [];
      
      if (pos.nouns.length > 0) {
        const nounDefs = await this.wordpos.lookupNoun(word);
        definitions.push(...nounDefs.map(def => def.gloss));
      }
      
      if (pos.verbs.length > 0) {
        const verbDefs = await this.wordpos.lookupVerb(word);
        definitions.push(...verbDefs.map(def => def.gloss));
      }
      
      if (pos.adjectives.length > 0) {
        const adjDefs = await this.wordpos.lookupAdjective(word);
        definitions.push(...adjDefs.map(def => def.gloss));
      }

      if (definitions.length === 0) {
        return this.createNotFoundResult(word);
      }

      // 最も適切な定義を選択（最初の定義）
      const description = this.cleanDefinition(definitions[0]);
      
      return {
        word,
        definitions,
        description,
        partOfSpeech: Object.keys(pos).filter(key => pos[key].length > 0),
        synonyms: [], // 必要に応じて同義語も取得可能
        isFound: true
      };
    } catch (error) {
      console.error('WordNet error:', error);
      return this.createNotFoundResult(word);
    }
  }

  private cleanDefinition(definition: string): string {
    // 定義文のクリーンアップ（引用符、例文の削除など）
    return definition.split(';')[0].replace(/[\"\']/g, '').trim() + '。';
  }

  private createNotFoundResult(word: string): WordNetExplanation {
    return {
      word,
      definitions: [],
      description: `Definition for "${word}" not found.`,
      partOfSpeech: [],
      synonyms: [],
      isFound: false
    };
  }
}
```

### 3. AI API（OpenAI/Gemini）🤖

#### 実装例

```typescript
// lib/ai-explainer.ts
import OpenAI from 'openai';

interface AIExplanation {
  word: string;
  description: string;
  detailed: string;
  difficulty: number;
  category: string;
  examples: string[];
  relatedTerms: string[];
  isFound: boolean;
}

export class AIExplainer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async explainWord(word: string): Promise<AIExplanation> {
    try {
      const prompt = `
以下のIT用語について、一文の簡潔な説明文を作成してください：

用語: "${word}"

以下のJSON形式で回答してください：
{
  "word": "${word}",
  "description": "一文での簡潔な説明",
  "detailed": "詳細な説明（2-3文）",
  "difficulty": 1-10の数値,
  "category": "プログラミング|データベース|ネットワーク|セキュリティ|その他",
  "examples": ["使用例1", "使用例2"],
  "relatedTerms": ["関連用語1", "関連用語2"],
  "isFound": true/false
}

条件:
- description は1文で、わかりやすく
- difficulty は初心者向け=1、専門家向け=10
- examples は実際の使用場面
- IT用語でない場合は isFound: false
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const response = completion.choices[0].message.content;
      const jsonMatch = response?.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('AI explanation error:', error);
      return {
        word,
        description: `「${word}」の説明を生成できませんでした。`,
        detailed: '',
        difficulty: 1,
        category: 'その他',
        examples: [],
        relatedTerms: [],
        isFound: false
      };
    }
  }

  // コスト最適化のためのバッチ処理
  async explainWords(words: string[]): Promise<AIExplanation[]> {
    try {
      const batchPrompt = `
以下のIT用語群について、それぞれ一文の簡潔な説明文を作成してください：

用語群: ${words.map(w => `"${w}"`).join(', ')}

以下のJSON配列形式で回答してください：
[
  {
    "word": "用語1",
    "description": "一文での簡潔な説明",
    "detailed": "詳細な説明（2-3文）",
    "difficulty": 1-10の数値,
    "category": "プログラミング|データベース|ネットワーク|セキュリティ|その他",
    "examples": ["使用例1", "使用例2"],
    "relatedTerms": ["関連用語1", "関連用語2"],
    "isFound": true/false
  },
  // 以下同様...
]
`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: batchPrompt }],
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0].message.content;
      const jsonMatch = response?.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid JSON response');
    } catch (error) {
      console.error('AI batch explanation error:', error);
      return words.map(word => ({
        word,
        description: `「${word}」の説明を生成できませんでした。`,
        detailed: '',
        difficulty: 1,
        category: 'その他',
        examples: [],
        relatedTerms: [],
        isFound: false
      }));
    }
  }
}
```

### 4. ハイブリッド戦略（推奨実装）🌟

```typescript
// lib/hybrid-explainer.ts
export class HybridExplainer {
  private wikipediaExplainer: WikipediaExplainer;
  private wordnetExplainer: WordNetExplainer;
  private aiExplainer?: AIExplainer;
  private cache: Map<string, any>;

  constructor(aiApiKey?: string) {
    this.wikipediaExplainer = new WikipediaExplainer();
    this.wordnetExplainer = new WordNetExplainer();
    if (aiApiKey) {
      this.aiExplainer = new AIExplainer(aiApiKey);
    }
    this.cache = new Map();
  }

  async explainWord(word: string, mode: 'fast' | 'accurate' | 'comprehensive' = 'fast') {
    // キャッシュチェック
    const cacheKey = `${word}:${mode}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result;

    switch (mode) {
      case 'fast':
        // Wikipedia優先（無料・高速）
        result = await this.wikipediaExplainer.explainITTerm(word);
        if (!result.isFound) {
          // 英語の場合はWordNetでフォールバック
          const wordnetResult = await this.wordnetExplainer.explainWord(word);
          if (wordnetResult.isFound) {
            result = {
              word,
              summary: wordnetResult.definitions.join(' '),
              description: wordnetResult.description,
              url: '',
              isFound: true
            };
          }
        }
        break;

      case 'accurate':
        // AI使用（高精度だがコスト高）
        if (this.aiExplainer) {
          result = await this.aiExplainer.explainWord(word);
        } else {
          result = await this.wikipediaExplainer.explainITTerm(word);
        }
        break;

      case 'comprehensive':
        // 複数ソースを組み合わせ
        const [wikiResult, aiResult] = await Promise.allSettled([
          this.wikipediaExplainer.explainITTerm(word),
          this.aiExplainer?.explainWord(word)
        ]);

        // 最も情報豊富な結果を選択
        result = this.selectBestResult(wikiResult, aiResult);
        break;
    }

    // キャッシュに保存
    this.cache.set(cacheKey, result);
    return result;
  }

  private selectBestResult(wikiResult: any, aiResult: any) {
    // 結果の品質を評価して最適なものを選択
    // 実装省略...
  }
}
```

## 💰 コスト比較

### 月間使用量想定
- 単語数: 10,000語/月
- 説明生成頻度: 各単語1回

| 方法 | 月間コスト | 応答速度 | 備考 |
|------|-----------|----------|------|
| Wikipedia API | **$0** | 500ms | 完全無料 |
| WordNet | **$0** | 100ms | 英語のみ |
| OpenAI GPT-4o-mini | **$1.50** | 1000ms | 高精度 |
| Gemini 2.0 Flash | **$0.40** | 800ms | コスパ良 |

## 🎯 実装推奨

### Phase 1: 基本実装（Wikipedia）
```bash
cd frontend
npm install wikipedia
```

### Phase 2: 英語対応（WordNet）
```bash
npm install wordpos wordnet-db
```

### Phase 3: 高精度（AI）
```bash
npm install openai
# または
npm install @google/generative-ai
```

## 🚀 即座実装案

### 最小限の実装

```typescript
// utils/word-explainer.ts
import wiki from 'wikipedia';

export const explainWord = async (word: string): Promise<string> => {
  try {
    wiki.setLang('ja');
    const page = await wiki.page(word);
    const summary = await page.summary();
    
    // 最初の文を抽出
    const sentences = summary.extract.split('。');
    return sentences[0] + '。';
  } catch (error) {
    return `「${word}」の説明が見つかりませんでした。`;
  }
};
```

### ゲームでの活用

```typescript
// hooks/useWordExplainer.ts
import { useState, useCallback } from 'react';
import { explainWord } from '../utils/word-explainer';

export const useWordExplainer = () => {
  const [explanations, setExplanations] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const getExplanation = useCallback(async (word: string) => {
    if (explanations.has(word)) {
      return explanations.get(word);
    }

    setIsLoading(true);
    try {
      const explanation = await explainWord(word);
      setExplanations(prev => new Map(prev).set(word, explanation));
      return explanation;
    } catch (error) {
      console.error('Explanation error:', error);
      return `「${word}」の説明を取得できませんでした。`;
    } finally {
      setIsLoading(false);
    }
  }, [explanations]);

  return {
    getExplanation,
    explanations,
    isLoading
  };
};
```

## 📝 結論

**Wikipedia API が最適解です！**

### 理由：
- ✅ **完全無料**
- ✅ **日本語完全対応**
- ✅ **豊富な情報量**
- ✅ **即座実装可能**
- ✅ **安定したAPI**

### 次のステップ：
1. **「実装」** - Wikipedia APIを使った基本的な説明文生成機能
2. **「拡張」** - キャッシュ機能・UI統合
3. **「最適化」** - パフォーマンス・エラーハンドリング改善

まずはWikipedia APIで基本機能を実装し、必要に応じてAI機能を追加する段階的アプローチが最適です！ 🎯✨
