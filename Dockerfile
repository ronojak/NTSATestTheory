FROM node:20-slim

WORKDIR /app

COPY backend/railway/package*.json ./
RUN npm install --omit=dev

COPY backend/railway/prisma ./prisma
RUN npx prisma generate

COPY backend/railway/src ./src

EXPOSE 8080
CMD ["node", "src/server.js"]
