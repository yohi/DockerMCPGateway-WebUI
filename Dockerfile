FROM node:20-alpine AS base

# 作業ディレクトリを設定
WORKDIR /app

# 本番環境の依存関係のみインストール
FROM base AS deps
COPY package.json ./
RUN npm install --production

# ビルド環境
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 開発環境依存パッケージを含めたすべてのパッケージをインストール
RUN npm install

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

# ビルド済みのファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
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
