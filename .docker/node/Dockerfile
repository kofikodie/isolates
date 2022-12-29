FROM node:18-alpine3.16

RUN apk add g++ make py3-pip

WORKDIR /app

COPY package*.json ./

# RUN npm install in ci mode
RUN npm ci

COPY . .

EXPOSE 3000