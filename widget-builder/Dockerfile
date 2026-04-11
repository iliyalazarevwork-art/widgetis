# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm jiti

COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./

COPY packages/ ./packages/
COPY modules/ ./modules/
COPY index.ts ./
COPY server.ts ./
COPY build-demo.ts ./
COPY demo-config.json ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

EXPOSE 3200

ENV HOST=0.0.0.0
ENV PORT=3200

CMD ["jiti", "server.ts"]
