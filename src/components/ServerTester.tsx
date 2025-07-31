import { useState } from 'react';

type ServerTesterProps = {
    serverId: string;
};

export default function ServerTester({ serverId }: ServerTesterProps) {
    const [testType, setTestType] = useState('basic');
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const handleRunTest = () => {
        setIsRunning(true);
        setResults([`テスト開始: ${testType}...`]);

        // モックテスト - 実際のアプリケーションではAPI呼び出しになります
        setTimeout(() => {
            setResults(prev => [...prev, '接続テスト成功']);
        }, 500);

        setTimeout(() => {
            setResults(prev => [...prev, 'プロトコルバージョンチェック成功']);
        }, 1000);

        setTimeout(() => {
            setResults(prev => [...prev, 'API応答時間: 120ms']);
        }, 1500);

        setTimeout(() => {
            setResults(prev => [...prev, `サーバーID ${serverId} のテストが完了しました`]);
            setIsRunning(false);
        }, 2000);
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
                            <div key={index}>{"> "}{result}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
