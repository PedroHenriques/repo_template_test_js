FROM node:24-bullseye-slim

WORKDIR /app

COPY package*.json ./
RUN mkdir -p src/App
COPY src/App/package.json ./src/App/package.json

RUN npm ci

COPY . .

# Run as non-root
RUN useradd --create-home --shell /bin/bash appuser && chown -R appuser:appuser /app
USER appuser

CMD ["npm", "start"]
