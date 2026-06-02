FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install
RUN yarn cache clean --force

COPY .. .

EXPOSE 3000

CMD ["yarn", "run", "dev"]
