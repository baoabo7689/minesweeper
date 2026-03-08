# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install yarn (for Alpine)
RUN apk add --no-cache python3 make g++ bash

# Copy package files
COPY package.json yarn.lock ./

# Copy environment variables (if present)
COPY .env.local .env.local

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .



# Build Next.js application
RUN yarn build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install yarn and minimal build deps
RUN apk add --no-cache bash

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --production --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/out ./out
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.local ./.env.local
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the application
CMD ["yarn", "start"]
