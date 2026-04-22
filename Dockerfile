FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD [s/npx", "tsx"/node", "--import", "tsx"/g]

