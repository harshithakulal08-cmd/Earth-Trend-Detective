# Frontend Dockerfile for NASA Data Detectives
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine-slim

# Copy custom nginx configuration if desired, or default
COPY --from=builder /app/dist /usr/share/nginx/html

# Security hardening: running as unprivileged user
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

