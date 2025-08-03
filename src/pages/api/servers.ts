import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    // 実際のバックエンドサーバーへプロキシ
    const backendUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:5311';

    // API_BASE_URLに既に/apiが含まれている場合は重複を避ける
    const apiUrl = backendUrl.endsWith('/api') ? `${backendUrl}/servers` : `${backendUrl}/api/servers`;

    // タイムアウト制御
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒のタイムアウト

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `バックエンドサーバーエラー: ${response.status} ${response.statusText}`,
        code: 'BACKEND_ERROR'
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Backend connection failed:', error);

    // エラーの種類に応じて適切なレスポンスを返す
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(408).json({
        success: false,
        error: 'バックエンドサーバーからの応答がタイムアウトしました',
        code: 'TIMEOUT',
        details: 'サーバーの応答が10秒を超えました'
      });
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      // さらに詳細なエラー分析
      const errorMessage = error.message;
      const causedBy = (error as any).cause;

      let details = 'バックエンドサーバーが起動していません。';

      if (causedBy && causedBy.code === 'ECONNREFUSED') {
        details = 'バックエンドサーバー (localhost:3001) への接続が拒否されました。サーバーが起動していることを確認してください。';
      } else if (errorMessage.includes('ENOTFOUND')) {
        details = 'バックエンドサーバーのホスト名を解決できません。';
      } else if (errorMessage.includes('ETIMEDOUT')) {
        details = 'バックエンドサーバーへの接続がタイムアウトしました。';
      }

      res.status(503).json({
        success: false,
        error: 'バックエンドサーバーに接続できません',
        code: 'BACKEND_UNAVAILABLE',
        details
      });
    } else {
      res.status(500).json({
        success: false,
        error: '内部サーバーエラーが発生しました',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : '不明なエラー'
      });
    }
  }
}
