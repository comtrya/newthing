# syntax=docker/dockerfile:1.6

FROM oven/bun:1-debian AS build

WORKDIR /build

COPY . .
RUN bun install --frozen-lockfile \
    && bun run build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 8080
