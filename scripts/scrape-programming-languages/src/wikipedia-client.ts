import { WikipediaSummary } from './types.js';

/**
 * Wikipedia API クライアント
 */
export class WikipediaClient {
  private readonly baseUrl = 'https://en.wikipedia.org/api/rest_v1';
  private readonly actionApiUrl = 'https://en.wikipedia.org/w/api.php';
  private readonly userAgent = 'ITTypingGame/1.0 (https://github.com/yourteam/it-typing-game)';

  /**
   * ページサマリーを取得
   */
  async getPageSummary(title: string): Promise<WikipediaSummary> {
    const url = `${this.baseUrl}/page/summary/${encodeURIComponent(title)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Page not found: ${title}`);
      }
      throw new Error(`Failed to fetch ${title}: ${response.status} ${response.statusText}`);
    }

    return await response.json() as WikipediaSummary;
  }

  /**
   * ページのHTMLコンテンツを取得
   */
  async getPageContent(title: string): Promise<string> {
    const url = `${this.actionApiUrl}?action=parse&page=${encodeURIComponent(title)}&format=json&prop=text&section=0`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content for ${title}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    if (data.error) {
      throw new Error(`Wikipedia API error: ${data.error.info}`);
    }

    return data.parse?.text?.['*'] || '';
  }

  /**
   * リストページのHTMLを取得
   */
  async getListPageHtml(title: string): Promise<string> {
    const url = `${this.actionApiUrl}?action=parse&page=${encodeURIComponent(title)}&format=json&prop=text`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch list page: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    if (data.error) {
      throw new Error(`Wikipedia API error: ${data.error.info}`);
    }

    return data.parse?.text?.['*'] || '';
  }

  /**
   * APIレート制限を考慮した待機
   */
  async waitForRateLimit(delayMs: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  /**
   * リトライ機能付きでAPIを呼び出し
   */
  async fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // 指数バックオフ
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await this.waitForRateLimit(delay);
        }
        
        return await fetchFn();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
        
        if (attempt === maxRetries) {
          break;
        }
      }
    }

    throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError!.message}`);
  }
}
