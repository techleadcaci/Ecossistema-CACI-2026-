FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 🔥 COMPILA TYPESCRIPT PARA JS
RUN npx tsc

# 🔥 CLOUD RUN PORTA
ENV PORT=8080
EXPOSE 8080

# 🔥 RODA JS (NÃO TS)
CMD ["node", "dist/server.js"]
