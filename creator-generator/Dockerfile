FROM node:22-slim

WORKDIR /app

COPY package.json ./

# No npm dependencies — uses only Node.js built-in modules
RUN npm install --omit=dev || true

COPY . .

# Default to dry-run so the container doesn't publish without a key
CMD ["node", "src/runOnce.js", "--dry-run"]
