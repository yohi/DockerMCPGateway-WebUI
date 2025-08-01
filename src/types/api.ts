import { MCPServer, MCPServerConfig, TestResult, CatalogServer } from './models';

/**
 * サーバー一覧取得API レスポンス
 */
export interface GetServersResponse {
  success: boolean;
  servers: MCPServer[];
  status: 'success' | 'error';
}

/**
 * サーバー有効/無効切り替えAPI リクエスト
 */
export interface ToggleServerRequest {
  enabled: boolean;
}

/**
 * 設定更新API リクエスト
 */
export interface UpdateConfigRequest {
  config: MCPServerConfig;
}

/**
 * サーバーテストAPI リクエスト
 */
export interface TestServerRequest {
  testType: 'connection' | 'tools' | 'resources';
  parameters?: any;
}

/**
 * サーバーテストAPI レスポンス
 */
export interface TestServerResponse {
  success: boolean;
  results: TestResult[];
  errors?: string[];
}

/**
 * カタログ統計情報
 */
export interface CatalogStats {
  total: number;
  official: number;
  officialIntegrations: number;
  community: number;
  custom: number;
}

/**
 * カタログ取得API レスポンス
 */
export interface GetCatalogResponse {
  success: boolean;
  servers: CatalogServer[];
  categories: string[];
  subcategories?: { [key: string]: string[] };
  stats?: CatalogStats;
  error?: any;
}

/**
 * サーバーインストールAPI リクエスト
 */
export interface InstallServerRequest {
  serverId: string;
  config?: MCPServerConfig;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    suggestions?: string[];
  };
}
