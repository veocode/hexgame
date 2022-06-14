FROM node:lts-alpine AS deps
WORKDIR /opt/app
RUN apk add --no-cache git
COPY ./dist/server/package-lock.json ./package-lock.json
COPY ./dist/server/package.json ./package.json
RUN npm install

FROM node:lts-alpine AS runner
WORKDIR /opt/app
COPY --from=deps /opt/app/node_modules ./node_modules
COPY --from=deps /opt/app/package.json ./package.json
COPY --from=deps /opt/app/package-lock.json ./package-lock.json
RUN npm install -g forever
