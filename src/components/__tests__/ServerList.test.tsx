import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServerList from '../ServerList';
import { useServers, useToggleServer } from '@/utils/hooks';
import { MCPServer } from '@/types/models';

// モックの設定
jest.mock('@/utils/hooks', () => ({
    useServers: jest.fn(),
    useToggleServer: jest.fn()
}));

describe('ServerList Component', () => {
    // テスト用のモックデータ
    const mockServers: MCPServer[] = [
        {
            id: 'server1',
            name: 'Test Server 1',
            status: 'running',
            enabled: true,
            type: 'standard',
            version: '1.0.0',
            url: 'http://localhost:8001',
            configPath: '/config/server1.json'
        },
        {
            id: 'server2',
            name: 'Test Server 2',
            status: 'stopped',
            enabled: false,
            type: 'custom',
            version: '2.0.0',
            url: 'http://localhost:8002',
            configPath: '/config/server2.json'
        }
    ];

    const toggleServerMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // useServersフックのモック実装
        (useServers as jest.Mock).mockReturnValue({
            data: mockServers,
            isLoading: false,
            error: null
        });

        // useToggleServerフックのモック実装
        (useToggleServer as jest.Mock).mockReturnValue({
            mutateAsync: toggleServerMock,
            isPending: false
        });
    });

    test('サーバーリストが正常に表示される', () => {
        render(<ServerList onSelectServer={jest.fn()} />);

        expect(screen.getByText('Test Server 1')).toBeInTheDocument();
        expect(screen.getByText('Test Server 2')).toBeInTheDocument();

        // ステータスバッジの確認
        const runningBadge = screen.getByText('running');
        expect(runningBadge).toBeInTheDocument();
        expect(runningBadge).toHaveClass('bg-green-500'); // または適切なクラス名

        const stoppedBadge = screen.getByText('stopped');
        expect(stoppedBadge).toBeInTheDocument();
        expect(stoppedBadge).toHaveClass('bg-red-500'); // または適切なクラス名
    });

    test('サーバー選択時にonSelectServer関数が呼ばれる', () => {
        const selectServerMock = jest.fn();
        render(<ServerList onSelectServer={selectServerMock} />);

        // サーバー項目をクリック
        fireEvent.click(screen.getByText('Test Server 1'));

        // コールバックが正しいサーバーIDで呼ばれることを確認
        expect(selectServerMock).toHaveBeenCalledWith('server1');
    });

    test('トグルボタンクリック時にサーバーの有効/無効が切り替わる', async () => {
        render(<ServerList onSelectServer={jest.fn()} />);

        // 最初のサーバーのトグルボタンをクリック
        const toggleButtons = screen.getAllByRole('switch');
        fireEvent.click(toggleButtons[0]);

        // トグル関数が正しいパラメータで呼ばれることを確認
        await waitFor(() => {
            expect(toggleServerMock).toHaveBeenCalledWith({
                serverId: 'server1',
                enabled: false // 元の状態がtrueなので、falseに切り替える
            });
        });
    });

    test('読み込み中の状態が表示される', () => {
        // ローディング状態をモック
        (useServers as jest.Mock).mockReturnValue({
            data: null,
            isLoading: true,
            error: null
        });

        render(<ServerList onSelectServer={jest.fn()} />);

        expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
    });

    test('エラー状態が表示される', () => {
        // エラー状態をモック
        (useServers as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: new Error('Test error')
        });

        render(<ServerList onSelectServer={jest.fn()} />);

        expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
    });
});
