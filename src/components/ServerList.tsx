import { useState, useEffect } from 'react';
import { ApiClient } from '../api/apiClient';
import { MCPServer } from '../types/models';

type ServerListProps = {
    onSelectServer: (serverId: string) => void;
};

export default function ServerList({ onSelectServer }: ServerListProps) {
    const [servers, setServers] = useState<MCPServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const apiClient = new ApiClient();

    // サーバー一覧を取得
    useEffect(() => {
        const fetchServers = async () => {
            try {
                setLoading(true);
                const response = await apiClient.getServers();
                if (response.success && response.servers) {
                    setServers(response.servers);
                } else {
                    setError('サーバー一覧の取得に失敗しました');
                    // エラー時はモックデータを使用
                    setServers([
                        {
                            id: 'server1',
                            name: 'MCP Server 1',
                            description: 'Test server 1',
                            version: '1.0.0',
                            status: 'running',
                            enabled: true,
                            config: { image: 'mcp-server-1' },
                            lastUpdated: new Date()
                        },
                        {
                            id: 'server2',
                            name: 'MCP Server 2',
                            description: 'Test server 2',
                            version: '1.0.0',
                            status: 'stopped',
                            enabled: false,
                            config: { image: 'mcp-server-2' },
                            lastUpdated: new Date()
                        }
                    ]);
                }
            } catch (err) {
                console.error('サーバー一覧取得エラー:', err);
                setError('サーバーとの通信中にエラーが発生しました');
                // エラー時はモックデータを使用
                setServers([
                    {
                        id: 'server1',
                        name: 'MCP Server 1',
                        description: 'Test server 1',
                        version: '1.0.0',
                        status: 'running',
                        enabled: true,
                        config: { image: 'mcp-server-1' },
                        lastUpdated: new Date()
                    },
                    {
                        id: 'server2',
                        name: 'MCP Server 2',
                        description: 'Test server 2',
                        version: '1.0.0',
                        status: 'stopped',
                        enabled: false,
                        config: { image: 'mcp-server-2' },
                        lastUpdated: new Date()
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchServers();
    }, []);

    return (
        <div className="bg-white shadow rounded-lg">
            <h2 className="text-lg font-medium p-4 border-b">サーバーリスト</h2>

            {loading && (
                <div className="p-4 text-center text-gray-500">
                    読み込み中...
                </div>
            )}

            {error && (
                <div className="p-4 text-center text-red-500">
                    {error}
                </div>
            )}

            <ul className="divide-y divide-gray-200">
                {servers.map(server => (
                    <li
                        key={server.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => onSelectServer(server.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium">{server.name}</h3>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${server.status === 'running' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                        }`}
                                >
                                    {server.status}
                                </span>
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
