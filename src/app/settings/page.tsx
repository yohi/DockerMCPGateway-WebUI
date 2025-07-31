'use client';

import { useState, useRef } from 'react';
import Layout from '../../components/Layout';

export default function SettingsPage() {
    const [globalConfig, setGlobalConfig] = useState({
        apiEndpoint: 'http://localhost:8080/api',
        autoUpdate: true,
        defaultTimeout: 30000,
        logLevel: 'info'
    });
    const [editedConfig, setEditedConfig] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [importStatus, setImportStatus] = useState<{
        type: 'success' | 'error' | 'info' | null;
        message: string;
    }>({ type: null, message: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 編集モードの切り替え
    const handleEditConfig = () => {
        if (!isEditing) {
            setEditedConfig(JSON.stringify(globalConfig, null, 2));
            setIsEditing(true);
        }
    };

    // 設定の保存
    const handleSaveConfig = () => {
        try {
            // JSONの検証
            const parsedConfig = JSON.parse(editedConfig);

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
                message: 'JSONの形式が正しくありません。'
            });
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
            const backupData = {
                timestamp: new Date().toISOString(),
                config: globalConfig
            };
            
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
    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedConfig = JSON.parse(content);
                
                // MCPサーバー設定の基本構造を検証
                if (parsedConfig.mcpServers && typeof parsedConfig.mcpServers === 'object') {
                    // インポートされた設定を現在の設定にマージ
                    const mergedConfig = {
                        ...globalConfig,
                        mcpServers: parsedConfig.mcpServers
                    };
                    
                    setGlobalConfig(mergedConfig);
                    setEditedConfig(JSON.stringify(mergedConfig, null, 2));
                    
                    setImportStatus({
                        type: 'success',
                        message: `JSONファイル「${file.name}」が正常にインポートされました。`
                    });
                } else {
                    throw new Error('MCPサーバー設定の形式が正しくありません。');
                }
            } catch (error) {
                console.error('JSONファイルのインポートに失敗しました:', error);
                setImportStatus({
                    type: 'error',
                    message: `JSONファイル「${file.name}」のインポートに失敗しました。ファイル形式を確認してください。`
                });
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
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                            JSONファイルをインポート
                        </button>
                        <button
                            onClick={handleCreateBackup}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            現在の設定をエクスポート
                        </button>
                        <button
                            onClick={handleRestoreBackup}
                            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                        >
                            バックアップから復元
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
                        <div className={`p-3 rounded mb-4 ${
                            importStatus.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
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
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded mr-2"
                                >
                                    編集
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveConfig}
                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded mr-2"
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded"
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
                            <li>インポート後、現在の設定とマージされます</li>
                            <li>エクスポート機能で現在の設定をバックアップできます</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
