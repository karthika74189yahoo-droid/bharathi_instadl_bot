require('dotenv').config();

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { Telegraf } = require('telegraf');

const token = process.env.BOT_TOKEN;
const ytdlp = process.env.YTDLP_PATH || 'yt-dlp';
const defaultGalleryDl = process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'Scripts', 'gallery-dl.exe')
  : 'gallery-dl';
const gallerydl = process.env.GALLERY_DL_PATH ||
  (fs.existsSync(defaultGalleryDl) ? defaultGalleryDl : 'gallery-dl');
const browser = process.env.YTDLP_BROWSER?.trim() ||
  (process.platform === 'win32' ? 'chrome' : undefined);
const maxFileSize = Number(process.env.MAX_FILE_SIZE_MB || 49) * 1024 * 1024;

if (!token) {
  console.error('Missing BOT_TOKEN. Copy .env.example to .env and add your token.');
  process.exit(1);
}

const bot = new Telegraf(token);

function isInstagramUrl(value) {
  try {
    const url = new URL(value);
    return (url.hostname === 'instagram.com' || url.hostname.endsWith('.instagram.com')) &&
      /^\/(p|reel|tv)\/[\w-]+/.test(url.pathname);
  } catch {
    return false;
  }
}

function downloadInstagram(url, outputDir) {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(outputDir, '%(id)s.%(ext)s');
    const args = [
      '--restrict-filenames',
      '--ignore-errors',
      '--max-filesize', `${Math.floor(maxFileSize / 1024 / 1024)}M`,
      '--merge-output-format', 'mp4',
      '-o', outputTemplate,
      url
    ];

    if (browser) {
      args.splice(1, 0, '--cookies-from-browser', browser);
    }

    const process = spawn(ytdlp, args, { windowsHide: true });

    let errorOutput = '';
    process.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });
    process.on('error', (error) => reject(new Error(`Could not start yt-dlp: ${error.message}`)));
    process.on('close', (code) => {
      const files = listMediaFiles(outputDir);

      if (files.length) {
        resolve(files);
      } else {
        downloadWithGalleryDl(url, outputDir).then(resolve).catch(() => {
          reject(new Error(errorOutput.trim() || `No media found; yt-dlp exited with code ${code}`));
        });
      }
    });
  });
}

function listMediaFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMediaFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

function downloadWithGalleryDl(url, outputDir) {
  return new Promise((resolve, reject) => {
    const args = ['--directory', outputDir, '--no-mtime', url];
    if (browser) {
      args.splice(2, 0, '--cookies-from-browser', browser);
    }

    const process = spawn(gallerydl, args, { windowsHide: true });
    let errorOutput = '';
    process.stderr.on('data', (chunk) => { errorOutput += chunk.toString(); });
    process.on('error', (error) => reject(new Error(`Could not start gallery-dl: ${error.message}`)));
    process.on('close', (code) => {
      const files = listMediaFiles(outputDir);
      if (files.length) {
        resolve(files);
      } else {
        reject(new Error(errorOutput.trim() || `gallery-dl exited with code ${code}`));
      }
    });
  });
}

bot.start((ctx) => ctx.reply(
  'Send me a public Instagram post or reel URL. Only download content you own or are authorized to use.'
));

bot.on('text', async (ctx) => {
  const url = ctx.message.text.trim();

  if (!isInstagramUrl(url)) {
    await ctx.reply('Please send a valid public Instagram post or reel URL.');
    return;
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'instagram-bot-'));
  await ctx.reply('Downloading...');

  try {
    const files = await downloadInstagram(url, workDir);
    for (const [index, file] of files.entries()) {
      const extension = path.extname(file).toLowerCase();
      const caption = index === 0 ? 'Downloaded from Instagram' : undefined;
      if (['.mp4', '.m4v', '.webm', '.mov'].includes(extension)) {
        await ctx.replyWithVideo({ source: file }, caption ? { caption } : undefined);
      } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
        await ctx.replyWithPhoto({ source: file }, caption ? { caption } : undefined);
      } else {
        await ctx.replyWithDocument({ source: file }, caption ? { caption } : undefined);
      }
    }
  } catch (error) {
    console.error(error);
    await ctx.reply(
      'Download failed. Instagram may be blocking anonymous requests. ' +
      'Close Chrome and restart the bot, or set YTDLP_BROWSER=edge/firefox in .env.'
    );
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
});

bot.catch((error) => console.error('Telegram error:', error));
bot.launch().then(() => console.log('Instagram downloader bot is running.'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));