FROM node:18-alpine3.16 AS builder

RUN apk add g++ make py3-pip

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

FROM node:18-alpine3.16 AS final

RUN apk add g++ make py3-pip

WORKDIR /app

COPY --from=builder ./app/dist ./dist
COPY --from=builder ./app/src/serverless.yml ./dist/src/
COPY --from=builder ./app/src/handlers ./dist/src/handlers

COPY package*.json ./
RUN npm install --omit=dev
CMD [ "npm", "start" ]