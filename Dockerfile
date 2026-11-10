# Builds the Ruh Labs API (apps/api). The output is one bundled file,
# so the runtime image has no node_modules.

# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/thaana/package.json packages/thaana/
COPY packages/validators/package.json packages/validators/
COPY packages/atolls/package.json packages/atolls/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

COPY packages packages
COPY apps apps
RUN pnpm build

# ---- runtime ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
COPY --from=build /app/apps/api/dist ./dist
# Request analytics (SQLite). Mount a volume here so stats survive redeploys.
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME /app/data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# node:sqlite is still marked experimental in Node 22; silence the startup warning.
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/index.js"]
