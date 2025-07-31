# Docker MCP Gateway Web GUI

Docker MCP Gatewayを管理するためのWebインターフェース。MCP（マルチコントローラープロトコル）サーバーの有効化/無効化、設定管理、テスト、ログ監視などを提供します。

**注意**: このアプリケーションは完全にDocker環境で動作します。詳細なインストールと使用方法については [Dockerガイド](DOCKER_GUIDE.md) を参照してください。

## 機能

- MCP サーバーの一覧表示と状態監視
- サーバーの有効化/無効化
- JSON形式の設定ファイル編集
- サーバーのテスト実行と結果表示
- リアルタイムログ表示
- サーバーカタログからの新規サーバー追加
  - Model Context Protocol 公式サーバーが利用可能
- グローバル設定の管理とバックアップ/復元

## 技術スタック

### フロントエンド
- React 18 (TypeScript)
- Next.js 14 (App Router)
- Tailwind CSS
- React Query
- Socket.io Client

### バックエンド
- Node.js 20 LTS
- Express.js
- Socket.io
- JSON Schema Validation

### インフラ
- Docker
- Docker Compose

## セットアップ方法

### Dockerによる実行（推奨）

```bash
# リポジトリのクローン
git clone https://github.com/yourorg/docker-mcp-web-gui.git
cd docker-mcp-web-gui

# 起動スクリプトを使用して起動する
# 本番環境
./start.sh

# 開発環境
./start.sh dev

# 手動で起動する場合
# イメージのビルドと起動
docker compose build
docker compose up -d

# ログの表示
docker compose logs -f

# コンテナの停止
docker compose down
```

### 開発環境での各コンテナの管理

```bash
# 開発環境用にコンテナをビルドと起動（ホットリロード対応）
./start.sh dev

# または手動で実行する場合
docker compose -f compose.yaml -f compose.dev.yaml build
docker compose -f compose.yaml -f compose.dev.yaml up -d

# フロントエンドのみ再起動
docker compose -f compose.yaml -f compose.dev.yaml restart mcp-web-gui

# バックエンドのみ再起動
docker compose -f compose.yaml -f compose.dev.yaml restart mcp-backend

# ログの確認
docker compose -f compose.yaml -f compose.dev.yaml logs -f

# 特定サービスのログのみ表示
docker compose -f compose.yaml -f compose.dev.yaml logs -f mcp-web-gui
```

### 各コンテナのShellへのアクセス

```bash
# Web UIコンテナのShellにアクセス
docker compose exec mcp-web-gui /bin/sh

# GatewayコンテナのShellにアクセス
docker compose exec mcp-gateway /bin/sh
```

## 環境変数

| 変数名              | 説明                           | デフォルト値              |
| ------------------- | ------------------------------ | ------------------------- |
| PORT                | フロントエンドサーバーのポート | 5310                      |
| MCP_GATEWAY_API_URL | MCP Gateway APIのURL           | http://localhost:8080/api |
| CONFIG_PATH         | 設定ファイルの保存パス         | ./config                  |

## コンテナ構成

| コンテナ名  | 説明                             | ポート | 強制終了時の振る舞い |
| ----------- | -------------------------------- | ------ | -------------------- |
| mcp-web-gui | フロントエンドコンテナ(Next.js)  | 5310   | 再起動する           |
| mcp-backend | バックエンドAPIコンテナ(Express) | 5311   | 再起動する           |
| mcp-gateway | MCP Gatewayコンテナ              | 18080  | 再起動する           |

## 開発者向け情報

### プロジェクト構造

```
docker-mcp-web-gui/
├── src/
│   ├── app/             # Next.js App Router ページ
│   ├── components/      # React コンポーネント
│   ├── api/             # フロントエンド API クライアント
│   ├── server/          # Express.js バックエンド
│   ├── types/           # TypeScript 型定義
│   └── utils/           # ユーティリティ関数・フック
├── public/              # 静的ファイル
├── config/              # 設定ファイル (マウントポイント)
└── compose.yaml         # Docker Compose 設定
```

### API エンドポイント

#### MCP サーバー管理
- `GET /api/servers` - サーバー一覧の取得
- `PUT /api/servers/:id/toggle` - サーバーの有効/無効の切り替え
- `GET /api/servers/:id/config` - サーバー設定の取得
- `PUT /api/servers/:id/config` - サーバー設定の更新

#### テスト機能
- `POST /api/servers/:id/test` - サーバーのテスト実行

#### カタログ機能
- `GET /api/catalog` - サーバーカタログの取得
- `POST /api/catalog/install` - カタログからのサーバーインストール

#### グローバル設定
- `GET /api/config` - グローバル設定の取得
- `PUT /api/config` - グローバル設定の更新
- `POST /api/config/backup` - 設定のバックアップ
- `POST /api/config/restore` - バックアップからの復元

## ライセンス

[MITライセンス](LICENSE)
