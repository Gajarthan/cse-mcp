FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/cse_companies.csv ./
COPY --from=builder /app/README.md ./
COPY --from=builder /app/LICENSE ./
COPY --from=builder /app/server.json ./
COPY --from=builder /app/glama.json ./

CMD ["node", "dist/index.js"]
