import { useState, useEffect } from 'react';
import { ApiClient } from '../api/apiClient';
import { MCPServer, MCPCapabilities } from '../types/models';
import Tooltip from './Tooltip';

type ServerListProps = {
    onSelectServer: (serverId: string) => void;
};

export default function ServerList({ onSelectServer }: ServerListProps) {
    const [servers, setServers] = useState<MCPServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());
    const [capabilitiesErrors, setCapabilitiesErrors] = useState<Map<string, string>>(new Map());
    const [loadingCapabilities, setLoadingCapabilities] = useState<Set<string>>(new Set());
    const [connectionStatus, setConnectionStatus] = useState<Map<string, 'healthy' | 'unhealthy' | 'checking' | 'unknown'>>(new Map());
    const [lastHealthCheck, setLastHealthCheck] = useState<Map<string, Date>>(new Map());
    const apiClient = new ApiClient();

    // サーバーの詳細表示を切り替え
    const toggleServerExpansion = (serverId: string) => {
        const newExpanded = new Set(expandedServers);
        if (newExpanded.has(serverId)) {
            newExpanded.delete(serverId);
        } else {
            newExpanded.add(serverId);
            // エラー状態をクリア
            const newErrors = new Map(capabilitiesErrors);
            newErrors.delete(serverId);
            setCapabilitiesErrors(newErrors);

            // サーバーの機能情報を取得（まだ取得していない場合）
            const server = servers.find(s => s.id === serverId);
            if (server && !server.capabilities) {
                fetchServerCapabilities(serverId);
            }
        }
        setExpandedServers(newExpanded);
    };

    // サーバーの機能情報を取得
    const fetchServerCapabilities = async (serverId: string) => {
        try {
            // ローディング状態を設定
            setLoadingCapabilities(prev => new Set(prev).add(serverId));

            const response = await apiClient.getServerCapabilities(serverId);

            if (response.success && response.capabilities) {
                setServers(prevServers =>
                    prevServers.map(server =>
                        server.id === serverId
                            ? { ...server, capabilities: response.capabilities }
                            : server
                    )
                );

                // エラー状態をクリア
                const newErrors = new Map(capabilitiesErrors);
                newErrors.delete(serverId);
                setCapabilitiesErrors(newErrors);
            } else {
                // APIは成功したが機能情報が取得できなかった場合
                const newErrors = new Map(capabilitiesErrors);
                newErrors.set(serverId, (response as any).details || response.error || '機能情報の取得に失敗しました');
                setCapabilitiesErrors(newErrors);
            }
        } catch (error) {
            console.error(`サーバー ${serverId} の機能情報取得エラー:`, error);

            // エラー状態を設定
            const newErrors = new Map(capabilitiesErrors);
            let errorMessage = 'MCPサーバーとの通信に失敗しました';

            if (error instanceof Error) {
                if (error.message.includes('localhost:3001') && error.message.includes('接続が拒否されました')) {
                    errorMessage = 'バックエンドサーバー (localhost:3001) が起動していません。サーバーを起動してください。';
                } else if (error.message.includes('ネットワーク接続エラー')) {
                    errorMessage = 'バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。';
                } else if (error.message.includes('タイムアウト')) {
                    errorMessage = '通信がタイムアウトしました。サーバーの応答が遅すぎます。';
                } else if (error.message.includes('Backend server is not available')) {
                    errorMessage = 'バックエンドサーバーが利用できません。サーバーを起動してください。';
                } else if (error.message.includes('HTTP 503')) {
                    errorMessage = 'MCPサーバーに接続できません。サーバーが正しく設定されているか確認してください。';
                } else if (error.message.includes('HTTP 404')) {
                    errorMessage = 'サーバーが見つかりません。サーバーIDが正しいか確認してください。';
                } else {
                    errorMessage = `エラー: ${error.message}`;
                }
            }

            newErrors.set(serverId, errorMessage);
            setCapabilitiesErrors(newErrors);
        } finally {
            // ローディング状態を解除
            setLoadingCapabilities(prev => {
                const newSet = new Set(prev);
                newSet.delete(serverId);
                return newSet;
            });
        }
    };

    // サーバーのヘルスチェックを実行
    const checkServerHealth = async (serverId: string) => {
        try {
            setConnectionStatus(prev => new Map(prev).set(serverId, 'checking'));

            const response = await fetch(`/api/servers/${serverId}/health`);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.health) {
                    setConnectionStatus(prev => new Map(prev).set(serverId, data.health.status));
                    setLastHealthCheck(prev => new Map(prev).set(serverId, new Date()));
                } else {
                    setConnectionStatus(prev => new Map(prev).set(serverId, 'unhealthy'));
                }
            } else {
                setConnectionStatus(prev => new Map(prev).set(serverId, 'unhealthy'));
            }
        } catch (error) {
            console.error(`Health check failed for ${serverId}:`, error);
            setConnectionStatus(prev => new Map(prev).set(serverId, 'unhealthy'));
        }
    };

    // 全サーバーのヘルスチェックを実行
    const checkAllServersHealth = async () => {
        for (const server of servers) {
            if (server.enabled) {
                await checkServerHealth(server.id);
                // 連続リクエストを避けるため少し待機
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    };

    // サーバー一覧を取得
    useEffect(() => {
        fetchServers();
    }, []);

    // サーバー一覧取得後にヘルスチェックを実行
    useEffect(() => {
        if (servers.length > 0) {
            checkAllServersHealth();
        }
    }, [servers.length]);

    // サーバー一覧を取得する関数
    const fetchServers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getServers();
            if (response.success && response.servers) {
                setServers(response.servers);
            } else {
                setError('サーバー一覧の取得に失敗しました');
            }
        } catch (err) {
            console.error('サーバー一覧取得エラー:', err);

            let errorMessage = 'サーバーとの通信中にエラーが発生しました';

            if (err instanceof Error) {
                if (err.message.includes('localhost:3001') && err.message.includes('接続が拒否されました')) {
                    errorMessage = 'ネットワークエラー: バックエンドサーバー (localhost:3001) が起動していません。サーバーを起動してください。';
                } else if (err.message.includes('ネットワーク接続エラー')) {
                    errorMessage = 'ネットワークエラー: バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。';
                } else if (err.message.includes('タイムアウト')) {
                    errorMessage = 'タイムアウトエラー: サーバーの応答が遅すぎます。';
                } else if (err.message.includes('HTTP')) {
                    errorMessage = `サーバーエラー: ${err.message}`;
                } else {
                    errorMessage = `エラー: ${err.message}`;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg">
            <h2 className="text-lg font-medium p-4 border-b">サーバーリスト</h2>

            {loading && (
                <div className="p-4 text-center text-gray-500">
                    読み込み中...
                </div>
            )}

            {error && (
                <div className="p-4">
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-red-800">サーバー一覧の取得に失敗しました</h4>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchServers}
                            disabled={loading}
                            className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? '再試行中...' : '再試行'}
                        </button>
                    </div>
                </div>
            )}

            <ul className="divide-y divide-gray-200">
                {servers.map(server => (
                    <li key={server.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3
                                        className="font-medium cursor-pointer hover:text-blue-600"
                                        onClick={() => onSelectServer(server.id)}
                                    >
                                        {server.name}
                                    </h3>
                                    <button
                                        onClick={() => toggleServerExpansion(server.id)}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="詳細を表示/非表示"
                                    >
                                        <svg
                                            className={`w-4 h-4 transition-transform ${expandedServers.has(server.id) ? 'rotate-90' : ''}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{server.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${server.status === 'running' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                            }`}
                                    >
                                        {server.status}
                                    </span>
                                    {/* 実際の接続状態を表示 */}
                                    {server.enabled && (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-pointer ${connectionStatus.get(server.id) === 'healthy' ? 'bg-green-100 text-green-800' :
                                                connectionStatus.get(server.id) === 'unhealthy' ? 'bg-red-100 text-red-800' :
                                                    connectionStatus.get(server.id) === 'checking' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}
                                            onClick={() => checkServerHealth(server.id)}
                                            title={`クリックして接続状態を再チェック${lastHealthCheck.get(server.id) ? ` (最終確認: ${lastHealthCheck.get(server.id)?.toLocaleTimeString()})` : ''}`}
                                        >
                                            {connectionStatus.get(server.id) === 'healthy' ? '🟢 接続OK' :
                                                connectionStatus.get(server.id) === 'unhealthy' ? '🔴 接続NG' :
                                                    connectionStatus.get(server.id) === 'checking' ? '🟡 確認中' :
                                                        '⚪ 未確認'}
                                        </span>
                                    )}
                                    {server.config.command && (
                                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                            {server.config.command}
                                        </span>
                                    )}
                                    {server.config.url && (
                                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                            URL
                                        </span>
                                    )}
                                    {server.capabilities?.tools && server.capabilities.tools.length > 0 && (
                                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                            {server.capabilities.tools.length} ツール
                                        </span>
                                    )}
                                </div>

                                {/* 詳細情報の展開表示 */}
                                {expandedServers.has(server.id) && (
                                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                        {loadingCapabilities.has(server.id) ? (
                                            <div className="flex items-center space-x-2 text-gray-500">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                                <span className="text-sm">機能情報を取得中...</span>
                                            </div>
                                        ) : capabilitiesErrors.has(server.id) ? (
                                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                                                <div className="flex items-center">
                                                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-red-800">機能情報の取得に失敗しました</h4>
                                                        <p className="text-sm text-red-600 mt-1">{capabilitiesErrors.get(server.id)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => fetchServerCapabilities(server.id)}
                                                    className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
                                                >
                                                    再試行
                                                </button>
                                            </div>
                                        ) : server.capabilities ? (
                                            <div className="space-y-3">
                                                {/* ツール一覧 */}
                                                {server.capabilities.tools && server.capabilities.tools.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">利用可能なツール</h4>
                                                        <div className="space-y-1">
                                                            {server.capabilities.tools.map((tool, index) => (
                                                                <Tooltip
                                                                    key={index}
                                                                    content={tool.description || 'このツールの説明はありません'}
                                                                    maxWidth="max-w-md"
                                                                >
                                                                    <div className="bg-blue-50 p-2 rounded-md cursor-help hover:bg-blue-100 transition-colors">
                                                                        <div className="font-medium text-sm text-blue-800">{tool.name}</div>
                                                                        {tool.tags && tool.tags.length > 0 && (
                                                                            <div className="mt-1">
                                                                                {tool.tags.map((tag, tagIndex) => (
                                                                                    <span
                                                                                        key={tagIndex}
                                                                                        className="inline-block bg-blue-200 text-blue-700 text-xs px-1 py-0.5 rounded mr-1"
                                                                                    >
                                                                                        {tag}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Tooltip>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* リソース一覧 */}
                                                {server.capabilities.resources && server.capabilities.resources.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">利用可能なリソース</h4>
                                                        <div className="space-y-1">
                                                            {server.capabilities.resources.map((resource, index) => (
                                                                <Tooltip
                                                                    key={index}
                                                                    content={resource.description || `リソース: ${resource.uri}\nMIMEタイプ: ${resource.mimeType || '不明'}`}
                                                                    maxWidth="max-w-md"
                                                                >
                                                                    <div className="bg-purple-50 p-2 rounded-md cursor-help hover:bg-purple-100 transition-colors">
                                                                        <div className="font-medium text-sm text-purple-800">
                                                                            {resource.name || resource.uri}
                                                                        </div>
                                                                        <div className="text-xs text-purple-500 mt-1 font-mono truncate">{resource.uri}</div>
                                                                        {resource.mimeType && (
                                                                            <div className="text-xs text-purple-500 mt-1">{resource.mimeType}</div>
                                                                        )}
                                                                    </div>
                                                                </Tooltip>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* プロンプト一覧 */}
                                                {server.capabilities.prompts && server.capabilities.prompts.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700 mb-2">利用可能なプロンプト</h4>
                                                        <div className="space-y-1">
                                                            {server.capabilities.prompts.map((prompt, index) => (
                                                                <Tooltip
                                                                    key={index}
                                                                    content={prompt.description || `プロンプト: ${prompt.name}${prompt.arguments ? `\n引数: ${prompt.arguments.map(arg => `${arg.name}${arg.required ? ' (必須)' : ' (任意)'}`).join(', ')}` : ''}`}
                                                                    maxWidth="max-w-md"
                                                                >
                                                                    <div className="bg-yellow-50 p-2 rounded-md cursor-help hover:bg-yellow-100 transition-colors">
                                                                        <div className="font-medium text-sm text-yellow-800">{prompt.name}</div>
                                                                        {prompt.arguments && prompt.arguments.length > 0 && (
                                                                            <div className="mt-1">
                                                                                {prompt.arguments.slice(0, 3).map((arg, argIndex) => (
                                                                                    <span
                                                                                        key={argIndex}
                                                                                        className={`inline-block text-xs px-1 py-0.5 rounded mr-1 ${arg.required ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-100 text-yellow-700'}`}
                                                                                    >
                                                                                        {arg.name}{arg.required ? '*' : ''}
                                                                                    </span>
                                                                                ))}
                                                                                {prompt.arguments.length > 3 && (
                                                                                    <span className="text-xs text-yellow-600">
                                                                                        +{prompt.arguments.length - 3} more
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Tooltip>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                                <div className="flex items-center">
                                                    <svg className="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-700">機能情報が利用できません</h4>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {server.status === 'running'
                                                                ? 'サーバーは実行中ですが、機能情報を取得できませんでした。'
                                                                : 'サーバーが停止中のため、機能情報を取得できません。'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                {server.status === 'running' && (
                                                    <button
                                                        onClick={() => fetchServerCapabilities(server.id)}
                                                        className="mt-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded transition-colors"
                                                    >
                                                        機能情報を取得
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={server.enabled}
                                        role="switch"
                                        onChange={() => { }}
                                    />
                                    <span className={`relative inline-block w-10 h-5 rounded-full transition-colors ${server.enabled ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}>
                                        <span className={`absolute inset-0.5 w-4 h-4 rounded-full bg-white transition-transform ${server.enabled ? 'transform translate-x-5' : ''
                                            }`} />
                                    </span>
                                </label>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
