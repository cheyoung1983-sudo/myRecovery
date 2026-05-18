# Use Node.js as the base image
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application (client-side and server-side bundle)
RUN npm run build

# --- Production Image ---
FROM node:20-slim AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built assets and server bundle from the builder stage
COPY --from=builder /app/dist ./dist

# The start script in package.json will run 'node dist/server.cjs'
EXPOSE 3000

CMD ["npm", "start"]
