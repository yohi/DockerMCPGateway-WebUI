import {
  GetServersResponse,
  ToggleServerRequest,
  UpdateConfigRequest,
  TestServerRequest,
  TestServerResponse,
  GetCatalogResponse,
  InstallServerRequest,
  ErrorResponse
} from '../types/api';
import { MCPServerConfig } from '../types/models';

/**
 * APIクライアントクラス
 */
export class ApiClient {
  private baseUrl: string;

  /**
   * コンストラクタ
   * @param baseUrl API基本URL
   */
  constructor(baseUrl?: string) {
    // 環境に応じてAPIのURLを設定
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      // ローカル開発環境 (ブラウザからlocalhostでアクセスする場合)
      this.baseUrl = 'http://localhost:5311/api';
    } else if (typeof window !== 'undefined') {
      // ブラウザ環境 (Dockerコンテナからアクセスする場合、またはホスト名がlocalhostでない場合)
      this.baseUrl = 'http://mcp-backend:5311/api';
    } else {
      // サーバー環境 (Next.jsのAPIルートなど)
      this.baseUrl = (typeof globalThis !== 'undefined' && globalThis.process?.env?.NEXT_PUBLIC_API_BASE_URL) || 'http://localhost:5311/api';
    }
    console.log('API Client initialized with baseUrl:', this.baseUrl);
  }

  /**
   * APIリクエストを実行
   * @param path APIパス
   * @param options リクエストオプション
   */
  private async fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    // APIエンドポイントのURLを生成
    const url = path.startsWith('/') ? `${this.baseUrl}${path}` : `${this.baseUrl}/${path}`;
    console.log(`Fetching API: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * サーバー一覧を取得
   */
  async getServers(): Promise<{ success: boolean; servers?: any[]; error?: any }> {
    return this.fetchApi('/servers');
  }

  /**
   * サーバーの有効/無効を切り替え
   * @param serverId サーバーID
   * @param enabled 有効化するか
   */
  async toggleServer(serverId: string): Promise<{ success: boolean; error?: any }> {
    return this.fetchApi(`/servers/${serverId}/toggle`, {
      method: 'POST',
    });
  }

  /**
   * サーバー設定を更新
   * @param serverId サーバーID
   * @param config サーバー設定
   */
  async updateServerConfig(serverId: string, config: any): Promise<{ success: boolean; error?: any }> {
    return this.fetchApi(`/servers/${serverId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  /**
   * サーバーをテスト
   * @param serverId サーバーID
   * @param testType テストタイプ
   * @param parameters テストパラメータ
   */
  async testServer(serverId: string): Promise<{ success: boolean; error?: any }> {
    return this.fetchApi(`/servers/${serverId}/test`, {
      method: 'POST',
    });
  }

  /**
   * カタログを取得
   */
  async getCatalog(): Promise<{ success: boolean; servers?: any[]; categories?: string[]; error?: any }> {
    return this.fetchApi('/catalog');
  }

  /**
   * サーバーをインストール
   * @param serverId サーバーID
   * @param config サーバー設定
   */
  async installServer(serverId: string, config?: any): Promise<{ success: boolean; message?: string; error?: any }> {
    return this.fetchApi('/catalog/install', {
      method: 'POST',
      body: JSON.stringify({ serverId, config }),
    });
  }

  /**
   * カスタムサーバーを追加
   * @param serverData カスタムサーバーのデータ
   */
  async addCustomServer(serverData: any): Promise<{ success: boolean; message?: string; server?: any; error?: any }> {
    return this.fetchApi('/catalog/custom', {
      method: 'POST',
      body: JSON.stringify(serverData),
    });
  }

  /**
   * カスタムサーバーを削除
   * @param serverId カスタムサーバーID
   */
  async removeCustomServer(serverId: string): Promise<{ success: boolean; message?: string; server?: any; error?: any }> {
    return this.fetchApi(`/catalog/custom/${serverId}`, {
      method: 'DELETE',
    });
  }

  /**
   * 設定を取得
   */
  async getConfig(): Promise<any> {
    try {
      const result = await this.fetchApi<any>('/config');
      return result;
    } catch (error) {
      console.error('Failed to get config:', error);
      throw error;
    }
  }

  /**
   * 設定を更新
   * @param config 設定
   */
  async updateConfig(config: any): Promise<any> {
    try {
      const result = await this.fetchApi<any>('/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      return result;
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  }

  /**
   * 設定をバックアップ
   */
  async backupConfig(): Promise<any> {
    try {
      const result = await this.fetchApi<any>('/config/backup', {
        method: 'POST',
      });
      return result;
    } catch (error) {
      console.error('Failed to backup config:', error);
      throw error;
    }
  }

  /**
   * バックアップから設定を復元
   * @param backupPath バックアップパス
   */
  async restoreConfig(backupPath: string): Promise<any> {
    return this.fetchApi<any>('/config/restore', {
      method: 'POST',
      body: JSON.stringify({ backupPath }),
    });
  }
}
