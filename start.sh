# すべてのサービスを一括起動するスクリプト

#!/bin/bash

# 色の定義
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Docker MCP Web GUI${NC} 起動スクリプト"
echo "========================================"

# 環境の確認
if [ "$1" == "dev" ] || [ "$1" == "development" ]; then
    ENV="development"
    COMPOSE_FILES="-f compose.yaml -f compose.dev.yaml"
    echo -e "${YELLOW}開発モード${NC}で起動します"
else
    ENV="production"
    COMPOSE_FILES="-f compose.yaml"
    echo -e "${GREEN}本番モード${NC}で起動します"
fi

# 既存のコンテナを停止
echo -e "\n${CYAN}既存のコンテナを停止します...${NC}"
docker compose $COMPOSE_FILES down

# コンテナをビルド
echo -e "\n${CYAN}コンテナをビルドしています...${NC}"
docker compose $COMPOSE_FILES build

# コンテナを起動
echo -e "\n${CYAN}コンテナを起動しています...${NC}"
docker compose $COMPOSE_FILES up -d

# 起動状態を確認
echo -e "\n${CYAN}コンテナの起動状態:${NC}"
docker compose $COMPOSE_FILES ps

echo -e "\n${GREEN}起動完了！${NC}"
echo "========================================"
echo "Web UI: http://localhost:5310"
echo "API: http://localhost:5311/api"
echo "Gateway: http://localhost:18080"
echo "========================================"
echo -e "ログを確認: ${YELLOW}docker compose $COMPOSE_FILES logs -f${NC}"
echo -e "停止する: ${YELLOW}docker compose $COMPOSE_FILES down${NC}"
