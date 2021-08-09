FROM node

RUN apt-get update && apt-get install -y chromium chromedriver

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm ci --production

COPY . .

ARG GPX_JPEGGER_VERSION=dev
ENV GPX_JPEGGER_VERSION $GPX_JPEGGER_VERSION
ENV NODE_ENV=production

CMD [ "node", "map.js", "/gpx-jpegger" ]
