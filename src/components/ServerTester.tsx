import { useState } from 'react';

type ServerTesterProps = {
    serverId: string;
};

interface TestResult {
    success: boolean;
    message: string;
    timestamp: Date;
    details?: any;
}

export default function ServerTester({ serverId }: ServerTesterProps) {
    const [testType, setTestType] = useState('basic');
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const addResult = (message: string, success = true) => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = success ? '✓' : '✗';
        setResults(prev => [...prev, `> [${timestamp}] ${prefix} ${message}`]);
    };

    const handleRunTest = async () => {
        setIsRunning(true);
        setResults([`> テスト開始: ${testType} - サーバー: ${serverId}`]);

        try {
            // 1. 基本接続テスト
            addResult('基本接続テスト開始...');

            // サーバー情報取得テスト
            try {
                const serverResponse = await fetch(`/api/servers/${serverId}`);
                if (serverResponse.ok) {
                    const serverData = await serverResponse.json();
                    addResult(`サーバー情報取得成功 - ステータス: ${serverData.status}`);
                } else {
                    addResult('サーバー情報取得失敗', false);
                }
            } catch (error) {
                addResult('サーバー情報取得エラー', false);
            }

            // 2. Capabilities取得テスト
            addResult('機能情報取得テスト開始...');
            const startTime = Date.now();

            try {
                const capabilitiesResponse = await fetch(`/api/servers/${serverId}/capabilities`);
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                if (capabilitiesResponse.ok) {
                    const data = await capabilitiesResponse.json();
                    if (data.success) {
                        addResult(`機能情報取得成功 (${responseTime}ms)`);
                        if (data.capabilities) {
                            addResult(`利用可能なツール: ${data.capabilities.tools?.length || 0}個`);
                            addResult(`利用可能なリソース: ${data.capabilities.resources?.length || 0}個`);
                            addResult(`利用可能なプロンプト: ${data.capabilities.prompts?.length || 0}個`);
                        }
                    } else {
                        addResult(`機能情報取得失敗: ${data.error}`, false);
                        if (data.details) {
                            addResult(`詳細: ${data.details}`, false);
                        }
                        if (data.code) {
                            addResult(`エラーコード: ${data.code}`, false);
                        }
                    }
                } else {
                    const errorData = await capabilitiesResponse.json().catch(() => null);
                    addResult(`機能情報取得エラー (${capabilitiesResponse.status}): ${errorData?.error || 'Unknown error'}`, false);
                }
            } catch (error) {
                addResult(`機能情報取得例外: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
            }

            // 3. フルテストの場合はより詳細なテストを実行
            if (testType === 'full') {
                addResult('詳細テスト開始...');

                // サーバーリスト取得テスト
                try {
                    const listResponse = await fetch('/api/servers');
                    if (listResponse.ok) {
                        const serverList = await listResponse.json();
                        const targetServer = serverList.servers?.find((s: any) => s.id === serverId);
                        if (targetServer) {
                            addResult(`サーバーリストで確認完了 - 有効: ${targetServer.enabled}`);
                        } else {
                            addResult('サーバーリストに見つかりません', false);
                        }
                    }
                } catch (error) {
                    addResult('サーバーリスト確認エラー', false);
                }
            }

            // 4. パフォーマンステストの場合
            if (testType === 'performance') {
                addResult('パフォーマンステスト実行中...');

                const performanceResults: number[] = [];
                for (let i = 0; i < 5; i++) {
                    try {
                        const start = Date.now();
                        const resp = await fetch(`/api/servers/${serverId}/capabilities`);
                        const end = Date.now();
                        performanceResults.push(end - start);
                        addResult(`テスト ${i + 1}/5 完了: ${end - start}ms`);
                    } catch (error) {
                        addResult(`テスト ${i + 1}/5 失敗`, false);
                    }
                }

                if (performanceResults.length > 0) {
                    const avgTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
                    addResult(`平均応答時間: ${avgTime.toFixed(1)}ms`);
                    addResult(`最速: ${Math.min(...performanceResults)}ms, 最遅: ${Math.max(...performanceResults)}ms`);
                }
            }

            // 5. 接続テストの場合
            if (testType === 'connection') {
                addResult('接続テスト専用実行中...');

                // 複数回の接続テスト
                let successCount = 0;
                const totalTests = 3;

                for (let i = 0; i < totalTests; i++) {
                    try {
                        const resp = await fetch(`/api/servers/${serverId}/capabilities`);
                        if (resp.ok) {
                            const data = await resp.json();
                            if (data.success) {
                                successCount++;
                                addResult(`接続テスト ${i + 1}/${totalTests}: 成功`);
                            } else {
                                addResult(`接続テスト ${i + 1}/${totalTests}: 失敗 - ${data.error}`, false);
                            }
                        } else {
                            addResult(`接続テスト ${i + 1}/${totalTests}: HTTP ${resp.status}`, false);
                        }
                    } catch (error) {
                        addResult(`接続テスト ${i + 1}/${totalTests}: 例外`, false);
                    }

                    // 少し待機
                    if (i < totalTests - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                addResult(`接続安定性: ${successCount}/${totalTests} (${(successCount / totalTests * 100).toFixed(1)}%)`);
            }

            addResult(`テスト完了 - サーバー: ${serverId}`);

        } catch (error) {
            addResult(`テスト実行エラー: ${error instanceof Error ? error.message : 'Unknown error'}`, false);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">サーバーテスト</h2>

            <div className="mb-4">
                <label className="block mb-2">テストタイプ</label>
                <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                >
                    <option value="basic">基本テスト</option>
                    <option value="performance">パフォーマンステスト</option>
                    <option value="connection">接続テスト</option>
                    <option value="full">フルテスト</option>
                </select>
            </div>

            <button
                onClick={handleRunTest}
                disabled={isRunning}
                className={`w-full py-2 rounded font-medium ${isRunning
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
            >
                {isRunning ? 'テスト実行中...' : 'テスト実行'}
            </button>

            {results.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-medium mb-2">テスト結果</h3>
                    <div className="bg-black text-green-400 p-3 rounded h-40 overflow-auto font-mono text-sm">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className={result.includes('✗') ? 'text-red-400' : 'text-green-400'}
                            >
                                {result}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
