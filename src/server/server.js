const express = require('express');
const path = require('path');
const cors = require('cors');

/**
 * サーバーアプリケーションの初期化とルートハンドラーのセットアップ
 */
const app = express();
const PORT = process.env.PORT || 5311;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイル
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
}

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 基本的なAPIエンドポイント
app.get('/api/config', (req, res) => {
  console.log('GET /api/config endpoint hit');
  // デフォルト設定を返す
  const defaultConfig = {
    version: '1.0.0',
    apiEndpoint: 'http://localhost:5311/api',
    autoUpdate: true,
    defaultTimeout: 30000,
    logLevel: 'info',
    maxLogSize: '100MB',
    healthCheckInterval: 10000,
    global: {
      logLevel: 'info',
      maxLogSize: '100MB',
      healthCheckInterval: 10000
    },
    mcpServers: {}
  };

  res.json(defaultConfig);
});

app.put('/api/config', (req, res) => {
  try {
    const config = req.body;
    console.log('PUT /api/config endpoint hit');
    console.log('Received config update request:', JSON.stringify(config, null, 2));

    // 基本的なバリデーション
    if (!config) {
      console.error('Config validation failed: Empty config');
      return res.status(400).json({
        error: {
          code: 'INVALID_CONFIG',
          message: '設定の形式が正しくありません',
          details: ['Configuration is empty']
        }
      });
    }

    if (!config.version) {
      console.error('Config validation failed: Missing version');
      return res.status(400).json({
        error: {
          code: 'INVALID_CONFIG',
          message: '設定の形式が正しくありません',
          details: ['Version is required']
        }
      });
    }

    if (!config.global || typeof config.global !== 'object') {
      console.error('Config validation failed: Missing global config');
      return res.status(400).json({
        error: {
          code: 'INVALID_CONFIG',
          message: '設定の形式が正しくありません',
          details: ['Global configuration is missing or invalid']
        }
      });
    }

    // MCPサーバー設定の検証
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      const serverValidationErrors = [];

      Object.entries(config.mcpServers).forEach(([serverId, serverConfig]) => {
        if (!serverConfig || typeof serverConfig !== 'object') {
          serverValidationErrors.push(`Server ${serverId}: configuration must be an object`);
          return;
        }

        // MCPサーバーは command, image, url のいずれかが必要
        const hasCommand = serverConfig.command;
        const hasImage = serverConfig.image;
        const hasUrl = serverConfig.url;

        if (!hasCommand && !hasImage && !hasUrl) {
          serverValidationErrors.push(`Server ${serverId}: must have either command, image, or url specified`);
        }

        // command形式の場合、argsの検証
        if (hasCommand && serverConfig.args && !Array.isArray(serverConfig.args)) {
          serverValidationErrors.push(`Server ${serverId}: args must be an array`);
        }

        // env検証
        if (serverConfig.env && typeof serverConfig.env !== 'object') {
          serverValidationErrors.push(`Server ${serverId}: environment variables must be an object`);
        }

        // URL形式の場合のheaders検証
        if (hasUrl && serverConfig.headers && typeof serverConfig.headers !== 'object') {
          serverValidationErrors.push(`Server ${serverId}: headers must be an object`);
        }
      });

      if (serverValidationErrors.length > 0) {
        console.error('Config validation failed: Server validation errors', serverValidationErrors);
        return res.status(400).json({
          error: {
            code: 'INVALID_CONFIG',
            message: '設定の形式が正しくありません',
            details: serverValidationErrors
          }
        });
      }
    }

    console.log('Config validation passed');
    console.log('Config saved successfully');

    res.json({
      success: true,
      message: '設定が正常に保存されました',
      config: config
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({
      error: {
        code: 'CONFIG_SAVE_ERROR',
        message: '設定の保存に失敗しました'
      }
    });
  }
});

// その他のAPIエンドポイント
app.get('/api/servers', async (req, res) => {
  try {
    console.log('GET /api/servers endpoint hit');

    // 設定ファイルを読み込み
    const fs = require('fs').promises;
    const path = require('path');
    const configPath = process.env.CONFIG_PATH || '/app/config/config.json';

    let config;
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      console.log('Config file not found, using default empty config');
      config = { mcpServers: {} };
    }

    const mcpServers = config.mcpServers || {};
    const servers = [];

    // MCPサーバー設定をサーバー一覧形式に変換
    Object.entries(mcpServers).forEach(([serverId, serverConfig]) => {
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
    console.error('Error getting servers:', error);
    res.status(500).json({
      success: false,
      error: 'サーバー一覧の取得に失敗しました'
    });
  }
});

app.get('/api/catalog', (req, res) => {
  res.json({ catalog: [] });
});

// CORS設定を追加
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// フォールバックルート (React SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
