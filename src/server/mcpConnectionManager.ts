import { MCPClient } from './mcpClient';
import { MCPCapabilities, MCPServer } from '../types/models';

/**
 * 複数のMCPサーバーとの接続を管理するサービス
 */
export class MCPConnectionManager {
  private clients = new Map<string, MCPClient>();
  private servers: MCPServer[] = [];

  constructor() {
    // プロセス終了時にすべての接続をクリーンアップ
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  /**
   * サーバー一覧を設定
   */
  setServers(servers: MCPServer[]): void {
    this.servers = servers;
  }

  /**
   * 特定のサーバーへの接続を取得または作成
   */
  async getClient(serverId: string): Promise<MCPClient | null> {
    // 既存のクライアントがあるかチェック
    let client = this.clients.get(serverId);

    if (client && client.isConnected()) {
      return client;
    }

    // サーバー設定を取得
    const server = this.servers.find(s => s.id === serverId);
    if (!server || !server.enabled || server.status !== 'running') {
      console.log(`Server ${serverId} is not available for connection`);
      return null;
    }

    // 新しいクライアントを作成
    client = new MCPClient(serverId, server.config);

    try {
      await client.connect();
      this.clients.set(serverId, client);
      console.log(`Successfully connected to MCP server: ${serverId}`);
      return client;
    } catch (error) {
      console.error(`Failed to connect to MCP server ${serverId}:`, error);
      return null;
    }
  }

  /**
   * サーバーの機能情報を取得
   */
  async getServerCapabilities(serverId: string): Promise<MCPCapabilities | null> {
    try {
      const client = await this.getClient(serverId);
      if (!client) {
        throw new Error(`Unable to connect to server ${serverId}`);
      }

      return await client.getCapabilities();
    } catch (error) {
      console.error(`Failed to get capabilities for server ${serverId}:`, error);
      return null;
    }
  }

  /**
   * 特定のサーバーとの接続を切断
   */
  async disconnectServer(serverId: string): Promise<void> {
    const client = this.clients.get(serverId);
    if (client) {
      await client.disconnect();
      this.clients.delete(serverId);
      console.log(`Disconnected from MCP server: ${serverId}`);
    }
  }

  /**
   * すべての接続を切断
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.entries()).map(
      async ([serverId, client]) => {
        try {
          await client.disconnect();
          console.log(`Disconnected from MCP server: ${serverId}`);
        } catch (error) {
          console.error(`Error disconnecting from ${serverId}:`, error);
        }
      }
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();
  }

  /**
   * 接続されているサーバー一覧を取得
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys()).filter(serverId => {
      const client = this.clients.get(serverId);
      return client && client.isConnected();
    });
  }

  /**
   * 特定のサーバーの接続状態を確認
   */
  isServerConnected(serverId: string): boolean {
    const client = this.clients.get(serverId);
    return client ? client.isConnected() : false;
  }

  /**
   * サーバーが有効/無効切り替えられた時の処理
   */
  async handleServerToggle(serverId: string, enabled: boolean): Promise<void> {
    if (!enabled) {
      // サーバーが無効化された場合は接続を切断
      await this.disconnectServer(serverId);
    }
    // 有効化された場合は次回のgetClient呼び出しで自動的に接続される
  }

  /**
   * クリーンアップ処理
   */
  private async cleanup(): Promise<void> {
    console.log('Cleaning up MCP connections...');
    await this.disconnectAll();
  }
}

// シングルトンインスタンス
export const mcpConnectionManager = new MCPConnectionManager();
