FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
COPY tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/dist
COPY --from=build /app/apps/api/package.json /app/package.json
EXPOSE 4000
CMD ["node", "dist/index.js"]
