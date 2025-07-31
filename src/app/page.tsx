'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // ホームページからダッシュボードにリダイレクト
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <h1 className="text-2xl font-semibold mb-2">Docker MCP Gateway Web GUI</h1>
                <p className="text-gray-500">読み込み中...</p>
            </div>
        </div>
    );
}
