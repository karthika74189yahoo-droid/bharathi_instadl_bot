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

If Instagram reports `No video formats found` for a post that opens normally in your browser, set `YTDLP_BROWSER=chrome` in `.env` (or use `edge` or `firefox`). This lets `yt-dlp` reuse your browser session to access the public media. Keep the browser profile logged into Instagram and close the browser before starting the bot if cookie access fails.

Telegram bots have upload limits. The default limit here is 49 MB; change `MAX_FILE_SIZE_MB` only if your Telegram account and bot API support a larger upload.