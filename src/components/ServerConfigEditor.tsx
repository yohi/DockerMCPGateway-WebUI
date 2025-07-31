import { useState, useEffect } from 'react';

type ServerConfigEditorProps = {
    serverId: string;
};

export default function ServerConfigEditor({ serverId }: ServerConfigEditorProps) {
    const [config, setConfig] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // モックデータ
    const mockConfig = {
        name: 'MCP Server',
        port: 8080,
        enabled: true,
        options: {
            logging: true,
            verbose: false
        }
    };

    useEffect(() => {
        // 実際のアプリケーションでは、サーバーから設定を取得します
        setConfig(JSON.stringify(mockConfig, null, 2));
    }, [serverId]);

    const handleEditConfig = () => {
        setIsEditing(true);
    };

    const handleSaveConfig = () => {
        try {
            // JSONの検証
            JSON.parse(config);
            setIsEditing(false);
            // ここで実際のAPIを呼び出して設定を保存します
        } catch (error) {
            alert('JSONの形式が正しくありません。');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // 元の設定を復元
        setConfig(JSON.stringify(mockConfig, null, 2));
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">サーバー設定</h2>
                {!isEditing ? (
                    <button
                        onClick={handleEditConfig}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        編集
                    </button>
                ) : (
                    <div className="space-x-2">
                        <button
                            onClick={handleSaveConfig}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                            保存
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                        >
                            キャンセル
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <textarea
                    value={config}
                    onChange={(e) => setConfig(e.target.value)}
                    className="w-full h-80 p-2 font-mono text-sm border border-gray-300 rounded"
                />
            ) : (
                <pre className="w-full h-80 p-2 bg-gray-50 overflow-auto font-mono text-sm border border-gray-300 rounded">
                    {config}
                </pre>
            )}
        </div>
    );
}
