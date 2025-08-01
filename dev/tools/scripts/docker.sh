#!/bin/bash

# Docker MCP Web GUI - Container Management Script
# ================================================

# 色の定義
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ヘルプ表示
show_help() {
    echo -e "${CYAN}Docker MCP Web GUI - Container Management${NC}"
    echo "========================================"
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  build              本番用コンテナをビルド"
    echo "  up                 本番環境を起動"
    echo "  down              本番環境を停止"
    echo "  logs              本番環境のログを表示"
    echo "  dev-build         開発用コンテナをビルド"
    echo "  dev-up            開発環境を起動"
    echo "  dev-down          開発環境を停止"
    echo "  dev-logs          開発環境のログを表示"
    echo "  clean             全リソースを削除"
    echo "  status            コンテナ状態を表示"
    echo "  shell             開発コンテナにアクセス"
    echo ""
}

# 実行ディレクトリをプロジェクトルートに変更
cd "$(dirname "$0")/../../.."

case "$1" in
    build)
        echo -e "${CYAN}本番用コンテナをビルドしています...${NC}"
        docker compose build
        ;;
    up)
        echo -e "${GREEN}本番環境を起動しています...${NC}"
        docker compose up -d
        echo -e "${GREEN}起動完了！${NC}"
        echo "Web UI: http://localhost:5310"
        ;;
    down)
        echo -e "${YELLOW}本番環境を停止しています...${NC}"
        docker compose down
        ;;
    logs)
        echo -e "${CYAN}本番環境のログを表示しています...${NC}"
        docker compose logs -f
        ;;
    dev-build)
        echo -e "${CYAN}開発用コンテナをビルドしています...${NC}"
        docker compose -f compose.dev.yaml build
        ;;
    dev-up)
        echo -e "${GREEN}開発環境を起動しています...${NC}"
        docker compose -f compose.dev.yaml up
        ;;
    dev-down)
        echo -e "${YELLOW}開発環境を停止しています...${NC}"
        docker compose -f compose.dev.yaml down
        ;;
    dev-logs)
        echo -e "${CYAN}開発環境のログを表示しています...${NC}"
        docker compose -f compose.dev.yaml logs -f
        ;;
    clean)
        echo -e "${RED}全リソースを削除しています...${NC}"
        docker compose down -v --remove-orphans
        docker compose -f compose.dev.yaml down -v --remove-orphans 2>/dev/null
        docker system prune -f
        ;;
    status)
        echo -e "${CYAN}コンテナ状態:${NC}"
        docker compose ps
        ;;
    shell)
        echo -e "${CYAN}開発コンテナにアクセスしています...${NC}"
        docker exec -it mcp-web-gui-dev sh
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}エラー: 不明なコマンド '$1'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
