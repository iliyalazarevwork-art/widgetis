# Single-stage: serve pre-built dist/ via nginx.
# Build is done locally via `npm run build:prerender` (see deployment.md);
# dist/ is committed to git and copied directly here. No vite build / npm install
# happens in this image.
FROM nginx:1.27-alpine

COPY dist/ /usr/share/nginx/html/
COPY analytics.production.js /usr/share/nginx/html/analytics.js
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i 's#</head>#<script defer src="/analytics.js"></script></head>#' /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
