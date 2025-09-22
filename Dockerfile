# Node 18 LTS (Alpine)
FROM node:18-alpine
# 非 root 実行（安全なデフォルト）
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY package.json .
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
COPY data ./data
ENV PORT=3000
EXPOSE 3000
USER app
CMD ["node", "src/index.js"]
