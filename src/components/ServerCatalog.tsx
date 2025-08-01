import { useState, useEffect } from 'react';
import { ApiClient } from '../api/apiClient';
import { CatalogServer } from '../types/models';
import { CatalogStats } from '../types/api';

export default function ServerCatalog() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [servers, setServers] = useState<CatalogServer[]>([]);
    const [categories, setCategories] = useState<string[]>(['all', 'official', 'official-integration', 'community', 'custom']);
    const [subcategories, setSubcategories] = useState<{ [key: string]: string[] }>({});
    const [stats, setStats] = useState<CatalogStats | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportForm, setShowImportForm] = useState(false);
    const [importConfig, setImportConfig] = useState('');
    const [newServer, setNewServer] = useState({
        id: '',
        name: '',
        description: '',
        category: 'custom',
        image: '',
        version: '1.0.0',
        tags: [] as string[],
        documentation: '',
        command: 'npx',
        args: ['-y', 'mcp-remote'],
        remoteUrl: ''
    });
    const [newTag, setNewTag] = useState('');
    const apiClient = new ApiClient();

    // モックデータ（フォールバック用）
    const mockCategories = ['all', 'official', 'official-integration', 'community', 'custom'];
    const mockServers: CatalogServer[] = [
        {
            id: 'mcp-basic',
            name: 'MCP Basic Server',
            category: 'official',
            description: '基本的なMCPサーバー。標準的なプロトコルをサポート。',
            version: '1.2.0',
            image: 'mcp-basic-server',
            tags: ['basic', 'standard', 'recommended']
        },
        {
            id: 'mcp-advanced',
            name: 'MCP Advanced Server',
            category: 'official',
            description: '拡張機能を搭載したMCPサーバー。高度な操作に対応。',
            version: '1.1.0',
            image: 'mcp-advanced-server',
            tags: ['advanced', 'extended']
        }
    ];

    // カタログからサーバーデータを取得
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                setLoading(true);
                setError(null);

                // APIからカタログを取得
                const response = await apiClient.getCatalog();
                if (response.success && response.servers) {
                    setServers(response.servers);
                    if (response.categories) {
                        setCategories(response.categories);
                    }
                    if (response.subcategories) {
                        setSubcategories(response.subcategories);
                    }
                    if (response.stats) {
                        setStats(response.stats);
                    }
                } else {
                    setError('カタログデータの取得に失敗しました');
                    setServers(mockServers);
                    setCategories(mockCategories);
                }
            } catch (err) {
                console.error('カタログ取得エラー:', err);
                setError('サーバーとの通信中にエラーが発生しました');
                setServers(mockServers);
                setCategories(mockCategories);
            } finally {
                setLoading(false);
            }
        };

        fetchCatalog();
    }, []);

    // フィルタリング
    const filteredServers = servers.filter(server =>
        (selectedCategory === 'all' || server.category === selectedCategory) &&
        (searchQuery === '' ||
            server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            server.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const handleInstall = async (serverId: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.installServer(serverId);
            if (response.success) {
                alert(`サーバー ${serverId} のインストールが完了しました。`);
            } else {
                setError(`サーバー ${serverId} のインストールに失敗しました`);
            }
        } catch (err) {
            console.error(`サーバー ${serverId} のインストールエラー:`, err);
            setError(`サーバー ${serverId} のインストール中にエラーが発生しました`);
        } finally {
            setLoading(false);
        }
    };

    // カスタムサーバー追加
    const handleAddCustomServer = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!newServer.id || !newServer.name || !newServer.image) {
                setError('必須項目（ID、名前、イメージ）を入力してください');
                return;
            }

            const response = await apiClient.addCustomServer(newServer);

            if (response.success) {
                setServers(prev => [...prev, response.server]);
                setNewServer({
                    id: '',
                    name: '',
                    description: '',
                    category: 'custom',
                    image: '',
                    version: '1.0.0',
                    tags: [],
                    documentation: '',
                    command: 'npx',
                    args: ['-y', 'mcp-remote'],
                    remoteUrl: ''
                });
                setShowAddForm(false);
                setError(null);
                alert('カスタムサーバーが追加されました');
            } else {
                setError(response.error?.message || 'サーバーの追加に失敗しました');
            }
        } catch (error) {
            console.error('Error adding custom server:', error);
            setError('サーバーの追加中にエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    // タグ追加
    const handleAddTag = () => {
        if (newTag.trim() && !newServer.tags.includes(newTag.trim())) {
            setNewServer(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag('');
        }
    };

    // タグ削除
    const handleRemoveTag = (tagToRemove: string) => {
        setNewServer(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    // カテゴリ表示名のマッピング
    const getCategoryDisplayName = (category: string) => {
        const categoryMap: { [key: string]: string } = {
            'all': 'すべて',
            'official': '公式サーバー',
            'official-integration': '公式インテグレーション',
            'community': 'コミュニティ',
            'custom': 'カスタム'
        };
        return categoryMap[category] || category;
    };

    return (
        <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-medium">MCP サーバーカタログ</h2>
                        <p className="text-gray-500 text-sm">利用可能なMCPサーバーを探す</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                        >
                            カスタムサーバー追加
                        </button>
                    </div>
                </div>

                {/* カスタムサーバー追加フォーム */}
                {showAddForm && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-md font-medium mb-4">カスタムサーバー追加</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    サーバーID *
                                </label>
                                <input
                                    type="text"
                                    value={newServer.id}
                                    onChange={(e) => setNewServer(prev => ({ ...prev, id: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="unique-server-id"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    サーバー名 *
                                </label>
                                <input
                                    type="text"
                                    value={newServer.name}
                                    onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="My Custom Server"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    説明
                                </label>
                                <textarea
                                    value={newServer.description}
                                    onChange={(e) => setNewServer(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    rows={3}
                                    placeholder="サーバーの説明を入力してください"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    イメージ *
                                </label>
                                <input
                                    type="text"
                                    value={newServer.image}
                                    onChange={(e) => setNewServer(prev => ({ ...prev, image: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="my-custom-server:latest"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    バージョン
                                </label>
                                <input
                                    type="text"
                                    value={newServer.version}
                                    onChange={(e) => setNewServer(prev => ({ ...prev, version: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="1.0.0"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    タグ
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                        className="flex-1 p-2 border border-gray-300 rounded"
                                        placeholder="タグを入力してEnter"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                        追加
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {newServer.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleAddCustomServer}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                            >
                                サーバーを追加
                            </button>
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="サーバーを検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                {error && (
                    <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="mt-2 text-center text-gray-500">
                        読み込み中...
                    </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 rounded text-sm ${selectedCategory === category
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                        >
                            {getCategoryDisplayName(category)}
                        </button>
                    ))}
                </div>
            </div>

            <ul className="divide-y divide-gray-200">
                {filteredServers.map(server => (
                    <li key={server.id} className="p-4">
                        <div className="flex justify-between">
                            <div>
                                <h3 className="text-lg font-medium">{server.name}</h3>
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-2">
                                    v{server.version}
                                </span>
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                    {getCategoryDisplayName(server.category)}
                                </span>
                                <p className="mt-1 text-gray-600">{server.description}</p>
                                <div className="mt-2">
                                    {server.tags.map((tag: string) => (
                                        <span key={tag} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mr-1">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <button
                                    onClick={() => handleInstall(server.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                                >
                                    インストール
                                </button>
                                {server.documentation && (
                                    <div className="text-xs text-center mt-2">
                                        <a
                                            href={server.documentation}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            ドキュメントを見る
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {!loading && !error && filteredServers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    条件に一致するサーバーが見つかりませんでした。
                </div>
            )}
        </div>
    );
}
