# Stage 1: Build the React/Vite application
FROM node:23-bookworm-slim AS build
WORKDIR /app

# Copy package files and install dependencies cleanly
COPY package*.json ./
RUN npm ci

# Copy the rest of the code and build the project
COPY . .
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the compiled static files from the build stage
# (Vite outputs to the 'dist' folder by default)
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config to handle SPA routing (try_files fallback to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Nginx
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
