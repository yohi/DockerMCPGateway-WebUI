import { MCPServerConfig, TestResult } from './models';

/**
 * Gateway通信クライアントインターフェース
 */
export interface GatewayClient {
  /**
   * サーバーステータスを取得
   */
  getServerStatus(serverId: string): Promise<ServerStatus>;

  /**
   * サーバー設定を更新
   */
  updateServerConfig(serverId: string, config: MCPServerConfig): Promise<void>;

  /**
   * サーバーを再起動
   */
  restartServer(serverId: string): Promise<void>;

  /**
   * サーバー接続テスト
   */
  testServerConnection(serverId: string): Promise<TestResult>;
}

/**
 * サーバーステータス
 */
export interface ServerStatus {
  status: 'running' | 'stopped' | 'error' | 'starting';
  timestamp: Date;
  details?: any;
}

/**
 * Docker MCP Gateway APIエンドポイント
 */
export interface GatewayAPI {
  baseUrl: string; // http://mcp-gateway:8080
  endpoints: {
    servers: '/api/v1/servers';
    config: '/api/v1/config';
    health: '/api/v1/health';
    logs: '/api/v1/logs';
  };
}
