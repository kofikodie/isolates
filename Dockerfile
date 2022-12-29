FROM node:18-alpine3.16 AS builder

RUN apk add g++ make py3-pip

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

FROM node:18-alpine3.16 AS final

WORKDIR /app

COPY --from=builder ./app/dist ./dist
COPY package*.json ./
RUN npm install --production
CMD [ "npm", "start" ]