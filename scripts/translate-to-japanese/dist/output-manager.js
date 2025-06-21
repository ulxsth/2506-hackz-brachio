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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class OutputManager {
    outputDir;
    constructor(outputDir) {
        this.outputDir = outputDir;
        this.ensureOutputDirectory();
    }
    async saveStats(results, batchResult, filename) {
        const outputPath = path.join(this.outputDir, filename);
        const stats = {
            totalLanguages: results.length,
            processedLanguages: batchResult.processed,
            successfulTranslations: batchResult.successful,
            failedTranslations: batchResult.failed,
            successRate: (batchResult.successful / batchResult.processed) * 100,
            averageResponseTime: batchResult.duration / batchResult.processed,
            totalProcessingTime: batchResult.duration,
            startTime: batchResult.startTime.toISOString(),
            endTime: batchResult.endTime.toISOString(),
            errors: batchResult.errors
        };
        try {
            const jsonData = JSON.stringify(stats, null, 2);
            await fs.promises.writeFile(outputPath, jsonData, 'utf8');
            console.log(`📊 統計ファイルを保存: ${outputPath}`);
            this.displayStats(stats);
            return outputPath;
        }
        catch (error) {
            console.error('❌ 統計ファイル保存エラー:', error);
            throw error;
        }
    }
    async saveErrorLog(errors, filename) {
        if (errors.length === 0) {
            console.log('✅ エラーがないため、エラーログは作成されません');
            return '';
        }
        const outputPath = path.join(this.outputDir, filename);
        try {
            const logLines = [
                '# 翻訳エラーログ',
                `# 生成日時: ${new Date().toISOString()}`,
                `# エラー総数: ${errors.length}`,
                '',
                ...errors.map(error => `## ${error.name}\n` +
                    `- エラー: ${error.error}\n` +
                    `- 時刻: ${error.timestamp}\n` +
                    `- 再試行回数: ${error.retryCount}\n` +
                    `- 元の説明文: ${error.summary.substring(0, 200)}${error.summary.length > 200 ? '...' : ''}\n`)
            ];
            await fs.promises.writeFile(outputPath, logLines.join('\n'), 'utf8');
            console.log(`📝 エラーログを保存: ${outputPath} (${errors.length}件のエラー)`);
            return outputPath;
        }
        catch (error) {
            console.error('❌ エラーログ保存エラー:', error);
            throw error;
        }
    }
    async generateReport(results, batchResult, outputFiles) {
        const reportPath = path.join(this.outputDir, 'execution-report.md');
        const successRate = (batchResult.successful / batchResult.processed * 100).toFixed(1);
        const durationMinutes = (batchResult.duration / 1000 / 60).toFixed(1);
        const reportContent = `# 翻訳処理実行レポート

## 実行概要
- **実行日時**: ${batchResult.startTime.toISOString()}
- **処理言語数**: ${batchResult.processed}件
- **成功**: ${batchResult.successful}件
- **失敗**: ${batchResult.failed}件
- **成功率**: ${successRate}%
- **処理時間**: ${durationMinutes}分

## 出力ファイル
- **翻訳結果CSV**: \`${path.basename(outputFiles.csvPath)}\`
- **統計JSON**: \`${path.basename(outputFiles.statsPath)}\`
- **エラーログ**: ${outputFiles.errorLogPath ? `\`${path.basename(outputFiles.errorLogPath)}\`` : 'なし'}

## 品質分析

### 文字数分布
${this.generateLengthAnalysis(results)}

### 翻訳品質サンプル
${this.generateQualitySamples(results)}

${batchResult.errors.length > 0 ? `
## エラー分析
${this.generateErrorAnalysis(batchResult.errors)}
` : ''}

## 推奨事項
${this.generateRecommendations(batchResult)}

---
*このレポートは自動生成されました*
`;
        try {
            await fs.promises.writeFile(reportPath, reportContent, 'utf8');
            console.log(`📋 実行レポートを生成: ${reportPath}`);
            return reportPath;
        }
        catch (error) {
            console.error('❌ レポート生成エラー:', error);
            throw error;
        }
    }
    displaySuccessfulSamples(results, count = 10) {
        const successful = results.filter(lang => lang.japaneseSummary !== '翻訳エラー' &&
            lang.japaneseSummary !== 'バッチエラー');
        if (successful.length === 0) {
            console.log('❌ 成功した翻訳がありません');
            return;
        }
        console.log(`\n✨ 翻訳成功例 (${Math.min(count, successful.length)}件):`);
        successful.slice(0, count).forEach(lang => {
            console.log(`- **${lang.name}**: "${lang.japaneseSummary}" (${lang.japaneseSummary.length}文字)`);
        });
    }
    displayStats(stats) {
        console.log('\n📈 詳細統計:');
        console.log(`- 成功率: ${stats.successRate.toFixed(1)}%`);
        console.log(`- 平均応答時間: ${stats.averageResponseTime.toFixed(0)}ms`);
        console.log(`- 総処理時間: ${(stats.totalProcessingTime / 1000 / 60).toFixed(1)}分`);
        if (stats.errors.length > 0) {
            const errorTypes = this.categorizeErrors(stats.errors);
            console.log('- エラー分類:');
            Object.entries(errorTypes).forEach(([type, count]) => {
                console.log(`  - ${type}: ${count}件`);
            });
        }
    }
    generateLengthAnalysis(results) {
        const successful = results.filter(lang => lang.japaneseSummary !== '翻訳エラー' &&
            lang.japaneseSummary !== 'バッチエラー');
        if (successful.length === 0)
            return '- データなし';
        const lengths = successful.map(lang => lang.japaneseSummary.length);
        const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
        const maxLength = Math.max(...lengths);
        const minLength = Math.min(...lengths);
        const within30chars = lengths.filter(len => len <= 30).length;
        return `- **平均文字数**: ${avgLength.toFixed(1)}文字
- **最大文字数**: ${maxLength}文字
- **最小文字数**: ${minLength}文字
- **30文字以内**: ${within30chars}件 (${(within30chars / successful.length * 100).toFixed(1)}%)`;
    }
    generateQualitySamples(results) {
        const successful = results.filter(lang => lang.japaneseSummary !== '翻訳エラー' &&
            lang.japaneseSummary !== 'バッチエラー');
        if (successful.length === 0)
            return '- サンプルなし';
        const samples = successful.slice(0, 5);
        return samples.map(lang => `- **${lang.name}**: "${lang.japaneseSummary}" (${lang.japaneseSummary.length}文字)`).join('\n');
    }
    generateErrorAnalysis(errors) {
        const errorTypes = this.categorizeErrors(errors);
        const analysis = Object.entries(errorTypes)
            .map(([type, count]) => `- **${type}**: ${count}件`)
            .join('\n');
        return `### エラー分類
${analysis}

### 主要エラー例
${errors.slice(0, 3).map(error => `- **${error.name}**: ${error.error}`).join('\n')}`;
    }
    generateRecommendations(batchResult) {
        const recommendations = [];
        const successRate = (batchResult.successful / batchResult.processed) * 100;
        if (successRate < 90) {
            recommendations.push('- 成功率が90%未満です。API接続の安定性を確認してください');
        }
        if (batchResult.duration > 30 * 60 * 1000) {
            recommendations.push('- 処理時間が長いです。バッチサイズの調整を検討してください');
        }
        if (batchResult.errors.length > 10) {
            recommendations.push('- エラーが多発しています。入力データの品質確認を推奨します');
        }
        if (recommendations.length === 0) {
            recommendations.push('- 処理は正常に完了しました。特別な対応は不要です');
        }
        return recommendations.join('\n');
    }
    categorizeErrors(errors) {
        const categories = {};
        errors.forEach(error => {
            let category = 'その他';
            if (error.error.includes('翻訳失敗')) {
                category = 'API翻訳エラー';
            }
            else if (error.error.includes('バッチエラー')) {
                category = 'バッチ処理エラー';
            }
            else if (error.error.includes('ネットワーク')) {
                category = 'ネットワークエラー';
            }
            else if (error.error.includes('レート制限')) {
                category = 'レート制限エラー';
            }
            categories[category] = (categories[category] || 0) + 1;
        });
        return categories;
    }
    ensureOutputDirectory() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log(`📁 出力ディレクトリを作成: ${this.outputDir}`);
        }
    }
}
exports.OutputManager = OutputManager;
//# sourceMappingURL=output-manager.js.map