FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV TELEGRAM_BOT_TOKEN="9255388468:AAGD3-_NeSQcTWjt6W8r-ix-Vv2YXdFFLFc"
ENV TELEGRAM_CHAT_ID="-5339588384"
ENV NEXTAUTH_URL="https://duan-hethongontaptoan10-11.onrender.com"

CMD ["node", "server.js"]
