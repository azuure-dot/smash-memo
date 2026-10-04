// Regenerates every app icon, the header logos and the link preview from the source files in /brand,
// recoloured in the "paper & ink" style (the original artwork's shapes are kept as-is).
// Usage (from the project folder, with `npm run dev` stopped):  node scripts/make-icons.mjs
import sharp from "sharp";

const SMALL = "brand/logo-small-source.webp"; // square, purple → magenta gradient + white pen with "SM"
const LONG = "brand/logo-long-source.png"; // "SMASH MEMO" (gradient) + white pen, on pure black

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const INK = {
  paper: hex("#f6f1e7"),
  ink: hex("#1e2433"), // blue-black pen
  magenta: hex("#b3246f"),
  postit: hex("#ff76c6"), // pink post-it chosen by the owner
  chalk: hex("#e9e4d8"), // dark-mode "ink"
  magentaDark: hex("#f06bb4"),
};

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

/** How "white" a pixel is (1 = white pen, ~0.35 = the purple/magenta gradient). */
function whiteness(r, g, b) {
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : Math.min(r, g, b) / max;
}
/** Pen-ness from whiteness, with a soft edge for anti-aliased pixels. */
const penAmount = (w) => clamp01((w - 0.5) / 0.4);

/**
 * Smooth value noise in [lo, hi], cell ≈ `cell` px: gives the ink a faint stamped / printed texture.
 * Deterministic, so the output doesn't change between runs.
 */
function inkGrain(width, height, cell, lo, hi) {
  const gw = Math.ceil(width / cell) + 2, gh = Math.ceil(height / cell) + 2;
  let seed = 1234567;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const grid = Float32Array.from({ length: gw * gh }, () => lo + (hi - lo) * rand());
  return (x, y) => {
    const gx = x / cell, gy = y / cell;
    const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    const v = (i, j) => grid[j * gw + i];
    const top = v(x0, y0) * (1 - fx) + v(x0 + 1, y0) * fx;
    const bot = v(x0, y0 + 1) * (1 - fx) + v(x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bot * fy;
  };
}

// ---------------------------------------------------------------------------
// Small logo → icons: cream paper, blue-black pen, magenta "SM" letters.
// ---------------------------------------------------------------------------
async function inkSmall() {
  const { data, info } = await sharp(SMALL).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const n = W * H;
  const pen = new Float32Array(n);
  for (let p = 0; p < n; p++) pen[p] = penAmount(whiteness(data[p * 3], data[p * 3 + 1], data[p * 3 + 2]));

  // Background = non-pen pixels reachable from the border; the non-pen pixels enclosed by the pen are the letters.
  const bg = new Uint8Array(n);
  const stack = [];
  const push = (p) => { if (!bg[p] && pen[p] < 0.5) { bg[p] = 1; stack.push(p); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const p = stack.pop(), x = p % W, y = (p - x) / W;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (y > 0) push(p - W);
    if (y < H - 1) push(p + W);
  }
  // Letter mask, grown by 3 px so the anti-aliased pen edge around the letters blends to the letter colour.
  const letter = new Uint8Array(n);
  for (let p = 0; p < n; p++) if (!bg[p] && pen[p] < 0.5) letter[p] = 1;
  const grown = Uint8Array.from(letter);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!letter[y * W + x]) continue;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H) grown[yy * W + xx] = 1;
        }
    }

  // Pen layer (transparent around it): blue-black ink, "SM" cut out in the same off-white as the background.
  const penLayer = Buffer.alloc(n * 4);
  for (let p = 0; p < n; p++) {
    const [r, g, b] = grown[p] ? mix(INK.paper, INK.ink, pen[p]) : INK.ink;
    penLayer[p * 4] = r; penLayer[p * 4 + 1] = g; penLayer[p * 4 + 2] = b;
    penLayer[p * 4 + 3] = grown[p] ? 255 : Math.round(pen[p] * 255);
  }

  // Background: off-white desk with a pink post-it, slightly askew, held by masking tape.
  const [pr, pg, pb] = INK.paper;
  const [lr, lg, lb] = INK.postit;
  const side = Math.round(W * 0.72);
  const x0 = Math.round((W - side) / 2);
  const tapeW = Math.round(side * 0.26), tapeH = Math.round(side * 0.08);
  const backdrop = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${W * 0.018}"/></filter>
        <linearGradient id="curl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.07"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="rgb(${pr},${pg},${pb})"/>
      <g transform="rotate(-6 ${W / 2} ${H / 2})">
        <rect x="${x0}" y="${x0 + W * 0.02}" width="${side}" height="${side}" fill="#3c2d14" opacity="0.18" filter="url(#soft)"/>
        <rect x="${x0}" y="${x0}" width="${side}" height="${side}" fill="rgb(${lr},${lg},${lb})"/>
        <rect x="${x0}" y="${x0}" width="${side}" height="${side}" fill="url(#curl)"/>
        <rect x="${W / 2 - tapeW / 2}" y="${x0 - tapeH * 0.55}" width="${tapeW}" height="${tapeH}" fill="rgb(239,228,200)" opacity="0.85" transform="rotate(4 ${W / 2} ${x0})"/>
      </g>
    </svg>`,
  );
  const penPng = await sharp(penLayer, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  return sharp(backdrop).composite([{ input: penPng }]).png().toBuffer();
}

/** Rounded-corner mask (iOS-like radius) for icons shown as-is (tab, "any" PWA icons). */
const roundMask = (size) =>
  Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.215}"/></svg>`);

