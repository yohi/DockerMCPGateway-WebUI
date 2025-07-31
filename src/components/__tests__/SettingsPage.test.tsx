import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsPage from '../../app/settings/page';

// Mock the Layout component
jest.mock('../../components/Layout', () => {
    return function MockLayout({ children }: { children: React.ReactNode }) {
        return <div data-testid="layout">{children}</div>;
    };
});

describe('SettingsPage', () => {
    test('renders settings page with import/export functionality', () => {
        render(<SettingsPage />);
        
        expect(screen.getByText('グローバル設定')).toBeInTheDocument();
        expect(screen.getByText('設定のインポート/エクスポート')).toBeInTheDocument();
        expect(screen.getByText('JSONファイルをインポート')).toBeInTheDocument();
        expect(screen.getByText('現在の設定をエクスポート')).toBeInTheDocument();
        expect(screen.getByText('バックアップから復元')).toBeInTheDocument();
    });

    test('shows usage instructions', () => {
        render(<SettingsPage />);
        
        expect(screen.getByText('使用方法')).toBeInTheDocument();
        expect(screen.getByText('JSONファイルインポートについて')).toBeInTheDocument();
        expect(screen.getByText(/MCPサーバー設定ファイル（mcp.json）をインポートできます/)).toBeInTheDocument();
        expect(screen.getByText(/ファイルはJSON形式である必要があります/)).toBeInTheDocument();
        expect(screen.getByText(/mcpServersオブジェクトを含む構造である必要があります/)).toBeInTheDocument();
    });

    test('renders configuration editor', () => {
        render(<SettingsPage />);
        
        expect(screen.getByText('MCP Gatewayグローバル設定')).toBeInTheDocument();
        expect(screen.getByText('編集')).toBeInTheDocument();
    });

    test('renders file input for import', () => {
        render(<SettingsPage />);
        
        // Check if file input exists (hidden)
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput).toHaveAttribute('accept', '.json');
    });
}); 
