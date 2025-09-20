FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm i -g serve
COPY --from=base /app/dist ./dist
EXPOSE 5173
CMD ["npx", "serve", "-s", "dist", "-l", "5173"]
