FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json package-lock.json ./
RUN npm install --no-optional
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
EXPOSE 4000
USER node
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
