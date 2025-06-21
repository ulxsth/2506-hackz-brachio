import * as fs from 'fs';
import * as path from 'path';
import { ProcessProgress } from './types';

/**
 * 進行状況の管理・保存・復旧を担当するクラス
 */
export class ProgressManager {
  private progressFilePath: string;

  constructor(outputDir: string) {
    this.progressFilePath = path.join(outputDir, 'progress.json');
  }

  /**
   * 進行状況を保存
   */
  async saveProgress(progress: ProcessProgress): Promise<void> {
    try {
      const progressData = {
        ...progress,
        timestamp: new Date().toISOString()
      };
      
      await fs.promises.writeFile(
        this.progressFilePath, 
        JSON.stringify(progressData, null, 2), 
        'utf8'
      );
      
      console.log(`💾 進行状況を保存: ${progress.processedCount}/${progress.totalCount} (${progress.lastProcessedName})`);
    } catch (error) {
      console.warn('⚠️  進行状況の保存に失敗:', error);
    }
  }

  /**
   * 保存された進行状況を読み込み
   */
  async loadProgress(): Promise<ProcessProgress | null> {
    try {
      if (!fs.existsSync(this.progressFilePath)) {
        console.log('📄 保存された進行状況が見つかりません');
        return null;
      }

      const progressData = await fs.promises.readFile(this.progressFilePath, 'utf8');
      const progress = JSON.parse(progressData) as ProcessProgress;
      
      console.log(`📁 進行状況を復旧: ${progress.processedCount}/${progress.totalCount}`);
      console.log(`   最後の処理: ${progress.lastProcessedName}`);
      console.log(`   保存日時: ${progress.timestamp}`);
      
      return progress;
    } catch (error) {
      console.warn('⚠️  進行状況の読み込みに失敗:', error);
      return null;
    }
  }

  /**
   * 進行状況をクリア（処理完了時）
   */
  async clearProgress(): Promise<void> {
    try {
      if (fs.existsSync(this.progressFilePath)) {
        await fs.promises.unlink(this.progressFilePath);
        console.log('🗑️  進行状況ファイルをクリアしました');
      }
    } catch (error) {
      console.warn('⚠️  進行状況ファイルの削除に失敗:', error);
    }
  }

  /**
   * 中断復旧の確認メッセージ
   */
  async promptResumeConfirmation(progress: ProcessProgress): Promise<boolean> {
    const remainingCount = progress.totalCount - progress.processedCount;
    const progressPercent = Math.round((progress.processedCount / progress.totalCount) * 100);
    
    console.log('\n🔄 中断された処理が見つかりました');
    console.log(`📊 進行状況: ${progress.processedCount}/${progress.totalCount} (${progressPercent}%)`);
    console.log(`📝 最後の処理: ${progress.lastProcessedName}`);
    console.log(`⏰ 保存日時: ${progress.timestamp}`);
    console.log(`🔢 残り処理: ${remainingCount}件`);
    
    // 実際の実装では、ユーザー入力を待つかもしれませんが、
    // 今回は自動的に復旧を実行する仕様とします
    console.log('✅ 自動的に処理を再開します...\n');
    return true;
  }
}
