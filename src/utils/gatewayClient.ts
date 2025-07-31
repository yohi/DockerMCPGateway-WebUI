import { GatewayClient, ServerStatus } from '../types/gateway';
import { MCPServerConfig, TestResult } from '../types/models';

/**
 * Docker MCP Gateway通信クライアント
 */
export class MCPGatewayClient implements GatewayClient {
  private baseUrl: string;

  /**
   * コンストラクタ
   * @param baseUrl Gateway APIのベースURL
   */
  constructor(baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:18080') {
    this.baseUrl = baseUrl;
  }

  /**
   * Gateway APIエンドポイントを取得
   */
  private getEndpoint(path: string): string {
    return `${this.baseUrl}/api/v1${path}`;
  }

  /**
   * APIリクエストを実行
   */
  private async fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = this.getEndpoint(path);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * サーバーステータスを取得
   * @param serverId サーバーID
   */
  async getServerStatus(serverId: string): Promise<ServerStatus> {
    const data = await this.fetchApi<any>(`/servers/${serverId}/status`);

    return {
      status: data.status,
      timestamp: new Date(data.timestamp),
      details: data.details,
    };
  }

  /**
   * サーバー設定を更新
   * @param serverId サーバーID
   * @param config サーバー設定
   */
  async updateServerConfig(serverId: string, config: MCPServerConfig): Promise<void> {
    await this.fetchApi(`/servers/${serverId}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    });
  }

  /**
   * サーバーを再起動
   * @param serverId サーバーID
   */
  async restartServer(serverId: string): Promise<void> {
    await this.fetchApi(`/servers/${serverId}/restart`, {
      method: 'POST',
    });
  }

  /**
   * サーバー接続テスト
   * @param serverId サーバーID
   */
  async testServerConnection(serverId: string): Promise<TestResult> {
    const data = await this.fetchApi<any>(`/servers/${serverId}/test`, {
      method: 'POST',
      body: JSON.stringify({ testType: 'connection' }),
    });

    return {
      success: data.success,
      testType: 'connection',
      message: data.message || '',
      details: data.details,
      timestamp: new Date(),
    };
  }

  /**
   * サーバーの有効/無効を切り替え
   * @param serverId サーバーID
   * @param enabled 有効化するか
   */
  async toggleServerEnabled(serverId: string, enabled: boolean): Promise<void> {
    await this.fetchApi(`/servers/${serverId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  /**
   * サーバー一覧を取得
   */
  async getServers(): Promise<any[]> {
    return await this.fetchApi<any[]>('/servers');
  }

  /**
   * カタログ一覧を取得
   */
  async getCatalog(): Promise<any> {
    return await this.fetchApi<any>('/catalog');
  }

  /**
   * サーバーをインストール
   * @param serverId サーバーID
   * @param config 設定
   */
  async installServer(serverId: string, config?: MCPServerConfig): Promise<any> {
    return await this.fetchApi('/catalog/install', {
      method: 'POST',
      body: JSON.stringify({ serverId, config }),
    });
  }
}
