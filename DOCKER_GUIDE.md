# Docker MCP Web GUIのインストールと使用方法

このドキュメントでは、Docker MCP Web GUIをDockerを使用して実行する方法について説明します。

## 必要要件

- Docker Engine (20.10.0以降)
- Docker Compose (2.0.0以降)
- Gitクライアント

## インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourorg/docker-mcp-web-gui.git
cd docker-mcp-web-gui
```

### 2. アプリケーションの起動

本リポジトリはすべてDockerコンテナとして実行されるように設定されています。起動スクリプトを使用して、開発環境または本番環境でアプリケーションを起動できます。

#### 本番環境で実行

```bash
./start.sh
```

#### 開発環境で実行（ホットリロード対応）

```bash
./start.sh dev
```

### 3. アクセス方法

アプリケーションが起動したら、以下のURLでアクセスできます：

- **Web UI**: http://localhost:5310 - DockerMCPGateway管理画面
- **バックエンドAPI**: http://localhost:5311/api - 内部APIエンドポイント
- **MCP Gateway API**: http://localhost:18080 - **Cursor MCP接続用エンドポイント**

### 4. Cursor MCP統合

DockerMCPGatewayは、CursorエディタのMCP機能と統合可能です：

#### 設定確認
```bash
# MCP Gatewayが正常に起動していることを確認
curl -I http://localhost:18080

# コンテナ状態の確認
docker compose ps
```

#### Cursor設定ファイル
プロジェクトには以下の設定ファイルが含まれています：
- `cursor-mcp-simple.json` - シンプルな設定（推奨）
- `cursor-mcp-complete.json` - 完全な設定オプション

#### 接続テスト
```bash
# MCP Gateway 接続テスト
curl -X POST -H "Content-Type: application/json" \
  -d '{"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' \
  http://localhost:18080/mcp
```

## コンテナ構成

Docker MCP Web GUIは以下の3つのコンテナで構成されています：

1. **mcp-web-gui**: フロントエンドUIを提供するNext.jsアプリケーション
2. **mcp-backend**: バックエンドAPIを提供するExpress.jsアプリケーション
3. **mcp-gateway**: MCP Gatewayサービス（docker/mcp-gateway:latest）

## Dockerコマンド集

### コンテナの状態確認

```bash
docker compose ps
```

### ログの確認

```bash
# すべてのログを表示
docker compose logs -f

# 特定のサービスのログを表示
docker compose logs -f mcp-web-gui
docker compose logs -f mcp-backend
docker compose logs -f mcp-gateway
```

### コンテナの再起動

```bash
# 特定のサービスを再起動
docker compose restart mcp-web-gui
docker compose restart mcp-backend
docker compose restart mcp-gateway

# すべてのサービスを再起動
docker compose restart
```

### コンテナの停止

```bash
docker compose down
```

### データの永続化

アプリケーションの設定やログは以下のディレクトリに保存されます：

- `./config`: MCP Web GUIの設定ファイル
- `./gateway-config`: MCP Gatewayの設定ファイル
- `./gateway-logs`: MCP Gatewayのログファイル

これらのディレクトリはDockerボリュームとしてマウントされ、コンテナが再起動しても保持されます。

## トラブルシューティング

### Cursor MCP接続の問題

#### 1. MCP Gateway接続確認
```bash
# MCP Gatewayの状態確認
docker compose logs mcp-gateway

# 接続テスト
curl -I http://localhost:18080
```

#### 2. Transport設定の確認
```bash
# 現在のtransport設定を確認
docker compose logs mcp-gateway | grep -i transport
```

#### 3. 設定ファイルのテスト
```bash
# シンプル設定をテスト
cat cursor-mcp-simple.json

# 完全設定をテスト
cat cursor-mcp-complete.json
```

### コンテナが起動しない場合

ログを確認して問題を特定します：

```bash
docker compose logs -f
```

### ポートの競合がある場合

`compose.yaml`ファイルを編集して、ポートマッピングを変更します：

```yaml
ports:
  - "新しいホストポート:コンテナポート"
```

**重要なポート**:
- `5310` - Web UI
- `5311` - Backend API
- `18080` - **MCP Gateway (Cursor接続用)**

例えば、18080ポートが既に使用されている場合：

```yaml
ports:
  - "28080:8080"  # 18080の代わりに28080を使用
```

この場合、Cursor設定でも新しいポート番号を使用してください：
```json
"--url", "http://localhost:28080/mcp"
```

### Dockerボリュームの問題

ボリュームをクリーンアップする場合は：

```bash
docker compose down -v
```

**注意**: この操作はすべての保存データを削除します。
