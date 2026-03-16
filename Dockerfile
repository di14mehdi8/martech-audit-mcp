FROM mcr.microsoft.com/playwright:v1.51.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm ci && npx playwright install chromium

COPY . .
RUN npm run build:all

EXPOSE 3000
ENV PORT=3000

CMD ["node", "build/server.js"]
