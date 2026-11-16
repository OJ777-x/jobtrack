// One-off script to generate placeholder PWA icons from the organisation's
// brand colour. Re-run with `node scripts/generate-icons.mjs` after a real
// logo exists if you want to swap these for something custom (Phase 8).
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const PRIMARY = "#2563eb";

function iconSvg(size) {
  const radius = size * 0.22;
  const fontSize = size * 0.42;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="${PRIMARY}" />
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="700"
        font-size="${fontSize}" fill="white">JT</text>
    </svg>
  `;
}

mkdirSync("public/icons", { recursive: true });

const sizes = [192, 512];
for (const size of sizes) {
  await sharp(Buffer.from(iconSvg(size))).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`Wrote public/icons/icon-${size}.png`);
}

await sharp(Buffer.from(iconSvg(180))).png().toFile("public/apple-touch-icon.png");
console.log("Wrote public/apple-touch-icon.png");
