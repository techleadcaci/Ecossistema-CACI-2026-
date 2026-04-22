# BUILD
FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# RUN
FROM node:20
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

RUN npm install --omit=dev

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
