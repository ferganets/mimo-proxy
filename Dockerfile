FROM node:22-slim AS base
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/

RUN npm install

COPY packages/backend/ packages/backend/
COPY tsconfig.json ./

RUN npm run build -w packages/backend

EXPOSE 8443

CMD ["node", "packages/backend/dist/index.js"]
