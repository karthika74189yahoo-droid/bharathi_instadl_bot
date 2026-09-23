FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip \
  && pip3 install --no-cache-dir --break-system-packages yt-dlp gallery-dl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD ["npm", "start"]