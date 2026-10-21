// Turns a product photo shot on white into a transparent PNG on a fixed canvas,
// so every product image shares one frame and sits on any card background.
//
//   node scripts/cutout-product.mjs <input> <output.png> [canvasW canvasH] [fillHeight 0-1]
//
// Background removal is a flood fill from the picture edges through near-white
// pixels, so white printed on the product itself is never touched. Soft shadows
// become partially transparent instead of a hard grey blob.
import sharp from "sharp";

const [input, output, cw = "870", ch = "1160", fillArg = "0.97"] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/cutout-product.mjs <input> <output.png> [canvasW canvasH] [fillHeight]");
  process.exit(1);
}
const canvasW = Number(cw), canvasH = Number(ch), fill = Number(fillArg);

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const px = (x, y) => (y * width + x) * 4;
const brightness = (i) => Math.min(data[i], data[i + 1], data[i + 2]);
const isBackground = (i) => brightness(i) >= 200;

// Flood fill from every border pixel.
const seen = new Uint8Array(width * height);
const stack = [];
for (let x = 0; x < width; x++) { stack.push(x, 0, x, height - 1); }
for (let y = 0; y < height; y++) { stack.push(0, y, width - 1, y); }
while (stack.length) {
  const y = stack.pop(), x = stack.pop();
  if (x < 0 || y < 0 || x >= width || y >= height) continue;
  const k = y * width + x;
  if (seen[k]) continue;
  const i = px(x, y);
  if (!isBackground(i)) continue;
  seen[k] = 1;
  // Pure white goes fully transparent; light grey (soft shadow) keeps a faint presence.
  const b = brightness(i);
  data[i + 3] = b >= 248 ? 0 : Math.min(255, Math.round((248 - b) * 3));
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

// Bounding box of what is left visible.
let minX = width, minY = height, maxX = -1, maxY = -1;
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  if (data[px(x, y) + 3] > 40) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
}
const cut = await sharp(data, { raw: { width, height, channels: 4 } })
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
  .png().toBuffer();
const meta = await sharp(cut).metadata();

// Fit into the canvas: aim for `fill` of the height, but never wider than the canvas.
let targetH = Math.round(canvasH * fill);
let targetW = Math.round((meta.width / meta.height) * targetH);
if (targetW > canvasW * 0.96) { targetW = Math.round(canvasW * 0.96); targetH = Math.round((meta.height / meta.width) * targetW); }
const resized = await sharp(cut).resize(targetW, targetH, { fit: "inside" }).png().toBuffer();

await sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: resized, left: Math.round((canvasW - targetW) / 2), top: Math.round((canvasH - targetH) / 2) }])
  .png({ compressionLevel: 9 }).toFile(output);
console.log(`${output}: product ${targetW}x${targetH} on ${canvasW}x${canvasH}, cut from ${minX},${minY}-${maxX},${maxY}`);
