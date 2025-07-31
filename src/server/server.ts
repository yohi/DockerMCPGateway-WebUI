import express from 'express';
import path from 'path';
import cors from 'cors';
import routes from './routes';

/**
 * サーバーアプリケーションの初期化とルートハンドラーのセットアップ
 */
const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイル
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
}

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API ルーティング
app.use('/api', routes);

// CORS設定を追加
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// フォールバックルート (React SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });
}

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
