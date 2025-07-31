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
  constructor(configPath: string = process.env.CONFIG_PATH || './config.json') {
    this.configPath = configPath;
  }

  /**
   * 設定を読み込む
   */
  async loadConfig(): Promise<GatewayConfig> {
    // Node.js環境でのみファイルシステムにアクセス
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs/promises');
        const configData = await fs.readFile(this.configPath, 'utf-8');
        this.config = JSON.parse(configData);
        return this.config;
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
        this.config = await response.json();
        return this.config;
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
        const fs = await import('fs/promises');
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

    return this.config.servers[serverId] || null;
  }

  /**
   * 設定をバックアップする
   */
  async backupConfig(): Promise<string> {
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const backupPath = path.join(path.dirname(this.configPath), `backup-${Date.now()}.json`);

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
        const fs = await import('fs/promises');
        const backupData = await fs.readFile(backupPath, 'utf-8');
        const restoredConfig = JSON.parse(backupData);

        // 設定検証
        this.validateConfig(restoredConfig);

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

    // servers オブジェクトの検証
    if (!config.servers || typeof config.servers !== 'object') {
      errors.push({ field: 'servers', path: 'servers', message: 'Servers configuration is missing or invalid', code: 'INVALID_SERVERS' });
    } else {
      // 各サーバー設定の検証
      Object.entries(config.servers).forEach(([serverId, serverConfig]: [string, any]) => {
        // image の検証
        if (!serverConfig.image) {
          errors.push({ field: 'image', path: `servers.${serverId}.image`, message: 'Server image is required', code: 'MISSING_IMAGE' });
        }

        // ports の検証
        if (serverConfig.ports && !Array.isArray(serverConfig.ports)) {
          errors.push({ field: 'ports', path: `servers.${serverId}.ports`, message: 'Ports must be an array', code: 'INVALID_PORTS' });
        }

        // volumes の検証
        if (serverConfig.volumes && !Array.isArray(serverConfig.volumes)) {
          errors.push({ field: 'volumes', path: `servers.${serverId}.volumes`, message: 'Volumes must be an array', code: 'INVALID_VOLUMES' });
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
