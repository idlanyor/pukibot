FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create sessions directory
RUN mkdir -p sessions

# Set permissions
RUN chmod -R 755 /app

# Expose port (if needed for webhooks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ps aux | grep -v grep | grep -q "bun" || exit 1

# Run the application
CMD ["bun", "run", "src/index.ts"]