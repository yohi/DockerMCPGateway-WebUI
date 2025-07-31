'use client';

import Layout from '../../components/Layout';
import ServerCatalog from '../../components/ServerCatalog';

export default function CatalogPage() {
    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">サーバーカタログ</h1>
                <p className="text-gray-600">
                    利用可能なMCPサーバーを検索してインストールできます。
                </p>
            </div>

            <ServerCatalog />
        </Layout>
    );
}
