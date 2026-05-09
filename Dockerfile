FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.js ./
COPY eslint.config.js ./
COPY tailwind.config.js ./
COPY tsconfig.json ./
RUN npm run build

FROM node:20-alpine AS backend-deps

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY --from=frontend-builder /app/dist ./dist

# Render gerçek portu PORT ile verir; görüntü için örnek
EXPOSE 3001
WORKDIR /app/backend

ENV HOST=0.0.0.0
CMD ["node", "server.js"]
