# Docker MCP Gateway Web UI - 運用ガイド

## 🚀 システム概要

このドキュメントでは、Docker MCP Gateway Web UI の運用方法について説明します。

### 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web GUI       │    │   Backend API   │    │ MCP Simple      │
│   (Port: 5310)  │────│   (Port: 5311)  │────│ (Port: 5400)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📋 サービス一覧

| サービス名 | ポート | 説明 | ヘルスチェック |
|-----------|--------|------|----------------|
| mcp-web-gui | 5310 | フロントエンド Web UI | http://localhost:5310 |
| mcp-backend | 5311 | バックエンド API サーバー | http://localhost:5311/api/health |
| mcp-simple | 5400 | Simple MCP サーバー | tcp://localhost:5400 |

## 🛠️ 運用コマンド

### 基本操作

```bash
# サービス開始
./dev/tools/scripts/maintenance.sh start

# サービス停止
./dev/tools/scripts/maintenance.sh stop

# サービス再起動
./dev/tools/scripts/maintenance.sh restart

# 状態確認
./dev/tools/scripts/maintenance.sh status
```

### 監視とログ

```bash
# ヘルスチェック実行
./dev/tools/scripts/health-check.sh

# ログ確認
./dev/tools/scripts/maintenance.sh logs

# リアルタイムログ監視
docker compose -f compose.simple.yaml logs -f
```

### メンテナンス

```bash
# 不要なリソース削除
./dev/tools/scripts/maintenance.sh cleanup

# 設定ファイルバックアップ
./dev/tools/scripts/maintenance.sh backup

# 手動バックアップ
cp -r ./dev/data/config ./dev/data/backups/config_$(date +%Y%m%d_%H%M%S)
```

## 📊 監視項目

### 必須チェック項目

1. **サービス稼働状況**
   - 全コンテナが `healthy` 状態
   - ポートが正常にリッスン中

2. **リソース使用量**
   - CPU使用率 < 80%
   - メモリ使用量 < 2GB
   - ディスク使用量 < 80%

3. **API応答性**
   - Web GUI: 応答時間 < 2秒
   - Backend API: 応答時間 < 1秒
   - MCP Server: 接続可能

### アラート基準

| 項目 | 警告レベル | 緊急レベル |
|------|------------|------------|
| CPU使用率 | > 70% | > 90% |
| メモリ使用量 | > 1.5GB | > 2.5GB |
| 応答時間 | > 3秒 | > 10秒 |
| エラー率 | > 1% | > 5% |

## 🚨 トラブルシューティング

### よくある問題と解決策

#### 1. コンテナが起動しない

```bash
# ログ確認
docker compose -f compose.simple.yaml logs [service-name]

# リソース確認
docker system df
docker system prune -f

# 強制再起動
./dev/tools/scripts/maintenance.sh restart
```

#### 2. API が応答しない

```bash
# ヘルスチェック実行
curl http://localhost:5311/api/health

# コンテナ内部確認
docker exec -it mcp-backend /bin/sh

# ポート確認
netstat -tlnp | grep 5311
```

#### 3. パフォーマンス低下

```bash
# リソース使用量確認
docker stats

# ログサイズ確認
docker system df

# 不要なリソース削除
./dev/tools/scripts/maintenance.sh cleanup
```

### 緊急時対応

#### システム復旧手順

1. **緊急停止**
   ```bash
   docker compose -f compose.simple.yaml down
   ```

2. **状況確認**
   ```bash
   docker ps -a
   docker images
   docker system df
   ```

3. **クリーンアップ**
   ```bash
   ./dev/tools/scripts/maintenance.sh cleanup
   ```

4. **サービス復旧**
   ```bash
   ./dev/tools/scripts/maintenance.sh start
   ```

5. **動作確認**
   ```bash
   ./dev/tools/scripts/health-check.sh
   ```

## 📈 パフォーマンス最適化

### 推奨設定

1. **Docker リソース制限**
   - CPU: 2コア以上
   - メモリ: 4GB以上
   - ディスク: 10GB以上の空き容量

2. **定期メンテナンス**
   - 週次: ログクリーンアップ
   - 月次: イメージ更新
   - 四半期: システム最適化

3. **監視設定**
   - 5分間隔: ヘルスチェック
   - 1時間間隔: リソース監視
   - 日次: バックアップ実行

## 🔐 セキュリティ

### セキュリティチェックリスト

- [ ] Docker socket へのアクセス制御
- [ ] コンテナの最小権限設定
- [ ] ネットワーク分離の確認
- [ ] ログの機密情報確認
- [ ] バックアップファイルの暗号化

### セキュリティ更新

```bash
# イメージ更新
docker compose -f compose.simple.yaml pull
docker compose -f compose.simple.yaml up -d

# セキュリティスキャン（必要に応じて）
docker scout cves [image-name]
```

## 📞 エスカレーション

### 連絡先

| レベル | 対象 | 連絡方法 | 対応時間 |
|--------|------|----------|----------|
| L1 | 運用チーム | 社内チャット | 即時 |
| L2 | 開発チーム | メール | 1時間以内 |
| L3 | 管理者 | 電話 | 即時 |

### 報告フォーマット

```
件名: [緊急度] Docker MCP Gateway Web UI - [問題概要]

■ 発生時刻: YYYY/MM/DD HH:MM:SS
■ 症状: [具体的な症状]
■ 影響範囲: [影響を受けるサービス・ユーザー]
■ 実行した対処: [実行済みの対処内容]
■ 現在の状況: [現在のシステム状態]
■ 次のアクション: [必要な対応]
```

---

**最終更新**: 2025/08/03
**文書バージョン**: 1.0
**管理者**: DevOps Team
