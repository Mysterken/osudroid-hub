FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn run build

FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production
RUN yarn cache clean --force

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]
