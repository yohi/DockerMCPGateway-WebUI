#!/bin/bash

# Docker MCP Gateway Web UI - ヘルスチェックスクリプト
# 運用監視用の自動ヘルスチェック

echo "=== Docker MCP Gateway Web UI ヘルスチェック ==="
echo "実行時刻: $(date)"
echo

# サービス状態チェック
echo "📊 コンテナ状態確認"
docker compose -f compose.simple.yaml ps
echo

# ヘルスチェック
echo "🔍 サービスヘルスチェック"

# Web GUI
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5310)
if [ "$WEB_STATUS" = "200" ]; then
    echo "✅ Web GUI (5310): OK"
else
    echo "❌ Web GUI (5310): NG (HTTP $WEB_STATUS)"
fi

# Backend API
API_STATUS=$(curl -s http://localhost:5311/api/health | jq -r '.status' 2>/dev/null)
if [ "$API_STATUS" = "ok" ]; then
    echo "✅ Backend API (5311): OK"
else
    echo "❌ Backend API (5311): NG"
fi

# MCP Simple Server
if nc -z localhost 5400 2>/dev/null; then
    echo "✅ MCP Simple Server (5400): OK"
else
    echo "❌ MCP Simple Server (5400): NG"
fi

echo
echo "📈 リソース使用状況"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo
echo "🗂️ ログファイル確認"
LOG_DIR="./dev/data"
if [ -d "$LOG_DIR" ]; then
    echo "設定ディレクトリ: $LOG_DIR"
    ls -la "$LOG_DIR"
else
    echo "⚠️ ログディレクトリが存在しません: $LOG_DIR"
fi

echo
echo "=== ヘルスチェック完了 ==="
