import { Request, Response } from 'express';
import { MCPServer, MCPCapabilities } from '../types/models';
import { mcpConnectionManager } from './mcpConnectionManager';

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
          status: (serverConfig.enabled !== false ? 'running' : 'stopped') as 'running' | 'stopped' | 'starting' | 'error',
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

      // MCP接続の管理
      mcpConnectionManager.setServers(this.installedServers);
      await mcpConnectionManager.handleServerToggle(id, enabled);

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
   * サーバーの機能情報を取得
   * @param req リクエスト
   * @param res レスポンス
   */
  public async getServerCapabilities(req: Request, res: Response): Promise<void> {
    try {
      const { serverId } = req.params;

      if (!serverId) {
        res.status(400).json({
          success: false,
          error: 'Server ID is required'
        });
        return;
      }

      console.log(`Getting capabilities for server: ${serverId}`);

      // サーバーが存在するかチェック
      const fs = require('fs').promises;
      const configPath = process.env.CONFIG_PATH || '/app/config/config.json';

      let config;
      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configData);
      } catch (error) {
        config = { mcpServers: {} };
      }

      const mcpServers = config.mcpServers || {};
      const serverConfig = mcpServers[serverId];

      if (!serverConfig) {
        res.status(404).json({
          success: false,
          error: `Server ${serverId} not found in configuration`,
          code: 'SERVER_NOT_FOUND',
          serverId
        });
        return;
      }

      // サーバーが有効でない場合はエラー
      if (serverConfig.enabled === false) {
        res.status(400).json({
          success: false,
          error: `Server ${serverId} is disabled`,
          code: 'SERVER_DISABLED',
          serverId
        });
        return;
      }

      // MCPConnectionManagerを使用してサーバー情報を更新
      const servers = Object.entries(mcpServers).map(([id, config]: [string, any]) => ({
        id,
        name: id,
        description: `MCP Server: ${id}`,
        version: '1.0.0',
        status: (config.enabled !== false ? 'running' : 'stopped') as 'running' | 'stopped' | 'starting' | 'error',
        enabled: config.enabled !== false,
        config,
        lastUpdated: new Date()
      }));

      mcpConnectionManager.setServers(servers);

      // 実際のMCPサーバーから機能情報を取得
      const capabilities = await mcpConnectionManager.getServerCapabilities(serverId);

      if (capabilities) {
        res.json({
          success: true,
          capabilities
        });
      } else {
        // 実際の接続が失敗した場合はエラーを返す
        res.status(503).json({
          success: false,
          error: `Failed to get capabilities from MCP server ${serverId}`,
          details: 'MCP server is not responding or not available'
        });
      }

    } catch (error) {
      console.error('Error getting server capabilities:', error);

      // エラーの詳細を含めたレスポンスを返す
      let errorMessage = 'Internal server error';
      let errorCode = 'INTERNAL_ERROR';

      if (error instanceof Error) {
        if (error.message.includes('connection')) {
          errorMessage = 'Failed to connect to MCP server';
          errorCode = 'CONNECTION_ERROR';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'MCP server connection timeout';
          errorCode = 'TIMEOUT_ERROR';
        } else {
          errorMessage = error.message;
        }
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        serverId: req.params.serverId
      });
    }
  }

  /**
   * サーバーのヘルスチェック
   * @param req リクエスト
   * @param res レスポンス
   */
  public async checkServerHealth(req: Request, res: Response): Promise<void> {
    try {
      const { serverId } = req.params;

      if (!serverId) {
        res.status(400).json({
          success: false,
          error: 'Server ID is required'
        });
        return;
      }

      console.log(`Health check for server: ${serverId}`);

      // サーバーが設定に存在するかチェック
      const fs = require('fs').promises;
      const configPath = process.env.CONFIG_PATH || '/app/config/config.json';

      let config;
      try {
        const configData = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configData);
      } catch (error) {
        config = { mcpServers: {} };
      }

      const mcpServers = config.mcpServers || {};
      const serverConfig = mcpServers[serverId];

      if (!serverConfig) {
        res.status(404).json({
          success: false,
          error: `Server ${serverId} not found in configuration`,
          code: 'SERVER_NOT_FOUND',
          serverId
        });
        return;
      }

      // サーバーの基本ステータス
      const healthStatus = {
        serverId,
        configExists: true,
        enabled: serverConfig.enabled !== false,
        lastChecked: new Date(),
        status: 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
        details: {} as any
      };

      // サーバーが無効な場合
      if (serverConfig.enabled === false) {
        healthStatus.status = 'unhealthy';
        healthStatus.details.reason = 'Server is disabled in configuration';
        res.json({
          success: true,
          health: healthStatus
        });
        return;
      }

      // MCPConnectionManagerを使用してサーバー接続をテスト
      try {
        const servers = Object.entries(mcpServers).map(([id, config]: [string, any]) => ({
          id,
          name: id,
          description: `MCP Server: ${id}`,
          version: '1.0.0',
          status: (config.enabled !== false ? 'running' : 'stopped') as 'running' | 'stopped' | 'starting' | 'error',
          enabled: config.enabled !== false,
          config,
          lastUpdated: new Date()
        }));

        mcpConnectionManager.setServers(servers);

        // 簡単な接続テスト（capabilitiesを取得してみる）
        const capabilities = await mcpConnectionManager.getServerCapabilities(serverId);

        if (capabilities) {
          healthStatus.status = 'healthy';
          healthStatus.details = {
            capabilities: {
              tools: capabilities.tools?.length || 0,
              resources: capabilities.resources?.length || 0,
              prompts: capabilities.prompts?.length || 0
            },
            lastSuccessfulConnection: capabilities.lastUpdated
          };
        } else {
          healthStatus.status = 'unhealthy';
          healthStatus.details.reason = 'Failed to retrieve capabilities';
        }

      } catch (error) {
        healthStatus.status = 'unhealthy';
        healthStatus.details.reason = error instanceof Error ? error.message : 'Unknown connection error';
        healthStatus.details.error = error;
      }

      res.json({
        success: true,
        health: healthStatus
      });

    } catch (error) {
      console.error('Error checking server health:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during health check',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * サーバーを追加
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
