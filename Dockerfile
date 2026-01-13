# Use Node.js LTS version
FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./

# Install dependencies
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "dev"]
