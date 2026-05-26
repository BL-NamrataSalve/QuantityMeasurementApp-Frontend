# Stage 1: Build React/Vite Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install dependencies deterministically
RUN npm ci

# Copy the entire project and build
COPY . .
RUN npm run build

# Stage 2: Serve Application with Nginx
FROM nginx:alpine

# Copy built assets to Nginx static serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Specify default environment variables so Nginx doesn't crash if they are not set on Render
ENV AUTH_SERVICE_URL="http://localhost:8081"
ENV CONVERSION_SERVICE_URL="http://localhost:8080"

# Specify which environment variables to replace in nginx.conf.template
# This prevents Nginx internal variables (like $uri, $host) from being cleared by envsubst
ENV NGINX_ENVSUBST_FILTER="AUTH_SERVICE_URL CONVERSION_SERVICE_URL"

# Expose HTTP port
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
