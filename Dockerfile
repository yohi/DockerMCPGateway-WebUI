FROM node:20-alpine AS base

# 作業ディレクトリを設定
WORKDIR /app

# パッケージマネージャーの最適化
RUN npm config set fund false && \
    npm config set audit false

# 本番環境の依存関係のみインストール
FROM base AS deps
COPY dev/tools/configs/package.json dev/tools/configs/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --only=production

# ビルド環境
FROM base AS builder
COPY dev/tools/configs/package.json dev/tools/configs/package-lock.json* ./

# キャッシュマウントを使用して高速インストール
RUN --mount=type=cache,target=/root/.npm \
    npm install

# ソースファイルのみをコピー（必要なもののみ）
COPY src/ ./src/
COPY public/ ./public/
# 設定ファイルを直接コンテナルートにコピー
COPY dev/tools/configs/next.config.js ./next.config.js
COPY dev/tools/configs/tailwind.config.js ./tailwind.config.js
COPY dev/tools/configs/postcss.config.js ./postcss.config.js
COPY dev/tools/configs/tsconfig.json ./tsconfig.json

# Next.jsアプリケーションをビルド
RUN npm run build

# 本番環境
FROM base AS runner

# 非root権限のユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 必要なディレクトリを作成し、権限を設定
RUN mkdir -p /app/.next && \
    chown -R nextjs:nodejs /app

WORKDIR /app

# ビルド済みのファイルをコピー（最適化）
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# MCP Gatewayの設定ファイルやバックアップを保存するためのディレクトリ
RUN mkdir -p /app/config && \
    chown -R nextjs:nodejs /app/config

# Express.jsサーバーファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/src/server ./src/server

# 次のユーザーに切り替え
USER nextjs

# ポートを公開
EXPOSE 5310

# 環境変数の設定
ENV NODE_ENV production
ENV PORT 5310
ENV NEXT_TELEMETRY_DISABLED 1
ENV MCP_GATEWAY_API_URL http://mcp-gateway:8080/api

# Next.jsアプリを起動
CMD ["npm", "start"]
