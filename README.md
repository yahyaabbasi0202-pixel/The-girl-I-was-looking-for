# The Girl I Was Looking For

A story-driven pixel-art adventure for phone, tablet and PC.
Plain HTML + CSS + JavaScript. No backend, no login, no database, no external services.

## How to Run

### Test it on your computer
1. Keep the whole folder together (index.html and all the .js / .css files next to it, plus the `assets` folder).
2. Double-click `index.html`. It opens in your browser and works straight away, no server needed.
3. Click **START THE STORY**.
   - PC: arrow keys or WASD to walk, **E / Space / Enter** to talk and inspect, **M** to mute.
   - Phone: drag the joystick on the left, tap the big button on the right to **TALK / INSPECT / CONTINUE**. Tap dialogue boxes to advance.

Handy test shortcuts:
- `index.html?chapter=7` jumps straight to a chapter (1 to 11).
- In `config.js`, set `unlockAllChapters: true` to see every chapter in the Chapters menu.
- Your progress is saved in the browser, so **CONTINUE** picks up where you stopped.

### Test it on your phone before sending it
Easiest: publish it first (below) and open the link on the phone.
Alternative on the same Wi-Fi: open a terminal in the folder, run `python3 -m http.server 8000`, then open `http://<your-computer's-ip>:8000` on the phone.

### Publish it as a website (free)
Any static host works because the game is just files.

- **Netlify Drop** (the easiest): go to app.netlify.com/drop, drag the whole folder onto the page, and you get a link in seconds. You can rename the site in its settings.
- **GitHub Pages**: create a repository, upload all the files, then Settings → Pages → deploy from the `main` branch. The link will be `https://<username>.github.io/<repo>/`.
- **Cloudflare Pages / Vercel**: connect a repo or upload the folder; no build command is needed and the output directory is the folder itself.

Tips for sending it to Momna:
- Send the link on a private channel. A newly published site is public to anyone who has the address, so use a hard-to-guess name.
- Tell her to use headphones and keep the phone upright (it also works sideways).
- Add to Home Screen on iPhone/Android and it opens full-screen like an app.

## Make it yours

Everything personal lives in **`config.js`**:

| What | Where |
|---|---|
| Title, opening quote, button text, dedication | top of `config.js` |
| Real photos | put `momna.jpg`, `memory1.jpg`, `memory2.jpg`, `memory3.jpg` in `assets/images/` (all optional). `momna.jpg` becomes her profile photo in Chapter 6 (revealed from blurry to sharp) and appears in the closing gallery. Without photos, soft frames are shown instead |
| Photo captions | `memoryCaptions` |
| Music | put `day.mp3`, `emotional.mp3`, `mystery.mp3`, `hopeful.mp3`, `final.mp3` in `assets/music/` (optional; a soft built-in ambient tone plays if missing) |
| Character names shown in dialogue | `names` |
| Fictional app accounts (Chapters 3 and 6) | `social` |
| What Momna answers in Chapter 7 | `getToKnow` |
| Clues in the "three Momina" puzzle | `identityClues` |
| Character colours | `looks` |

Story text itself is in `story1.js` (Chapters 1 to 3), `story2.js` (4 to 6), `story3.js` (7 to 10) and `story4.js` (the final chapter). Scene art is in `scenes.js` and `art.js`.

The project is split into several script files instead of one big `game.js`. They are loaded by `index.html` in order, and `game.js` is the one that starts everything.

## Privacy
Nothing leaves the device. The "Gramly" app is entirely fictional and local. No phone numbers, addresses or real accounts are included, and the only thing stored in the browser is your chapter progress and the mute setting.
