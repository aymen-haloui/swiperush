# Multi-stage build for ChallengeQuest Backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy backend source code
COPY backend/tsconfig.json ./
COPY backend/src ./src/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install Prisma CLI globally (needed for migrations and client generation)
RUN npm install -g prisma

# Copy package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client for production
RUN npx prisma generate

# Copy startup script
COPY backend/start.sh ./start.sh

# Make startup script executable
RUN chmod +x ./start.sh

# Create uploads directory
RUN mkdir -p uploads

# Expose port (Render uses PORT env var, but we expose 5000 as default)
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application using the startup script
CMD ["./start.sh"]

