"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvProcessor = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const csv_writer_1 = require("csv-writer");
class CsvProcessor {
    inputPath;
    outputDir;
    constructor(inputPath, outputDir) {
        this.inputPath = inputPath;
        this.outputDir = outputDir;
        this.ensureOutputDirectory();
    }
    async readInputCsv() {
        return new Promise((resolve, reject) => {
            const languages = [];
            const errors = [];
            console.log(`📄 CSVファイルを読み込み中: ${this.inputPath}`);
            if (!fs.existsSync(this.inputPath)) {
                reject(new Error(`入力ファイルが見つかりません: ${this.inputPath}`));
                return;
            }
            fs.createReadStream(this.inputPath)
                .pipe((0, csv_parser_1.default)())
                .on('data', (row) => {
                try {
                    const language = this.parseRow(row);
                    if (language) {
                        languages.push(language);
                    }
                }
                catch (error) {
                    const errorMsg = `行解析エラー: ${error instanceof Error ? error.message : String(error)}`;
                    errors.push(errorMsg);
                    console.warn(`⚠️  ${errorMsg}`, row);
                }
            })
                .on('end', () => {
                console.log(`✅ CSV読み込み完了: ${languages.length}件の言語データ`);
                if (errors.length > 0) {
                    console.warn(`⚠️  ${errors.length}件の解析エラーがありました`);
                }
                resolve(languages);
            })
                .on('error', (error) => {
                console.error('❌ CSV読み込みエラー:', error);
                reject(error);
            });
        });
    }
    async writeOutputCsv(translatedLanguages, filename) {
        const outputPath = path.join(this.outputDir, filename);
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: outputPath,
            header: [
                { id: 'name', title: 'name' },
                { id: 'wikipediaTitle', title: 'wikipediaTitle' },
                { id: 'summary', title: 'summary' },
                { id: 'japaneseSummary', title: 'japaneseSummary' },
                { id: 'categories', title: 'categories' },
                { id: 'year', title: 'year' }
            ],
            encoding: 'utf8'
        });
        try {
            console.log(`💾 出力CSVファイルを書き込み中: ${outputPath}`);
            await csvWriter.writeRecords(translatedLanguages);
            console.log(`✅ 出力完了: ${translatedLanguages.length}件のデータを保存`);
            return outputPath;
        }
        catch (error) {
            console.error('❌ CSV書き込みエラー:', error);
            throw error;
        }
    }
    parseRow(row) {
        if (!row.name || !row.summary) {
            console.warn(`⚠️  必須フィールドが不足: name="${row.name}", summary="${row.summary}"`);
            return null;
        }
        if (row.summary.trim().length === 0) {
            console.warn(`⚠️  空の説明文をスキップ: ${row.name}`);
            return null;
        }
        let year = null;
        if (row.year && row.year.trim() !== '') {
            const parsedYear = parseInt(row.year);
            if (!isNaN(parsedYear) && parsedYear > 1950 && parsedYear <= new Date().getFullYear()) {
                year = parsedYear;
            }
        }
        return {
            name: row.name.trim(),
            wikipediaTitle: row.wikipediaTitle ? row.wikipediaTitle.trim() : row.name.trim(),
            summary: row.summary.trim(),
            categories: row.categories ? row.categories.trim() : '',
            year
        };
    }
    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log(`📁 出力ディレクトリを作成: ${this.outputDir}`);
        }
    }
    displayDataStats(languages) {
        console.log('\n📊 データ統計:');
        console.log(`- 総言語数: ${languages.length}`);
        const withYear = languages.filter(lang => lang.year !== null).length;
        console.log(`- 年数情報あり: ${withYear} (${(withYear / languages.length * 100).toFixed(1)}%)`);
        const withCategories = languages.filter(lang => lang.categories.length > 0).length;
        console.log(`- カテゴリ情報あり: ${withCategories} (${(withCategories / languages.length * 100).toFixed(1)}%)`);
        const avgSummaryLength = languages.reduce((sum, lang) => sum + lang.summary.length, 0) / languages.length;
        console.log(`- 平均説明文長: ${avgSummaryLength.toFixed(1)}文字`);
        const longestSummary = languages.reduce((max, lang) => lang.summary.length > max.summary.length ? lang : max);
        console.log(`- 最長説明文: ${longestSummary.name} (${longestSummary.summary.length}文字)`);
        const decades = {};
        languages.filter(lang => lang.year).forEach(lang => {
            const decade = Math.floor(lang.year / 10) * 10;
            decades[`${decade}s`] = (decades[`${decade}s`] || 0) + 1;
        });
        if (Object.keys(decades).length > 0) {
            console.log('- 年代別分布:');
            Object.entries(decades)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([decade, count]) => {
                console.log(`  ${decade}: ${count}言語`);
            });
        }
        console.log('');
    }
    validateData(languages) {
        const valid = [];
        const invalid = [];
        languages.forEach(language => {
            const issues = [];
            if (language.summary.length < 10) {
                issues.push('説明文が短すぎます');
            }
            if (language.summary.length > 1000) {
                issues.push('説明文が長すぎます');
            }
            if (language.summary.includes('�')) {
                issues.push('文字化けが含まれています');
            }
            if (/<[^>]*>/.test(language.summary)) {
                issues.push('HTMLタグが含まれています');
            }
            if (issues.length > 0) {
                invalid.push({ language, issues });
            }
            else {
                valid.push(language);
            }
        });
        if (invalid.length > 0) {
            console.log(`⚠️  ${invalid.length}件の問題のあるデータを検出:`);
            invalid.slice(0, 5).forEach(({ language, issues }) => {
                console.log(`- ${language.name}: ${issues.join(', ')}`);
            });
            if (invalid.length > 5) {
                console.log(`  ... 他${invalid.length - 5}件`);
            }
        }
        return { valid, invalid };
    }
}
exports.CsvProcessor = CsvProcessor;
//# sourceMappingURL=csv-processor.js.map