'use client';

import { useState } from 'react';
import Layout from '../../components/Layout';
import ServerList from '../../components/ServerList';
import ServerConfigEditor from '../../components/ServerConfigEditor';
import ServerTester from '../../components/ServerTester';

export default function DashboardPage() {
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const handleSelectServer = (serverId: string) => {
        setSelectedServerId(serverId);
        setActiveTab('overview');
    };

    return (
        <Layout>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <ServerList onSelectServer={handleSelectServer} />
                </div>

                {selectedServerId ? (
                    <div className="lg:col-span-3">
                        <div className="bg-white shadow rounded-lg">
                            <div className="border-b">
                                <nav className="flex">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`py-4 px-6 ${activeTab === 'overview'
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        概要
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('config')}
                                        className={`py-4 px-6 ${activeTab === 'config'
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        設定
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('test')}
                                        className={`py-4 px-6 ${activeTab === 'test'
                                            ? 'border-b-2 border-blue-500 text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        テスト
                                    </button>
                                </nav>
                            </div>

                            <div className="p-4">
                                {activeTab === 'overview' && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-4">サーバー概要</h2>
                                        <p>サーバー ID: {selectedServerId}</p>
                                        {/* 実際のアプリケーションではサーバーの詳細情報を表示します */}
                                    </div>
                                )}

                                {activeTab === 'config' && (
                                    <ServerConfigEditor serverId={selectedServerId} />
                                )}

                                {activeTab === 'test' && (
                                    <ServerTester serverId={selectedServerId} />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-3 flex items-center justify-center bg-white shadow rounded-lg p-8">
                        <div className="text-center text-gray-500">
                            <p className="mb-2">サーバーを選択してください</p>
                            <p className="text-sm">左のリストからサーバーを選択すると詳細が表示されます</p>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
