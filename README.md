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
- **Cursor MCP統合対応** - CursorからDockerMCPGatewayへの直接接続

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

## Cursor MCP 統合

このDockerMCPGatewayは、CursorエディタのMCP（Model Context Protocol）機能と統合できます。

### 接続設定

DockerMCPGatewayは **HTTP transport** モードで動作し、Cursorから直接接続可能です：

```yaml
# compose.yaml での設定
command: ["--port", "8080", "--transport", "http"]
ports:
  - "18080:8080"  # ホストの18080ポートでアクセス可能
```

### Cursor用設定ファイル

プロジェクトには複数のCursor MCP設定ファイルが含まれています：

#### 🎯 自動サービス管理設定 (`cursor-mcp-auto.json`) - **推奨**
```json
{
  "description": "Docker MCP Gateway - 自動サービス管理版（個別設定不要）",
  "mcpServers": {
    "docker-mcp-gateway-auto": {
      "description": "MCP Gateway with automatic service discovery - no manual configuration needed",
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "mcp-gateway",
        "/docker-mcp",
        "gateway",
        "run",
        "--transport",
        "stdio"
      ],
      "env": {
        "DOCKER_HOST": "unix:///run/user/1000/docker.sock",
        "MCP_GATEWAY_CONTAINER": "mcp-gateway"
      }
    }
  }
}
```

**特徴**:
- ✅ **サービス個別設定不要** - MCPサービスを手動で設定ファイルに記載する必要がありません
- ✅ **自動サービス検出** - 利用可能な全てのMCPサービスが自動的に検出されます
- ✅ **動的管理** - 新しいサービスが追加されても設定変更不要
- ✅ **メンテナンスフリー** - カタログとレジストリによる自動管理

#### シンプル設定 (`cursor-mcp-simple.json`)
```json
{
  "mcpServers": {
    "docker-mcp-gateway": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "mcp-gateway",
        "/docker-mcp",
        "gateway",
        "--stdio"
      ]
    }
  }
}
```

#### 完全版設定 (`cursor-mcp-complete.json`)
HTTP transport と STDIO transport の両方のオプションを含む包括的な設定です。

### 使用方法

1. **DockerMCPGatewayを起動**:
   ```bash
   docker compose up -d
   ```

2. **接続確認**:
   - Web UI: http://localhost:5310
   - Gateway API: http://localhost:18080

3. **Cursorに設定**:
   - **推奨**: `cursor-mcp-auto.json` の内容をCursorのMCP設定に追加（自動サービス管理）
   - 代替案: `cursor-mcp-simple.json` または `cursor-mcp-complete.json` を使用

### トランスポート設定

| Transport   | 説明                       | 推奨用途            |
| ----------- | -------------------------- | ------------------- |
| `http`      | HTTP形式での通信           | Cursor統合、Web API |
| `websocket` | WebSocket形式での通信      | リアルタイム通信    |
| `streaming` | ストリーミング形式での通信 | 高性能なデータ転送  |

**注意**: Cursor統合では `http` transport が最も安定しています。

### 自動サービス管理機能

`cursor-mcp-auto.json` を使用することで、以下の自動管理機能が利用できます：

#### 🔄 自動サービス検出
- **Docker公式カタログ**: https://desktop.docker.com/mcp/catalog/v2/catalog.yaml
- **ローカルレジストリ**: `./gateway-config/registry.yaml`
- **インストール済みサービス**: コンテナ内で利用可能な全サービス

#### 📋 利用可能なサービス例
自動検出により以下のサービスが利用可能になります：
- `fetch` - HTTP/API リクエスト機能
- `filesystem` - ファイルシステム操作
- `github` - GitHub API連携
- `brave` - Brave検索エンジン
- `wikipedia-mcp` - Wikipedia検索
- `duckduckgo` - DuckDuckGo検索
- `docker` - Docker操作
- その他カタログ内の全サービス

#### ⚙️ 高度な設定オプション
追加の自動管理機能が必要な場合は、以下のオプションを追加できます：

```json
{
  "command": "docker",
  "args": [
    "exec", "-i", "mcp-gateway", "/docker-mcp", "gateway", "run",
    "--transport", "stdio",
    "--watch",              // 設定変更の自動監視
    "--long-lived",         // 長時間実行コンテナ
    "--registry", "/app/config/registry.yaml"  // カスタムレジストリ
  ]
}
```

## セットアップ方法

### Dockerによる実行（推奨）

```bash
# リポジトリのクローン
git clone https://github.com/yourorg/docker-mcp-web-gui.git
cd docker-mcp-web-gui

# Option 1: Makefileを使用（推奨）
make help           # 利用可能なコマンドを表示
make build          # 本番用コンテナをビルド
make up             # 本番環境を起動
make dev-build      # 開発用コンテナをビルド
make dev-up         # 開発環境を起動

# Option 2: 専用スクリプトを使用
./dev/tools/scripts/docker.sh help    # ヘルプ表示
./dev/tools/scripts/docker.sh build   # 本番用ビルド
./dev/tools/scripts/docker.sh up      # 本番環境起動
./dev/tools/scripts/docker.sh dev-up  # 開発環境起動

# Option 3: 直接Docker Composeを使用
docker compose build        # 本番用ビルド
docker compose up -d        # 本番環境起動
docker compose logs -f      # ログ表示
docker compose down         # 停止
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

## アクセスポイント

| サービス       | URL                           | 説明                            |
| -------------- | ----------------------------- | ------------------------------- |
| Web UI         | http://localhost:5310         | DockerMCPGateway管理画面        |
| Backend API    | http://localhost:5311/api     | バックエンドAPIエンドポイント   |
| MCP Gateway    | http://localhost:18080        | MCP Gateway API（Cursor接続用） |
| Gateway Health | http://localhost:18080/health | ヘルスチェックエンドポイント    |

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
├── gateway-config/      # MCP Gateway設定ファイル
├── gateway-logs/        # MCP Gatewayログファイル
├── cursor-mcp-auto.json      # 自動サービス管理設定（推奨）
├── cursor-mcp-*.json         # その他Cursor MCP設定ファイル
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

## トラブルシューティング

### Cursor MCP接続の問題

1. **コンテナが起動していることを確認**:
   ```bash
   docker compose ps
   ```

2. **MCP Gatewayの接続テスト**:
   ```bash
   curl -I http://localhost:18080
   ```

3. **transport設定の確認**:
   ```bash
   docker compose logs mcp-gateway | grep transport
   ```

4. **設定ファイルの確認**:
   - **推奨**: `cursor-mcp-auto.json` から開始（自動サービス管理）
   - 軽量版: `cursor-mcp-simple.json` を試す
   - 問題があれば `cursor-mcp-complete.json` を試す

5. **自動サービス検出の確認**:
   ```bash
   # 利用可能なサービス一覧を確認
   docker exec mcp-gateway /docker-mcp gateway run --dry-run

   # カタログの確認
   curl -s https://desktop.docker.com/mcp/catalog/v2/catalog.yaml | head -20
   ```

### 一般的な問題

- **ポート競合**: 5310, 5311, 18080ポートが他のサービスで使用されていないか確認
- **Docker権限**: `/run/user/1000/docker.sock` へのアクセス権限を確認
- **設定ファイル**: `./config`, `./gateway-config`, `./gateway-logs` ディレクトリの権限を確認

## ライセンス

[MITライセンス](LICENSE)
