# ─────────────────────────────────────────────────
# StadiumOS – Single-container Dockerfile
# Builds Next.js frontend, then runs Express backend
# which serves both the API and the static frontend.
# ─────────────────────────────────────────────────

# Stage 1: Build the Next.js frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/ ./

# Copy the Next.js standalone build from Stage 1
COPY --from=frontend-build /app/frontend/.next/standalone ./frontend-standalone
COPY --from=frontend-build /app/frontend/.next/static ./frontend-standalone/.next/static
COPY --from=frontend-build /app/frontend/public ./frontend-standalone/public

# Environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start the Express backend (serves API + proxies to Next.js)
CMD ["node", "server.js"]
