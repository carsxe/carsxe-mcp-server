FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:gcp

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist/gcp/server.js ./server.js
EXPOSE 8080
CMD ["node", "server.js"]
