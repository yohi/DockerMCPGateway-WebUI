import { useState, useEffect } from 'react';
import { ApiClient } from '../api/apiClient';

type ServerConfigEditorProps = {
    serverId: string;
};

export default function ServerConfigEditor({ serverId }: ServerConfigEditorProps) {
    const [config, setConfig] = useState('');
    const [originalConfig, setOriginalConfig] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const apiClient = new ApiClient();

    useEffect(() => {
        const fetchServerConfig = async () => {
            if (!serverId) return;

            try {
                setLoading(true);
                setError(null);
                const response = await apiClient.getServers();

                if (response.success && response.servers) {
                    const server = response.servers.find(s => s.id === serverId);
                    if (server) {
                        const configText = JSON.stringify(server.config, null, 2);
                        setConfig(configText);
                        setOriginalConfig(configText);
                    } else {
                        setError(`サーバー ${serverId} が見つかりません`);
                    }
                } else {
                    setError('サーバー設定の取得に失敗しました');
                }
            } catch (err) {
                console.error('設定取得エラー:', err);
                setError('サーバーとの通信中にエラーが発生しました');
            } finally {
                setLoading(false);
            }
        };

        fetchServerConfig();
    }, [serverId]);

    const handleEditConfig = () => {
        setIsEditing(true);
    };

    const handleSaveConfig = async () => {
        try {
            // JSONの検証
            const parsedConfig = JSON.parse(config);
            setLoading(true);
            setError(null);

            const response = await apiClient.updateServerConfig(serverId, parsedConfig);
            if (response.success) {
                setIsEditing(false);
                setOriginalConfig(config);
            } else {
                setError('設定の保存に失敗しました');
            }
        } catch (error) {
            setError('JSONの形式が正しくありません。');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setConfig(originalConfig);
        setError(null);
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">サーバー設定 - {serverId}</h2>
                {!isEditing ? (
                    <button
                        onClick={handleEditConfig}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                    >
                        編集
                    </button>
                ) : (
                    <div className="space-x-2">
                        <button
                            onClick={handleSaveConfig}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                        >
                            保存
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
                        >
                            キャンセル
                        </button>
                    </div>
                )}
            </div>

            {loading && (
                <div className="p-4 text-center text-gray-500">
                    読み込み中...
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
                    {error}
                </div>
            )}

            {!loading && (
                isEditing ? (
                    <textarea
                        value={config}
                        onChange={(e) => setConfig(e.target.value)}
                        className="w-full h-80 p-2 font-mono text-sm border border-gray-300 rounded"
                        placeholder="JSON設定を入力してください..."
                    />
                ) : (
                    <pre className="w-full h-80 p-2 bg-gray-50 overflow-auto font-mono text-sm border border-gray-300 rounded">
                        {config || 'サーバーを選択してください'}
                    </pre>
                )
            )}
        </div>
    );
}
