# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_PREVIEW_BASE_URL=
ENV VITE_PREVIEW_BASE_URL=$VITE_PREVIEW_BASE_URL

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/analytics.production.js /usr/share/nginx/html/analytics.js
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i 's#</head>#<script defer src="/analytics.js"></script></head>#' /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