async function square(src, size, out, { rounded }) {
  let img = sharp(src).resize(size, size, { kernel: "lanczos3" });
  if (rounded) img = sharp(await img.png().toBuffer()).composite([{ input: roundMask(size), blend: "dest-in" }]);
  await img.png({ compressionLevel: 9 }).toFile(out);
  console.log("wrote", out);
}

/** Android "maskable" icon: artwork shrunk into the central 80 % safe zone, on plain paper. */
async function maskable(src, size, out) {
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  const [r, g, b] = INK.paper;
  await sharp(src)
    .resize(inner, inner)
    .extend({ top: pad, bottom: size - inner - pad, left: pad, right: size - inner - pad, background: { r, g, b } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}

// ---------------------------------------------------------------------------
// Long logo → header wordmarks: transparent, ink lettering + magenta pen, faint stamp texture.
// ---------------------------------------------------------------------------
async function inkLong(height, { text, pen }) {
  const { data, info } = await sharp(LONG).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const grain = inkGrain(W, H, 12, 0.9, 1);
  const rgba = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const r = data[p * 3], g = data[p * 3 + 1], b = data[p * 3 + 2];
    // Drawn over black: coverage = brightest channel; un-premultiply to get the real colour.
    const a = Math.max(r, g, b);
    if (!a) continue;
    const t = penAmount(whiteness(r, g, b));
    const [cr, cg, cb] = mix(text, pen, t);
    const x = p % W, y = (p - x) / W;
    rgba[p * 4] = cr; rgba[p * 4 + 1] = cg; rgba[p * 4 + 2] = cb;
    rgba[p * 4 + 3] = Math.round(a * grain(x, y));
  }
  const trimmed = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
  return sharp(trimmed).resize({ height, kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();
}

async function writeLong(out, height, colours) {
  await sharp(await inkLong(height, colours)).toFile(out);
  const meta = await sharp(out).metadata();
  console.log("wrote", out, `${meta.width}x${meta.height}`);
}

/** Link preview (Discord, WhatsApp, X…): the ink wordmark on dot-grid paper. */
async function openGraph(out) {
  const W = 1200, H = 630;
  const [pr, pg, pb] = INK.paper;
  const bg = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><pattern id="d" width="26" height="26" patternUnits="userSpaceOnUse">` +
      `<circle cx="13" cy="13" r="1.6" fill="rgb(30,36,51)" fill-opacity="0.12"/></pattern></defs>` +
      `<rect width="${W}" height="${H}" fill="rgb(${pr},${pg},${pb})"/><rect width="${W}" height="${H}" fill="url(#d)"/></svg>`,
  );
  const logo = await inkLong(270, { text: INK.ink, pen: INK.magenta });
  const { width } = await sharp(logo).metadata();
  await sharp(bg)
    .composite([{ input: logo, left: Math.round((W - width) / 2), top: Math.round((H - 270) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}

/** Game logos for the dashboard selector: trimmed, resized for retina, WebP with transparency. */
async function gameLogo(game) {
  const out = `public/games/${game}.webp`;
  const trimmed = await sharp(`brand/games/${game}.png`).trim({ threshold: 1 }).png().toBuffer();
  await sharp(trimmed).resize({ height: 144, kernel: "lanczos3" }).webp({ quality: 90, alphaQuality: 100 }).toFile(out);
  const meta = await sharp(out).metadata();
  console.log("wrote", out, `${meta.width}x${meta.height}`);
}

for (const game of ["ultimate", "melee", "roa2"]) await gameLogo(game);

const small = await inkSmall();
await square(small, 64, "src/app/icon.png", { rounded: true }); // browser tab
await square(small, 180, "src/app/apple-icon.png", { rounded: false }); // iOS home screen (iOS rounds it)
await square(small, 192, "public/icons/icon-192.png", { rounded: true });
await square(small, 512, "public/icons/icon-512.png", { rounded: true });
await maskable(small, 512, "public/icons/maskable-512.png");
// Header wordmarks, shown 36–80 px tall: crisp on retina screens. One per theme.
await writeLong("public/brand/logo-long-light.png", 160, { text: INK.ink, pen: INK.magenta });
await writeLong("public/brand/logo-long-dark.png", 160, { text: INK.chalk, pen: INK.magentaDark });
await openGraph("src/app/opengraph-image.png"); // Next.js adds the <meta og:image> tags automatically
