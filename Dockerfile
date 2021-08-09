FROM node:alpine

RUN apk add --no-cache chromium chromium-chromedriver

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm ci --production

COPY . .

ARG GPX_JPEGGER_VERSION=dev
ENV GPX_JPEGGER_VERSION $MYNAMON_VERSION
ENV NODE_ENV=production

CMD [ "node", "map.js", "/gpx-jpegger" ]
