'use client';

import { useState } from 'react';
import Layout from '../../components/Layout';
import ServerList from '../../components/ServerList';
import ServerConfigEditor from '../../components/ServerConfigEditor';
import ServerTester from '../../components/ServerTester';

export default function ServersPage() {
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">サーバー管理</h1>
                <p className="text-gray-600">
                    MCPサーバーの設定、テスト、ログ表示を行います。
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <ServerList onSelectServer={setSelectedServerId} />
                </div>

                {selectedServerId ? (
                    <div className="lg:col-span-3">
                        <div className="grid grid-cols-1 gap-6">
                            <ServerConfigEditor serverId={selectedServerId} />
                            <ServerTester serverId={selectedServerId} />
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
