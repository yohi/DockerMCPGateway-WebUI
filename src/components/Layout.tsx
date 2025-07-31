import { ReactNode } from 'react';
import Link from 'next/link';

type LayoutProps = {
    children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* サイドバーナビゲーション */}
            <div className="w-64 bg-white shadow-md">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">MCP Gateway</h2>
                </div>
                <nav className="p-4">
                    <ul>
                        <li className="mb-2">
                            <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-100">ダッシュボード</Link>
                        </li>
                        <li className="mb-2">
                            <Link href="/servers" className="block p-2 rounded hover:bg-gray-100">サーバー</Link>
                        </li>
                        <li className="mb-2">
                            <Link href="/catalog" className="block p-2 rounded hover:bg-gray-100">カタログ</Link>
                        </li>
                        <li className="mb-2">
                            <Link href="/settings" className="block p-2 rounded hover:bg-gray-100">設定</Link>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* メインコンテンツ */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm">
                    <div className="p-4">
                        <h1 className="text-xl font-semibold">Docker MCP Gateway Web UI</h1>
                    </div>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
