import React, { useState, useRef, useEffect } from 'react';
import { LogEntry } from '../types/models';
import { useServerLogs } from '../utils/hooks';

interface LogViewerProps {
    serverId: string;
}

/**
 * ログビューワーコンポーネント
 */
export default function LogViewer({ serverId }: LogViewerProps) {
    const { logs, clearLogs } = useServerLogs(serverId);
    const [logLevel, setLogLevel] = useState<string>('all');
    const [autoScroll, setAutoScroll] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const logContainerRef = useRef<HTMLDivElement>(null);

    // ログレベルでフィルタリングされたログ
    const filteredLogs = logs.filter((log) => {
        if (logLevel !== 'all' && log.level !== logLevel) {
            return false;
        }

        if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        return true;
    });

    // 自動スクロール
    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);

    /**
     * ログレベルに応じたスタイルを取得
     * @param level ログレベル
     */
    const getLogLevelStyle = (level: string) => {
        switch (level) {
            case 'debug':
                return 'text-gray-500';
            case 'info':
                return 'text-blue-600';
            case 'warn':
                return 'text-yellow-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-500';
        }
    };

    /**
     * ログをエクスポート
     */
    const handleExportLogs = () => {
        const logText = filteredLogs
            .map((log) => `${new Date(log.timestamp).toISOString()} [${log.level}] ${log.message}`)
            .join('\n');

        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${serverId}-logs-${new Date().toISOString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Server Logs</h2>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={clearLogs}
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={handleExportLogs}
                    >
                        Export
                    </button>
                </div>
            </div>

            {/* コントロールパネル */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center">
                    <label htmlFor="log-level" className="block text-sm font-medium text-gray-700 mr-2">
                        Level:
                    </label>
                    <select
                        id="log-level"
                        className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        value={logLevel}
                        onChange={(e) => setLogLevel(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="debug">Debug</option>
                        <option value="info">Info</option>
                        <option value="warn">Warning</option>
                        <option value="error">Error</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mr-2">
                        Search:
                    </label>
                    <input
                        type="text"
                        id="search"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Filter logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        id="auto-scroll"
                        name="auto-scroll"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={autoScroll}
                        onChange={(e) => setAutoScroll(e.target.checked)}
                    />
                    <label htmlFor="auto-scroll" className="ml-2 block text-sm text-gray-900">
                        Auto-scroll
                    </label>
                </div>
            </div>

            {/* ログ表示エリア */}
            <div
                ref={logContainerRef}
                className="bg-gray-900 text-white font-mono text-sm p-4 rounded-md h-96 overflow-y-auto"
            >
                {filteredLogs.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No logs available</div>
                ) : (
                    <div>
                        {filteredLogs.map((log, index) => (
                            <div key={index} className="pb-1">
                                <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
                                <span className={getLogLevelStyle(log.level)}>[{log.level.toUpperCase()}]</span>{' '}
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: searchTerm
                                            ? log.message.replace(
                                                new RegExp(searchTerm, 'gi'),
                                                (match) => `<span class="bg-yellow-300 text-black">${match}</span>`
                                            )
                                            : log.message,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
