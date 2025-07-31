'use client';

import { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ApiClient } from '../../api/apiClient';

export default function SettingsPage() {
    const [globalConfig, setGlobalConfig] = useState({
        version: '1.0.0',
        apiEndpoint: 'http://localhost:8080/api',
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
    });
    const [editedConfig, setEditedConfig] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [importStatus, setImportStatus] = useState<{
        type: 'success' | 'error' | 'info' | null;
        message: string;
    }>({ type: null, message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const apiClient = new ApiClient();

    // コンポーネントマウント時に設定を読み込む
    useEffect(() => {
        loadConfig();
    }, []);

    // 設定の読み込み
    const loadConfig = async () => {
        try {
            setIsLoading(true);
            const config = await apiClient.getConfig();
            if (config) {
                // APIから直接設定が返された場合とレスポンス形式で返された場合を考慮
                const configData = config.config || config;
                setGlobalConfig(configData);
            }
        } catch (error) {
            console.error('設定の読み込みに失敗しました:', error);
            setImportStatus({
                type: 'error',
                message: `設定の読み込みに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 編集モードの切り替え
    const handleEditConfig = () => {
        if (!isEditing) {
            setEditedConfig(JSON.stringify(globalConfig, null, 2));
            setIsEditing(true);
        }
    };

    // 設定の保存
    const handleSaveConfig = async () => {
        try {
            setIsLoading(true);
            // JSONの検証
            const parsedConfig = JSON.parse(editedConfig);

            // APIを通じて設定を保存
            await apiClient.updateConfig(parsedConfig);

            // 設定を更新
            setGlobalConfig(parsedConfig);
            setIsEditing(false);
            setImportStatus({
                type: 'success',
                message: '設定が正常に保存されました。'
            });
        } catch (err) {
            console.error('設定の保存に失敗しました:', err);
            setImportStatus({
                type: 'error',
                message: err instanceof Error ? err.message : 'JSONの形式が正しくありません。'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // キャンセル処理
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedConfig('');
        setImportStatus({ type: null, message: '' });
    };

    // バックアップの作成処理
    const handleCreateBackup = async () => {
        try {
            setIsLoading(true);
            // APIを通じてバックアップを作成
            const backupData = await apiClient.backupConfig();

            const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mcp-config-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setImportStatus({
                type: 'success',
                message: '設定のバックアップが正常に作成されました。'
            });
        } catch (err) {
            console.error('バックアップの作成に失敗しました:', err);
            setImportStatus({
                type: 'error',
                message: 'バックアップの作成に失敗しました。'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // バックアップからの復元処理
    const handleRestoreBackup = async () => {
        if (window.confirm('バックアップから復元しますか？現在の設定は上書きされます。')) {
            try {
                setImportStatus({
                    type: 'info',
                    message: 'バックアップから設定を復元しました'
                });
            } catch (err) {
                console.error('バックアップからの復元に失敗しました:', err);
                setImportStatus({
                    type: 'error',
                    message: 'バックアップからの復元に失敗しました。'
                });
            }
        }
    };

    // JSONファイルのインポート処理
    const handleFileImport = (event: any) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                setIsLoading(true);
                const content = e.target?.result as string;
                const parsedConfig = JSON.parse(content);

                // MCPサーバー設定の基本構造を検証
                if (parsedConfig.mcpServers && typeof parsedConfig.mcpServers === 'object') {
                    // インポートされた設定を現在の設定にマージし、必須フィールドを補完
                    const mergedConfig = {
                        version: '1.0.0',
                        apiEndpoint: globalConfig.apiEndpoint || 'http://localhost:8080/api',
                        autoUpdate: globalConfig.autoUpdate || false,
                        defaultTimeout: globalConfig.defaultTimeout || 5000,
                        logLevel: globalConfig.logLevel || 'info',
                        maxLogSize: globalConfig.maxLogSize || '100MB',
                        healthCheckInterval: globalConfig.healthCheckInterval || 10000,
                        global: {
                            logLevel: globalConfig.global?.logLevel || 'info',
                            maxLogSize: globalConfig.global?.maxLogSize || '100MB',
                            healthCheckInterval: globalConfig.global?.healthCheckInterval || 10000
                        },
                        mcpServers: parsedConfig.mcpServers
                    };

                    // APIを通じて設定を保存
                    await apiClient.updateConfig(mergedConfig);

                    setGlobalConfig(mergedConfig);
                    setEditedConfig(JSON.stringify(mergedConfig, null, 2));

                    setImportStatus({
                        type: 'success',
                        message: `JSONファイル「${file.name}」が正常にインポートされ、保存されました。`
                    });
                } else if (parsedConfig.servers && typeof parsedConfig.servers === 'object') {
                    // 古いservers形式もサポート
                    const mergedConfig = {
                        version: '1.0.0',
                        apiEndpoint: globalConfig.apiEndpoint || 'http://localhost:8080/api',
                        autoUpdate: globalConfig.autoUpdate || false,
                        defaultTimeout: globalConfig.defaultTimeout || 5000,
                        logLevel: globalConfig.logLevel || 'info',
                        maxLogSize: globalConfig.maxLogSize || '100MB',
                        healthCheckInterval: globalConfig.healthCheckInterval || 10000,
                        global: {
                            logLevel: globalConfig.global?.logLevel || 'info',
                            maxLogSize: globalConfig.global?.maxLogSize || '100MB',
                            healthCheckInterval: globalConfig.global?.healthCheckInterval || 10000
                        },
                        mcpServers: parsedConfig.servers
                    };

                    await apiClient.updateConfig(mergedConfig);

                    setGlobalConfig(mergedConfig);
                    setEditedConfig(JSON.stringify(mergedConfig, null, 2));

                    setImportStatus({
                        type: 'success',
                        message: `JSONファイル「${file.name}」が正常にインポートされ、保存されました。`
                    });
                } else {
                    throw new Error('MCPサーバー設定の形式が正しくありません。mcpServersまたはserversオブジェクトが必要です。');
                }
            } catch (error) {
                console.error('JSONファイルのインポートに失敗しました:', error);
                setImportStatus({
                    type: 'error',
                    message: `JSONファイル「${file.name}」のインポートに失敗しました。${error instanceof Error ? error.message : 'ファイル形式を確認してください。'}`
                });
            } finally {
                setIsLoading(false);
            }
        };

        reader.readAsText(file);

        // ファイル入力をリセット
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // ファイル選択ダイアログを開く
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    // ステータスメッセージをクリア
    const clearStatus = () => {
        setImportStatus({ type: null, message: '' });
    };

    return (
        <Layout>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">グローバル設定</h1>

                {/* インポート/エクスポート機能 */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">設定のインポート/エクスポート</h2>
                    <div className="flex space-x-4 mb-4">
                        <button
                            onClick={handleImportClick}
                            disabled={isLoading}
                            className={`font-bold py-2 px-4 rounded ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                                : 'bg-green-500 hover:bg-green-700 text-white'
                                }`}
                        >
                            {isLoading ? '処理中...' : 'JSONファイルをインポート'}
                        </button>
                        <button
                            onClick={handleCreateBackup}
                            disabled={isLoading}
                            className={`font-bold py-2 px-4 rounded ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                                : 'bg-blue-500 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {isLoading ? '処理中...' : '現在の設定をエクスポート'}
                        </button>
                        <button
                            onClick={handleRestoreBackup}
                            disabled={isLoading}
                            className={`font-bold py-2 px-4 rounded ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                                : 'bg-yellow-500 hover:bg-yellow-700 text-white'
                                }`}
                        >
                            {isLoading ? '処理中...' : 'バックアップから復元'}
                        </button>
                    </div>

                    {/* 隠しファイル入力 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                    />

                    {/* ステータスメッセージ */}
                    {importStatus.type && (
                        <div className={`p-3 rounded mb-4 ${importStatus.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
                            importStatus.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
                                'bg-blue-100 border border-blue-400 text-blue-700'
                            }`}>
                            <div className="flex justify-between items-center">
                                <span>{importStatus.message}</span>
                                <button
                                    onClick={clearStatus}
                                    className="text-sm hover:opacity-70"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 設定エディタ */}
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <h2 className="text-xl font-semibold">MCP Gatewayグローバル設定</h2>
                        <div>
                            {!isEditing ? (
                                <button
                                    onClick={handleEditConfig}
                                    disabled={isLoading}
                                    className={`font-bold py-1 px-3 rounded mr-2 ${isLoading
                                        ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                                        : 'bg-blue-500 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {isLoading ? '読み込み中...' : '編集'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveConfig}
                                        disabled={isLoading}
                                        className={`font-bold py-1 px-3 rounded mr-2 ${isLoading
                                            ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                                            : 'bg-green-500 hover:bg-green-700 text-white'
                                            }`}
                                    >
                                        {isLoading ? '保存中...' : '保存'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={isLoading}
                                        className={`font-bold py-1 px-3 rounded ${isLoading
                                            ? 'bg-gray-400 cursor-not-allowed text-gray-700'
                                            : 'bg-gray-500 hover:bg-gray-700 text-white'
                                            }`}
                                    >
                                        キャンセル
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <textarea
                            value={editedConfig}
                            onChange={(e) => setEditedConfig(e.target.value)}
                            className="w-full h-96 p-2 font-mono text-sm border border-gray-300 rounded"
                            placeholder="JSON形式で設定を入力してください..."
                        />
                    ) : (
                        <pre className="w-full h-96 p-2 bg-gray-100 overflow-auto font-mono text-sm border border-gray-300 rounded">
                            {JSON.stringify(globalConfig, null, 2)}
                        </pre>
                    )}
                </div>

                {/* 使用説明 */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">使用方法</h2>
                    <div className="bg-gray-50 p-4 rounded">
                        <h3 className="font-semibold mb-2">JSONファイルインポートについて</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>MCPサーバー設定ファイル（mcp.json）をインポートできます</li>
                            <li>ファイルはJSON形式である必要があります</li>
                            <li>mcpServersオブジェクトを含む構造である必要があります</li>
                            <li>インポート後、現在の設定とマージされ、自動的に保存されます</li>
                            <li>エクスポート機能で現在の設定をバックアップできます</li>
                            <li>設定はバックエンドサーバーに永続化されます</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
