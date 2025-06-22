#!/usr/bin/env node

/**
 * 翻訳済みプログラミング言語データをit_termsテーブルに挿入するスクリプト
 *
 * 使用方法:
 * cd /home/yotu/github/2506-hackz-brachio
 * node scripts/insert-translated-data.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase設定（ローカル環境）
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * CSVファイルを解析してオブジェクト配列に変換
 * 引用符で囲まれた値とエスケープ処理に対応
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    // 最後の値を追加
    values.push(currentValue.trim());

    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    return obj;
  });
}

/**
 * プログラミング言語データをit_terms形式に変換
 */
function convertToItTerms(languageData) {
  return languageData
    .filter(item => item.name && item.name.trim()) // 空の名前を除外
    .map(item => {
      // 難易度設定（CSVの数値を使用、デフォルトは3）
      let difficultyId = 3; // デフォルト: 中級

      if (item.difficulty) {
        const diff = parseInt(item.difficulty);
        if (diff >= 1 && diff <= 4) {
          difficultyId = diff;
        }
      }

      // 説明文：日本語説明 + 英語説明の組み合わせ
      let description = '';
      if (item.japaneseSummary.trim()) {
        description = item.japaneseSummary.trim();
      }

      return {
        display_text: item.name.trim(),
        description: description || null,
        difficulty_id: difficultyId,
      };
    });
}

/**
 * マスターデータ（difficulties）を挿入
 */
async function insertMasterData() {
  console.log('📊 マスターデータの確認・挿入を開始します...');

  // difficulties テーブルの確認・挿入
  const { data: existingDifficulties, error: diffError } = await supabase
    .from('difficulties')
    .select('*');

  if (diffError) {
    console.error('❌ difficultiesテーブル確認エラー:', diffError);
    throw diffError;
  }

  console.log(`📋 既存のdifficulties: ${existingDifficulties.length}件`);

  if (existingDifficulties.length === 0) {
    console.log('🔄 difficultiesマスターデータを挿入中...');
    const difficultiesData = [
      { id: 1, level: 1, name: '初級', description: '知ってて当然なレベル' },
      { id: 2, level: 2, name: '中級', description: '知ってて一人前なレベル' },
      { id: 3, level: 3, name: '上級', description: '友達に自慢できるレベル' },
      { id: 4, level: 4, name: '専門家', description: 'なんで知ってるんですか？怖...レベル' }
    ];

    const { error: insertDiffError } = await supabase
      .from('difficulties')
      .insert(difficultiesData);

    if (insertDiffError) {
      console.error('❌ difficultiesマスターデータ挿入エラー:', insertDiffError);
      throw insertDiffError;
    }
    console.log('✅ difficultiesマスターデータ挿入完了！');
  }

  console.log('🎉 マスターデータ確認・挿入完了！');
}

/**
 * メイン処理
 */
async function main() {
  try {
    // マスターデータの確認・挿入
    await insertMasterData();

    console.log('🚨 it_termsテーブルを初期化します（全件削除）...');
    const { error: deleteError } = await supabase.from('it_terms').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
      console.error('❌ it_termsテーブル初期化エラー:', deleteError);
      throw deleteError;
    }
    console.log('🗑️  it_termsテーブル初期化完了！');

    console.log('🚀 翻訳済みデータの挿入を開始します...');

    // バッチCSVファイルを読み込み
    const outputDir = path.join(__dirname, 'translate-to-japanese/output');
    console.log('📁 バッチファイルディレクトリ:', outputDir);

    if (!fs.existsSync(outputDir)) {
      console.error('❌ 出力ディレクトリが見つかりません:', outputDir);
      process.exit(1);
    }

    // バッチファイル一覧を取得
    const files = fs.readdirSync(outputDir)
      .filter(file => file.match(/^programming-languages-ja-batch-\d+\.csv$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/batch-(\d+)\.csv$/)[1]);
        const numB = parseInt(b.match(/batch-(\d+)\.csv$/)[1]);
        return numA - numB;
      });

    console.log(`� ${files.length}個のバッチファイルを発見しました`);

    if (files.length === 0) {
      console.error('❌ バッチファイルが見つかりません');
      process.exit(1);
    }

    // 全バッチファイルを順次読み込み・統合
    let allCsvContent = '';
    let headerAdded = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(outputDir, file);

      console.log(`📄 バッチファイル読み込み中... (${i + 1}/${files.length}): ${file}`);

      try {
        const batchContent = fs.readFileSync(filePath, 'utf-8').trim();

        if (!batchContent) {
          console.warn(`⚠️  空のファイルをスキップ: ${file}`);
          continue;
        }

        const lines = batchContent.split('\n');

        if (!headerAdded) {
          // 最初のファイルのヘッダーを含める
          allCsvContent = batchContent;
          headerAdded = true;
        } else {
          // 2番目以降はヘッダーを除いて追加
          const dataLines = lines.slice(1);
          if (dataLines.length > 0 && dataLines[0].trim()) {
            allCsvContent += '\n' + dataLines.join('\n');
          }
        }

      } catch (error) {
        console.error(`❌ バッチファイル読み込みエラー (${file}):`, error.message);
        process.exit(1);
      }
    }

    console.log('✅ 全バッチファイル読み込み・統合完了');

    // CSVを解析
    const languageData = parseCSV(allCsvContent);
    console.log(`🔍 ${languageData.length}件のデータを解析しました`);

    // it_terms形式に変換
    const itTermsData = convertToItTerms(languageData);
    console.log(`✅ ${itTermsData.length}件のit_terms形式データを準備しました`);

    // 既存データの確認
    const { data: existingTerms, error: fetchError } = await supabase
      .from('it_terms')
      .select('display_text');

    if (fetchError) {
      console.error('❌ 既存データの取得エラー:', fetchError);
      throw fetchError;
    }

    const existingNames = new Set(existingTerms.map(term => term.display_text));
    console.log(`📋 既存のit_terms: ${existingNames.size}件`);

    // 重複を除外
    const newTermsData = itTermsData.filter(term => !existingNames.has(term.display_text));
    console.log(`🆕 新規追加対象: ${newTermsData.length}件`);

    if (newTermsData.length === 0) {
      console.log('ℹ️  追加する新しいデータがありません');
      return;
    }

    // データを分割して挿入（大量データ対応）
    const BATCH_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < newTermsData.length; i += BATCH_SIZE) {
      const batch = newTermsData.slice(i, i + BATCH_SIZE);

      console.log(`🔄 バッチ挿入中... (${i + 1}-${Math.min(i + BATCH_SIZE, newTermsData.length)}/${newTermsData.length})`);

      const { data, error } = await supabase
        .from('it_terms')
        .insert(batch)
        .select();

      if (error) {
        console.error('❌ バッチ挿入エラー:', error);
        console.error('エラー発生時のバッチ:', batch.slice(0, 3)); // 最初の3件だけ表示
        throw error;
      }

      insertedCount += data?.length || 0;
      console.log(`✅ バッチ挿入完了: ${data?.length || 0}件`);
    }

    console.log(`🎉 データ挿入完了！`);
    console.log(`📊 統計:`);
    console.log(`   - 処理対象: ${languageData.length}件`);
    console.log(`   - 変換後: ${itTermsData.length}件`);
    console.log(`   - 既存除外: ${itTermsData.length - newTermsData.length}件`);
    console.log(`   - 新規挿入: ${insertedCount}件`);

  } catch (error) {
    console.error('💥 処理中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main();
}

module.exports = { parseCSV, convertToItTerms };
