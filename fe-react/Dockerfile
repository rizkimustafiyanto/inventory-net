# Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm install

# Development stage (used for docker compose watch / live reload)
FROM node:20-alpine AS dev

WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV WATCHPACK_POLLING=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Build stage (for production)
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# Runtime stage (Production)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
