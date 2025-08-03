#!/bin/bash

# Docker MCP Gateway Web UI - メンテナンススクリプト
# 定期メンテナンス用の自動化スクリプト

echo "=== Docker MCP Gateway Web UI メンテナンス ==="
echo "実行時刻: $(date)"
echo

# 使用可能なコマンドを表示
show_help() {
    echo "使用方法: $0 [command]"
    echo
    echo "利用可能なコマンド:"
    echo "  start     - サービス開始"
    echo "  stop      - サービス停止"
    echo "  restart   - サービス再起動"
    echo "  status    - サービス状態確認"
    echo "  logs      - ログ表示"
    echo "  cleanup   - 不要なリソース削除"
    echo "  backup    - 設定ファイルバックアップ"
    echo "  help      - このヘルプを表示"
    echo
}

# サービス開始
start_services() {
    echo "🚀 サービスを開始しています..."
    docker compose -f compose.simple.yaml up -d
    echo "✅ サービス開始完了"
}

# サービス停止
stop_services() {
    echo "🛑 サービスを停止しています..."
    docker compose -f compose.simple.yaml down
    echo "✅ サービス停止完了"
}

# サービス再起動
restart_services() {
    echo "🔄 サービスを再起動しています..."
    stop_services
    sleep 5
    start_services
}

# サービス状態確認
check_status() {
    echo "📊 サービス状態:"
    docker compose -f compose.simple.yaml ps
    echo
    ./dev/tools/scripts/health-check.sh
}

# ログ表示
show_logs() {
    echo "📋 最新のログ (最後の100行):"
    docker compose -f compose.simple.yaml logs --tail=100
}

# クリーンアップ
cleanup_resources() {
    echo "🧹 不要なリソースを削除しています..."

    # 停止したコンテナを削除
    docker container prune -f

    # 未使用のイメージを削除
    docker image prune -f

    # 未使用のネットワークを削除
    docker network prune -f

    # 未使用のボリュームを削除
    docker volume prune -f

    echo "✅ クリーンアップ完了"
}

# 設定ファイルバックアップ
backup_config() {
    BACKUP_DIR="./dev/data/backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    echo "💾 設定ファイルをバックアップしています..."

    mkdir -p "$BACKUP_DIR"

    # 設定ファイルのバックアップ
    if [ -d "./dev/data/config" ]; then
        cp -r "./dev/data/config" "$BACKUP_DIR/config_$TIMESTAMP"
        echo "✅ 設定ファイルをバックアップしました: $BACKUP_DIR/config_$TIMESTAMP"
    fi

    # Compose ファイルのバックアップ
    cp compose.simple.yaml "$BACKUP_DIR/compose.simple_$TIMESTAMP.yaml"
    echo "✅ Compose ファイルをバックアップしました: $BACKUP_DIR/compose.simple_$TIMESTAMP.yaml"

    # 古いバックアップを削除 (7日以上前)
    find "$BACKUP_DIR" -name "*_*" -type f -mtime +7 -delete
    echo "🗑️ 7日以上前のバックアップを削除しました"
}

# メイン処理
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs
        ;;
    cleanup)
        cleanup_resources
        ;;
    backup)
        backup_config
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ 不明なコマンド: $1"
        echo
        show_help
        exit 1
        ;;
esac
