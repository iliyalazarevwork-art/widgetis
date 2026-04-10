FROM node:22-alpine

WORKDIR /app

# No external dependencies — uses only Node stdlib.
COPY package.json ./
COPY server.mjs ./

ENV NODE_ENV=production
ENV PORT=3100

EXPOSE 3100

CMD ["node", "server.mjs"]
