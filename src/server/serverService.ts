import { Request, Response } from 'express';
import { MCPServer } from '../types/models';

/**
 * MCPサーバー管理サービス
 * サーバーの一覧取得、有効/無効切り替え、設定管理などを行う
 */
export class ServerService {
  // インストール済みサーバーのリスト（本来はDBやファイルから読み込む）
  private installedServers: MCPServer[] = [];

  constructor() {
    // テスト用にモックデータを初期化
    this.installedServers = [
      {
        id: 'server1',
        name: 'MCP Server 1',
        description: 'Test server 1',
        version: '1.0.0',
        status: 'running',
        enabled: true,
        config: { image: 'mcp-server-1' },
        lastUpdated: new Date()
      },
      {
        id: 'server2',
        name: 'MCP Server 2',
        description: 'Test server 2',
        version: '1.0.0',
        status: 'stopped',
        enabled: false,
        config: { image: 'mcp-server-2' },
        lastUpdated: new Date()
      }
    ];
  }

  /**
   * サーバー一覧を取得
   * @param req リクエスト
   * @param res レスポンス
   */
  public async getServers(req: Request, res: Response): Promise<void> {
    try {
      console.log('GET /api/servers endpoint hit in serverService');

      // 設定ファイルを読み込み
      const fs = require('fs').promises;
      const configPath = process.env.CONFIG_PATH || '/app/config/config.json';

      let config;
      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configData);
        console.log('Config loaded successfully, mcpServers count:', Object.keys(config.mcpServers || {}).length);
      } catch (error) {
        console.log('Config file not found, using default empty config');
        config = { mcpServers: {} };
      }

      const mcpServers = config.mcpServers || {};
      const servers: MCPServer[] = [];

      // MCPサーバー設定をサーバー一覧形式に変換
      Object.entries(mcpServers).forEach(([serverId, serverConfig]: [string, any]) => {
        servers.push({
          id: serverId,
          name: serverId,
          description: `MCP Server: ${serverId}`,
          version: '1.0.0',
          status: serverConfig.enabled !== false ? 'running' : 'stopped',
          enabled: serverConfig.enabled !== false,
          config: serverConfig,
          lastUpdated: new Date()
        });
      });

      console.log(`Returning ${servers.length} servers:`, servers.map(s => s.id));
      res.json({
        success: true,
        servers: servers
      });
    } catch (error) {
      console.error('Error fetching servers:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVERS_ERROR',
          message: 'サーバー一覧の取得中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * サーバーの有効/無効を切り替え
   * @param req リクエスト
   * @param res レスポンス
   */
  public async toggleServer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'サーバーIDが指定されていません'
          }
        });
        return;
      }

      // サーバーを検索
      const serverIndex = this.installedServers.findIndex(server => server.id === id);
      if (serverIndex === -1) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: `サーバー ${id} が見つかりません`
          }
        });
        return;
      }

      // サーバーの有効/無効を切り替え
      this.installedServers[serverIndex].enabled = enabled;
      this.installedServers[serverIndex].status = enabled ? 'running' : 'stopped';

      res.json({
        success: true,
        message: `サーバー ${id} を ${enabled ? '有効' : '無効'} にしました`,
        server: this.installedServers[serverIndex]
      });
    } catch (error) {
      console.error('Error toggling server:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TOGGLE_ERROR',
          message: 'サーバーの有効/無効切り替え中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * サーバー設定を更新
   * @param req リクエスト
   * @param res レスポンス
   */
  public async updateServerConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const config = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'サーバーIDが指定されていません'
          }
        });
        return;
      }

      // サーバーを検索
      const serverIndex = this.installedServers.findIndex(server => server.id === id);
      if (serverIndex === -1) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: `サーバー ${id} が見つかりません`
          }
        });
        return;
      }

      // サーバー設定を更新
      this.installedServers[serverIndex].config = config;
      this.installedServers[serverIndex].lastUpdated = new Date();

      res.json({
        success: true,
        message: `サーバー ${id} の設定を更新しました`,
        server: this.installedServers[serverIndex]
      });
    } catch (error) {
      console.error('Error updating server config:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_CONFIG_ERROR',
          message: 'サーバー設定の更新中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * サーバーをテスト
   * @param req リクエスト
   * @param res レスポンス
   */
  public async testServer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'サーバーIDが指定されていません'
          }
        });
        return;
      }

      // サーバーを検索
      const server = this.installedServers.find(server => server.id === id);
      if (!server) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SERVER_NOT_FOUND',
            message: `サーバー ${id} が見つかりません`
          }
        });
        return;
      }

      // サーバーテストを実行（実際の実装ではMCP Gatewayと通信）
      const testResult = {
        success: true,
        testType: 'connection',
        message: `サーバー ${id} のテストが成功しました`,
        details: {
          serverId: id,
          status: server.status,
          enabled: server.enabled
        },
        timestamp: new Date()
      };

      res.json({
        success: true,
        testResult
      });
    } catch (error) {
      console.error('Error testing server:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: 'サーバーテスト中にエラーが発生しました'
        }
      });
    }
  }

  /**
   * インストール済みサーバーにサーバーを追加
   * @param server サーバー情報
   */
  public addServer(server: MCPServer): void {
    // 既存のサーバーを検索
    const existingIndex = this.installedServers.findIndex(s => s.id === server.id);

    if (existingIndex !== -1) {
      // 既存のサーバーを更新
      this.installedServers[existingIndex] = {
        ...this.installedServers[existingIndex],
        ...server
      };
    } else {
      // 新しいサーバーを追加
      this.installedServers.push(server);
    }
  }
}

export default new ServerService();
