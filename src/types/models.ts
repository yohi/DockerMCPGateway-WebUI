/**
 * MCPサーバー関連の型定義
 */

/**
 * MCPツール
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, any>;
  tags?: string[];
}

/**
 * MCPリソース
 */
export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCPプロンプト
 */
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Record<string, any>[];
}

/**
 * MCPサーバー機能
 */
export interface MCPCapabilities {
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
  lastUpdated?: Date;
}

/**
 * MCPサーバー
 */
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  enabled: boolean;
  config: MCPServerConfig;
  lastUpdated: Date;
  healthCheck?: HealthCheckResult;
  capabilities?: MCPCapabilities;
}

/**
 * MCPサーバー設定
 */
export interface MCPServerConfig {
  image?: string;
  ports?: PortMapping[];
  environment?: Record<string, string>;
  volumes?: VolumeMapping[];
  command?: string;
  args?: string[];
  resources?: ResourceLimits;
  // URL-based configuration
  url?: string;
  headers?: Record<string, string>;
  // Environment variables
  env?: Record<string, string>;
}

/**
 * カタログサーバー
 */
export interface CatalogServer {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  version: string;
  tags: string[];
  documentation?: string;
  // mcp-remote用のフィールド
  command?: string;
  args?: string[];
  remoteUrl?: string;
}

/**
 * ポートマッピング
 */
export interface PortMapping {
  host: number;
  container: number;
  protocol?: 'tcp' | 'udp';
}

/**
 * ボリュームマッピング
 */
export interface VolumeMapping {
  host: string;
  container: string;
  mode?: 'ro' | 'rw';
}

/**
 * リソース制限
 */
export interface ResourceLimits {
  memory?: string;
  cpu?: string;
  pids?: number;
}

/**
 * ヘルスチェック結果
 */
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  message?: string;
  responseTime?: number;
}

/**
 * テスト結果
 */
export interface TestResult {
  testType: 'connection' | 'tools' | 'resources';
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * ログエントリ
 */
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  serverId?: string;
  metadata?: Record<string, any>;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}

/**
 * バリデーションエラー
 */
export interface ValidationError {
  field: string;
  path: string;
  message: string;
  code: string;
}

/**
 * Gateway設定
 */
export interface GatewayConfig {
  version?: string;
  apiEndpoint?: string;
  autoUpdate?: boolean;
  defaultTimeout?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  maxLogSize?: string;
  healthCheckInterval?: number;
  mcpServers?: Record<string, MCPServerConfig>;
  servers?: Record<string, MCPServerConfig>;
  global?: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    maxLogSize: string;
    healthCheckInterval: number;
  };
}
