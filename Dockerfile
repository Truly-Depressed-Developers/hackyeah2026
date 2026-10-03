FROM ghcr.io/pnpm/pnpm:12 AS build
RUN pnpm runtime set node 24.21.0 -g
WORKDIR /usr/src/app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm \
    pnpm install --store-dir /var/cache/pnpm --frozen-lockfile
RUN pnpm build
RUN pnpm deploy --filter=api --prod --legacy /prod/api \
 && cp -r apps/web/dist /prod/web-dist

FROM node:24.21.0-slim
ENV NODE_ENV=production
WORKDIR /app/api
COPY --from=build /prod/api ./
COPY --from=build /prod/web-dist /app/web/dist
USER node
CMD ["node", "dist/index.js"]
