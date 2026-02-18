FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY index.js ./
COPY public ./public

# Expose web dashboard port
EXPOSE 5005

# Run as non-root user
USER node

CMD ["node", "index.js"]
