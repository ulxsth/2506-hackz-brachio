#!/usr/bin/env node

import { ProgrammingLanguageScraper } from './scraper.js';
import { OutputManager } from './output-manager.js';
import { ScraperOptions } from './types.js';

/**
 * コマンドライン引数を解析
 */
function parseCommandLineArgs(): {
  options: ScraperOptions;
  outputFormat: 'json' | 'csv' | 'both';
  isFullRun: boolean;
  isUpdate: boolean;
} {
  const args = process.argv.slice(2);
  
  const options: ScraperOptions = {
    maxConcurrency: 1,
    requestDelay: 1000,
    retryAttempts: 3,
    skipExisting: false
  };

  let outputFormat: 'json' | 'csv' | 'both' = 'both';
  let isFullRun = false;
  let isUpdate = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
        const format = args[i + 1];
        if (['json', 'csv', 'both'].includes(format)) {
          outputFormat = format as 'json' | 'csv' | 'both';
          i++; // 次の引数をスキップ
        }
        break;
        
      case '--limit':
        const limit = parseInt(args[i + 1]);
        if (!isNaN(limit) && limit > 0) {
          options.limit = limit;
          i++;
        }
        break;
        
      case '--delay':
        const delay = parseInt(args[i + 1]);
        if (!isNaN(delay) && delay >= 0) {
          options.requestDelay = delay;
          i++;
        }
        break;
        
      case '--retry':
        const retry = parseInt(args[i + 1]);
        if (!isNaN(retry) && retry >= 0) {
          options.retryAttempts = retry;
          i++;
        }
        break;
        
      case '--full':
        isFullRun = true;
        break;
        
      case '--update':
        isUpdate = true;
        options.skipExisting = true;
        break;
        
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return { options, outputFormat, isFullRun, isUpdate };
}

/**
 * ヘルプメッセージを表示
 */
function showHelp(): void {
  console.log(`
🚀 Programming Languages Scraper

使用方法:
  npm run scrape [オプション]

オプション:
  --output <format>    出力形式 (json, csv, both) [default: both]
  --limit <number>     取得する言語数の上限
  --delay <ms>         API呼び出し間隔 [default: 1000]
  --retry <number>     リトライ回数 [default: 3]
  --full               全言語を取得（制限なし）
  --update             既存データを更新（新規のみ取得）
  --help, -h           このヘルプを表示

例:
  npm run scrape                           # デフォルト設定で実行
  npm run scrape -- --limit 50            # 最初の50言語のみ取得
  npm run scrape -- --output json         # JSON形式のみで出力
  npm run scrape -- --full --delay 2000   # 全言語を2秒間隔で取得
  npm run scrape -- --update              # 増分更新
`);
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  console.log('🎯 Programming Languages Scraper v1.0.0');
  console.log('=' .repeat(50));

  try {
    // コマンドライン引数を解析
    const { options, outputFormat, isFullRun, isUpdate } = parseCommandLineArgs();

    // 設定情報を表示
    console.log('⚙️  設定情報:');
    console.log(`   出力形式: ${outputFormat}`);
    console.log(`   制限: ${options.limit || '制限なし'}`);
    console.log(`   API間隔: ${options.requestDelay}ms`);
    console.log(`   リトライ: ${options.retryAttempts}回`);
    console.log(`   モード: ${isUpdate ? '増分更新' : isFullRun ? '完全取得' : '通常'}`);
    console.log('');

    // 出力マネージャーを初期化
    const outputManager = new OutputManager();

    // 既存データの確認（更新モードの場合）
    if (isUpdate) {
      const existingData = await outputManager.loadExistingData();
      if (existingData) {
        console.log(`📂 既存データを発見: ${existingData.languages.length} 言語`);
        // バックアップを作成
        await outputManager.createBackup('programming-languages.json');
      }
    }

    // スクレイパーを実行
    const scraper = new ProgrammingLanguageScraper(options);
    const result = await scraper.scrapeLanguagesList();

    console.log('');
    console.log('📊 スクレイピング結果:');
    console.log(`   取得成功: ${result.metadata.successfullyScraped} 言語`);
    console.log(`   取得失敗: ${result.metadata.failed} 言語`);
    console.log(`   成功率: ${(result.metadata.successfullyScraped / result.metadata.totalLanguages * 100).toFixed(1)}%`);
    console.log(`   所要時間: ${result.metadata.duration.toFixed(2)} 秒`);
    console.log('');

    // 結果を保存
    console.log('💾 結果を保存中...');
    
    switch (outputFormat) {
      case 'json':
        await outputManager.saveAsJson(result);
        break;
      case 'csv':
        await outputManager.saveAsCsv(result);
        break;
      case 'both':
        await outputManager.saveAsBoth(result);
        break;
    }

    // 統計情報を保存
    const errors = scraper.getErrors();
    await outputManager.saveStatistics(result, errors);

    // エラーがあった場合は表示
    if (errors.length > 0) {
      console.log('');
      console.log('⚠️  エラー詳細:');
      const stats = scraper.getStatistics();
      Object.entries(stats).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`   ${type}: ${count} 件`);
        }
      });
    }

    console.log('');
    console.log('✨ スクレイピング完了！');
    
    // 品質の高い言語をいくつか表示
    const topLanguages = result.languages
      .filter(lang => lang.summary.length > 100)
      .slice(0, 5);
      
    if (topLanguages.length > 0) {
      console.log('');
      console.log('🏆 取得できた言語の例:');
      topLanguages.forEach(lang => {
        const year = lang.year ? ` (${lang.year})` : '';
        const summary = lang.summary.length > 80 
          ? lang.summary.substring(0, 80) + '...'
          : lang.summary;
        console.log(`   • ${lang.name}${year}: ${summary}`);
      });
    }

  } catch (error) {
    console.error('');
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

/**
 * 未処理の例外をキャッチ
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise拒否:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未処理の例外:', error);
  process.exit(1);
});

// メイン処理を実行
if (require.main === module) {
  main();
}
