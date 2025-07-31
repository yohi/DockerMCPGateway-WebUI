import { ReactNode } from 'react';
import '../styles/globals.css';

export const metadata = {
    title: 'Docker MCP Gateway Web GUI',
    description: 'Web GUI for managing Docker MCP Gateway servers',
};

export default function RootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <html lang="ja">
            <body>
                {children}
            </body>
        </html>
    );
}
