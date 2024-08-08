FROM node:18

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install NPMs
COPY package.json* package-lock.json* /usr/src/app/
RUN npm install

COPY . /usr/src/app
RUN npm run build
