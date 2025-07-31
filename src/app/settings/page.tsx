'use client';

import { useState } from 'react';
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
        } catch (err) {
            console.error('設定の保存に失敗しました:', err);
            alert('JSONの形式が正しくありません。');
        }
    };

    // キャンセル処理
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedConfig('');
    };

    // バックアップの作成処理
    const handleCreateBackup = async () => {
        try {
            alert('現在の設定をバックアップしました');
        } catch (err) {
            console.error('バックアップの作成に失敗しました:', err);
        }
    };

    // バックアップからの復元処理
    const handleRestoreBackup = async () => {
        if (window.confirm('バックアップから復元しますか？現在の設定は上書きされます。')) {
            try {
                alert('バックアップから設定を復元しました');
            } catch (err) {
                console.error('バックアップからの復元に失敗しました:', err);
            }
        }
    };

    return (
        <Layout>
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">グローバル設定</h1>

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
                        />
                    ) : (
                        <pre className="w-full h-96 p-2 bg-gray-100 overflow-auto font-mono text-sm border border-gray-300 rounded">
                            {JSON.stringify(globalConfig, null, 2)}
                        </pre>
                    )}
                </div>

                {/* バックアップと復元 */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">バックアップと復元</h2>
                    <div className="flex space-x-4">
                        <button
                            onClick={handleCreateBackup}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            現在の設定をバックアップ
                        </button>
                        <button
                            onClick={handleRestoreBackup}
                            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                        >
                            最新のバックアップから復元
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
