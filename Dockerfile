FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/seed ./seed
COPY --from=build /app/package.json ./
# data/ wird als Volume eingebunden (Produkte + Anfragen bleiben bei Updates erhalten)
EXPOSE 3000
CMD ["node", "server.js"]
