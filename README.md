# Instagram Telegram downloader

This bot downloads public Instagram posts and reels and sends the media back to Telegram. Use it only for content you own or have permission to download, and follow Instagram and Telegram terms.

## Setup on Windows

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy its token.
2. Install Node.js 18 or newer.
3. Install `yt-dlp` and `gallery-dl`, and make sure both are on `PATH` (or set `YTDLP_PATH` and `GALLERY_DL_PATH` in `.env`). A current FFmpeg installation is recommended for media merging.
4. In this folder run:

```powershell
npm install
Copy-Item .env.example .env
notepad .env
npm start
```

Put the BotFather token in `BOT_TOKEN`, save the file, then send a public Instagram post or reel URL to the bot.

The bot tries `yt-dlp` first for videos, then automatically uses `gallery-dl` for Instagram pictures and carousels.

For Railway, the included `Dockerfile` installs `yt-dlp`, `gallery-dl`, and FFmpeg automatically. Railway must be configured to deploy this repository with Dockerfile detection enabled, or the service can be redeployed after pushing the file. The `spawn yt-dlp ENOENT` error means the old Node-only deployment was used and the image did not contain yt-dlp.

If Instagram reports `No video formats found` for a post that opens normally in your browser, set `YTDLP_BROWSER=chrome` in `.env` (or use `edge` or `firefox`). This works only when that browser and profile are installed on the same machine as the bot.

For Railway, export a Netscape-format cookie file from a browser where you are logged into Instagram, base64-encode it, and set the result as `YTDLP_COOKIES_BASE64`. Do not set `YTDLP_BROWSER` on Railway unless you have also installed and configured that browser inside the service. Cookie exports are sensitive; keep the Railway variable private and rotate it if exposed.

Telegram bots have upload limits. The default limit here is 49 MB; change `MAX_FILE_SIZE_MB` only if your Telegram account and bot API support a larger upload.