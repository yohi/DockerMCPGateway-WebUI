import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ServerConfigEditor from '../ServerConfigEditor';
import { useServerConfig, useUpdateServerConfig } from '@/utils/hooks';

// モックの設定
jest.mock('@/utils/hooks', () => ({
    useServerConfig: jest.fn(),
    useUpdateServerConfig: jest.fn()
}));

describe('ServerConfigEditor Component', () => {
    // テスト用のモックデータ
    const mockConfig = {
        name: 'Test Server',
        port: 8080,
        enabled: true,
        options: {
            logging: true,
            verbose: false
        }
    };

    const updateConfigMock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // useServerConfigフックのモック実装
        (useServerConfig as jest.Mock).mockReturnValue({
            data: mockConfig,
            isLoading: false,
            error: null
        });

        // useUpdateServerConfigフックのモック実装
        (useUpdateServerConfig as jest.Mock).mockReturnValue({
            mutateAsync: updateConfigMock,
            isPending: false,
            isError: false,
            error: null
        });
    });

    test('設定エディタが正常に表示される', () => {
        render(<ServerConfigEditor serverId="server1" />);

        // JSONエディタに設定が表示されていることを確認
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue(JSON.stringify(mockConfig, null, 2));
    });

    test('設定を編集して保存できる', async () => {
        render(<ServerConfigEditor serverId="server1" />);

        // テキストエリアを取得して内容を編集
        const textarea = screen.getByRole('textbox');
        const newConfig = { ...mockConfig, port: 9000 };
        fireEvent.change(textarea, { target: { value: JSON.stringify(newConfig, null, 2) } });

        // 保存ボタンをクリック
        const saveButton = screen.getByText('保存');
        fireEvent.click(saveButton);

        // 更新関数が正しいパラメータで呼ばれることを確認
        await waitFor(() => {
            expect(updateConfigMock).toHaveBeenCalledWith({
                serverId: 'server1',
                config: newConfig
            });
        });
    });

    test('無効なJSONの場合にエラーが表示される', async () => {
        render(<ServerConfigEditor serverId="server1" />);

        // テキストエリアに無効なJSONを入力
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '{ invalid json }' } });

        // 保存ボタンをクリック
        const saveButton = screen.getByText('保存');
        fireEvent.click(saveButton);

        // エラーメッセージが表示されることを確認
        await waitFor(() => {
            expect(screen.getByText(/JSONの形式が正しくありません/i)).toBeInTheDocument();
        });

        // 更新関数が呼ばれないことを確認
        expect(updateConfigMock).not.toHaveBeenCalled();
    });

    test('読み込み中の状態が表示される', () => {
        // ローディング状態をモック
        (useServerConfig as jest.Mock).mockReturnValue({
            data: null,
            isLoading: true,
            error: null
        });

        render(<ServerConfigEditor serverId="server1" />);

        expect(screen.getByText(/読み込み中/i)).toBeInTheDocument();
    });

    test('エラー状態が表示される', () => {
        // エラー状態をモック
        (useServerConfig as jest.Mock).mockReturnValue({
            data: null,
            isLoading: false,
            error: new Error('Test error')
        });

        render(<ServerConfigEditor serverId="server1" />);

        expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
    });

    test('キャンセルボタンをクリックすると編集内容が破棄される', () => {
        render(<ServerConfigEditor serverId="server1" />);

        // テキストエリアを取得して内容を編集
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: '{ "name": "Changed" }' } });

        // キャンセルボタンをクリック
        const cancelButton = screen.getByText('キャンセル');
        fireEvent.click(cancelButton);

        // 元の設定に戻ることを確認
        expect(textarea).toHaveValue(JSON.stringify(mockConfig, null, 2));
    });
});
