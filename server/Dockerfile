# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application code from builder (files respected by .dockerignore)
COPY --from=builder /app .

# Create upload directory and set permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

EXPOSE 5000
CMD ["npm", "start"]
