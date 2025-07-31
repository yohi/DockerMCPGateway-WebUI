import { GatewayConfig, MCPServerConfig } from '../types/models';
import { ValidationResult, ValidationError } from '../types/models';

/**
 * 設定ファイル管理クラス
 */
export class ConfigManager {
  private configPath: string;
  private config: GatewayConfig | null = null;

  /**
   * コンストラクタ
   * @param configPath 設定ファイルパス
   */
  constructor(configPath?: string) {
    if (typeof window === 'undefined' && typeof globalThis.process !== 'undefined') {
      // Node.js環境
      this.configPath = configPath || globalThis.process.env.CONFIG_PATH || '/app/config/config.json';
    } else {
      // ブラウザ環境
      this.configPath = configPath || './config.json';
    }
  }

  /**
   * 設定を読み込む
   */
  async loadConfig(): Promise<GatewayConfig> {
    // Node.js環境でのみファイルシステムにアクセス
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = eval('require')('fs').promises;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = eval('require')('path');

        // 設定ディレクトリが存在しない場合は作成
        const configDir = path.dirname(this.configPath);
        try {
          await fs.access(configDir);
        } catch {
          await fs.mkdir(configDir, { recursive: true });
        }

        // 設定ファイルが存在するかチェック
        try {
          await fs.access(this.configPath);
        } catch {
          // 設定ファイルが存在しない場合はデフォルト設定を作成
          const defaultConfig: GatewayConfig = {
            version: '1.0.0',
            apiEndpoint: 'http://localhost:8080/api',
            autoUpdate: true,
            defaultTimeout: 30000,
            logLevel: 'info',
            mcpServers: {},
            servers: {},
            global: {
              logLevel: 'info',
              maxLogSize: '10MB',
              healthCheckInterval: 30000
            }
          };

          await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
          this.config = defaultConfig;
          return defaultConfig;
        }

        const configData = await fs.readFile(this.configPath, 'utf-8');
        const config = JSON.parse(configData);
        this.config = config;
        return config;
      } catch (error) {
        console.error(`Error loading config from ${this.configPath}:`, error);
        throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // ブラウザ環境では APIを通じて設定を取得
      try {
        const response = await fetch('/api/config');
        if (!response.ok) {
          throw new Error(`Failed to fetch config: ${response.statusText}`);
        }
        const config = await response.json();
        this.config = config;
        return config;
      } catch (error) {
        console.error('Error fetching config:', error);
        throw new Error(`Failed to fetch configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * 設定を保存する
   */
  async saveConfig(config: GatewayConfig): Promise<void> {
    // Node.js環境でのみファイルシステムに保存
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = eval('require')('fs').promises;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = eval('require')('path');

        // 設定ディレクトリが存在しない場合は作成
        const configDir = path.dirname(this.configPath);
        try {
          await fs.access(configDir);
        } catch {
          await fs.mkdir(configDir, { recursive: true });
        }

        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
        this.config = config;
      } catch (error) {
        console.error(`Error saving config to ${this.configPath}:`, error);
        throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // ブラウザ環境では APIを通じて設定を保存
      try {
        const response = await fetch('/api/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          throw new Error(`Failed to save config: ${response.statusText}`);
        }

        this.config = config;
      } catch (error) {
        console.error('Error saving config:', error);
        throw new Error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * サーバー設定を更新する
   */
  async updateServerConfig(serverId: string, config: MCPServerConfig): Promise<void> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      throw new Error('Configuration is not loaded');
    }

    // mcpServersとservers両方を更新して互換性を保つ
    if (!this.config.mcpServers) {
      this.config.mcpServers = {};
    }
    if (!this.config.servers) {
      this.config.servers = {};
    }

    this.config.mcpServers[serverId] = config;
    this.config.servers[serverId] = config;
    await this.saveConfig(this.config);
  }

  /**
   * サーバー設定を取得する
   */
  async getServerConfig(serverId: string): Promise<MCPServerConfig | null> {
    if (!this.config) {
      await this.loadConfig();
    }

    if (!this.config) {
      throw new Error('Configuration is not loaded');
    }

    // mcpServersまたはserversから設定を取得
    return this.config.mcpServers?.[serverId] || this.config.servers?.[serverId] || null;
  }

  /**
   * 設定をバックアップする
   */
  async backupConfig(): Promise<string> {
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = eval('require')('fs').promises;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const path = eval('require')('path');

        const configDir = path.dirname(this.configPath);
        const backupPath = path.join(configDir, `backup-${Date.now()}.json`);

        if (!this.config) {
          await this.loadConfig();
        }

        await fs.writeFile(backupPath, JSON.stringify(this.config, null, 2));
        return backupPath;
      } catch (error) {
        console.error('Error creating backup:', error);
        throw new Error(`Failed to backup configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // ブラウザ環境では APIを通じてバックアップを作成
      try {
        const response = await fetch('/api/config/backup', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`Failed to create backup: ${response.statusText}`);
        }

        const result = await response.json();
        return result.backupPath;
      } catch (error) {
        console.error('Error creating backup:', error);
        throw new Error(`Failed to backup configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * バックアップから復元する
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    if (typeof window === 'undefined') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = eval('require')('fs').promises;
        const backupData = await fs.readFile(backupPath, 'utf-8');
        const restoredConfig = JSON.parse(backupData);

        // 設定検証
        const validation = this.validateConfig(restoredConfig);
        if (!validation.isValid) {
          throw new Error(`Invalid backup configuration: ${validation.errors?.map(e => e.message).join(', ')}`);
        }

        await this.saveConfig(restoredConfig);
      } catch (error) {
        console.error(`Error restoring from backup ${backupPath}:`, error);
        throw new Error(`Failed to restore configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // ブラウザ環境では APIを通じてバックアップから復元
      try {
        const response = await fetch('/api/config/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ backupPath }),
        });

        if (!response.ok) {
          throw new Error(`Failed to restore from backup: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error restoring from backup:', error);
        throw new Error(`Failed to restore configuration: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * JSON設定の検証
   */
  validateConfig(config: any): ValidationResult {
    const errors: ValidationError[] = [];

    // 基本構造の検証
    if (!config) {
      errors.push({ field: 'config', path: '', message: 'Configuration is empty', code: 'EMPTY_CONFIG' });
      return { isValid: false, errors };
    }

    // バージョンの検証
    if (!config.version) {
      errors.push({ field: 'version', path: 'version', message: 'Version is required', code: 'MISSING_VERSION' });
    }

    // servers オブジェクトの検証（mcpServersまたはserversを確認）
    const serversConfig = config.mcpServers || config.servers;
    if (serversConfig && typeof serversConfig === 'object') {
      // 各サーバー設定の検証
      Object.entries(serversConfig).forEach(([serverId, serverConfig]: [string, any]) => {
        if (!serverConfig || typeof serverConfig !== 'object') {
          errors.push({ field: 'serverConfig', path: `servers.${serverId}`, message: 'Server configuration must be an object', code: 'INVALID_SERVER_CONFIG' });
          return;
        }

        // MCPサーバーは以下のいずれかの形式である必要がある：
        // 1. command + args (コマンド実行形式)
        // 2. image (Docker形式)
        // 3. url (HTTP/HTTPS形式)
        const hasCommand = serverConfig.command;
        const hasImage = serverConfig.image;
        const hasUrl = serverConfig.url;

        if (!hasCommand && !hasImage && !hasUrl) {
          errors.push({
            field: 'execution',
            path: `servers.${serverId}`,
            message: 'Server must have either command, image, or url specified',
            code: 'MISSING_EXECUTION_METHOD'
          });
        }

        // command形式の場合、argsの検証
        if (hasCommand && serverConfig.args && !Array.isArray(serverConfig.args)) {
          errors.push({ field: 'args', path: `servers.${serverId}.args`, message: 'Args must be an array', code: 'INVALID_ARGS' });
        }

        // Docker形式の場合のports検証
        if (hasImage && serverConfig.ports && !Array.isArray(serverConfig.ports)) {
          errors.push({ field: 'ports', path: `servers.${serverId}.ports`, message: 'Ports must be an array', code: 'INVALID_PORTS' });
        }

        // Docker形式の場合のvolumes検証
        if (hasImage && serverConfig.volumes && !Array.isArray(serverConfig.volumes)) {
          errors.push({ field: 'volumes', path: `servers.${serverId}.volumes`, message: 'Volumes must be an array', code: 'INVALID_VOLUMES' });
        }

        // env検証（全形式共通）
        if (serverConfig.env && typeof serverConfig.env !== 'object') {
          errors.push({ field: 'env', path: `servers.${serverId}.env`, message: 'Environment variables must be an object', code: 'INVALID_ENV' });
        }

        // URL形式の場合のheaders検証
        if (hasUrl && serverConfig.headers && typeof serverConfig.headers !== 'object') {
          errors.push({ field: 'headers', path: `servers.${serverId}.headers`, message: 'Headers must be an object', code: 'INVALID_HEADERS' });
        }
      });
    }

    // global 設定の検証
    if (!config.global || typeof config.global !== 'object') {
      errors.push({ field: 'global', path: 'global', message: 'Global configuration is missing or invalid', code: 'INVALID_GLOBAL' });
    } else {
      // logLevel の検証
      if (config.global.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.global.logLevel)) {
        errors.push({ field: 'logLevel', path: 'global.logLevel', message: 'Log level must be one of: debug, info, warn, error', code: 'INVALID_LOG_LEVEL' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
