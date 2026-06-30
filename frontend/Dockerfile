# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Final stage - just a container to hold the static files
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/dist /app/static
CMD ["sh", "-c", "cp -rf /app/static/* /frontend_static/"]
