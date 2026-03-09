FROM mcr.microsoft.com/playwright:v1.40.1-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node deps
RUN npm ci

# Copy app
COPY server.js .

# Expose port
EXPOSE 3000

# Run
CMD ["npm", "start"]
