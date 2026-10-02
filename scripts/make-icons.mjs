// Regenerates every app icon and the header logo from the two source files in /brand.
// Usage (from the project folder):  node scripts/make-icons.mjs
import sharp from "sharp";

const SMALL = "brand/logo-small-source.webp"; // square, purple → magenta gradient + pen
const LONG = "brand/logo-long-source.png"; // "SMASH MEMO" + pen on pure black

/** Rounded-corner mask (iOS-like radius) for icons shown as-is (tab, "any" PWA icons). */
const roundMask = (size) =>
  Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.215}"/></svg>`);

async function square(size, out, { rounded }) {
  let img = sharp(SMALL).resize(size, size, { kernel: "lanczos3" });
  if (rounded) img = sharp(await img.png().toBuffer()).composite([{ input: roundMask(size), blend: "dest-in" }]);
  await img.png({ compressionLevel: 9 }).toFile(out);
  console.log("wrote", out);
}

/**
 * Android "maskable" icon: the launcher crops it to a circle/squircle that keeps only the
 * central 80 %. Shrink the artwork into that safe zone, then repeat its edge pixels outwards:
 * the gradient is horizontal, so this continues it without any visible seam.
 */
async function maskable(size, out) {
  const inner = Math.round(size * 0.8);
  const pad = Math.round((size - inner) / 2);
  await sharp(SMALL)
    .resize(inner, inner)
    .extend({ top: pad, bottom: size - inner - pad, left: pad, right: size - inner - pad, extendWith: "copy" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}

/**
 * Header logo: turns the black background transparent without a dark fringe.
 * Each pixel was drawn over black, so alpha = brightest channel and colour = pixel / alpha.
 */
async function longOnTransparent(height) {
  const { data, info } = await sharp(LONG).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const a = Math.max(r, g, b);
    if (a > 0) {
      rgba[j] = Math.min(255, Math.round((r * 255) / a));
      rgba[j + 1] = Math.min(255, Math.round((g * 255) / a));
      rgba[j + 2] = Math.min(255, Math.round((b * 255) / a));
    }
    rgba[j + 3] = a;
  }
  const trimmed = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 }) // crop the empty margins
    .png()
    .toBuffer();
  return sharp(trimmed).resize({ height, kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();
}

async function transparentLong(out, height) {
  await sharp(await longOnTransparent(height)).toFile(out);
  const meta = await sharp(out).metadata();
  console.log("wrote", out, `${meta.width}x${meta.height}`);
}

/** Link preview (Discord, WhatsApp, X…): long logo on the app's dark background with the brand glow. */
async function openGraph(out) {
  const W = 1200, H = 630;
  const bg = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><radialGradient id="glow" cx="50%" cy="38%" r="55%">` +
      `<stop offset="0" stop-color="#8b5cf6" stop-opacity="0.32"/><stop offset="0.6" stop-color="#e040fb" stop-opacity="0.08"/>` +
      `<stop offset="1" stop-color="#0a0910" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="${W}" height="${H}" fill="#0a0910"/><rect width="${W}" height="${H}" fill="url(#glow)"/></svg>`,
  );
  const logo = await longOnTransparent(270);
  const { width } = await sharp(logo).metadata();
  await sharp(bg)
    .composite([{ input: logo, left: Math.round((W - width) / 2), top: Math.round((H - 270) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}

await square(64, "src/app/icon.png", { rounded: true }); // browser tab
await square(180, "src/app/apple-icon.png", { rounded: false }); // iOS home screen (iOS rounds it)
await square(192, "public/icons/icon-192.png", { rounded: true });
await square(512, "public/icons/icon-512.png", { rounded: true });
await maskable(512, "public/icons/maskable-512.png");
await transparentLong("public/brand/logo-long.png", 160); // shown 36–80 px tall: crisp on retina screens
await openGraph("src/app/opengraph-image.png"); // Next.js adds the <meta og:image> tags automatically
