FROM node:18-alpine3.16

RUN apk add g++ make py3-pip

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm install


EXPOSE 3000