FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN node scripts/make-icons.mjs && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "server/index.js"]
