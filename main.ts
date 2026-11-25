// convince-judge-visit-house-bot-v1
// Deterministic, stdlib-only Node program.
// Writes one image — a handwritten-style invitation letter addressed to the
// AI judge — to /output/entry.png. No network, no randomness, no timestamps,
// no external assets: the letter is rasterised from code (own 5x7 bitmap
// font, own shape rasteriser, own PNG encoder via node:zlib).
// Two runs from a clean state produce byte-identical output.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------------------
// Palette (warm paper letter, dark brown ink)
// ---------------------------------------------------------------------------
const PAPER = [251, 243, 218];
const PAPER_EDGE = [239, 224, 184];
const INK = [58, 42, 26];
const ACCENT = [139, 58, 42];
const FRAME = [138, 109, 59];
const GROUND = [185, 155, 98];
const ROOF = [163, 74, 42];
const WALL = [232, 160, 92];
const DOOR = [107, 66, 38];
const WINDOW = [191, 227, 234];
const TREE = [95, 143, 62];
const SUN = [240, 180, 41];
const CUP = [255, 255, 255];
const SAUCER = [201, 138, 75];

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows of 5 characters ('#' = ink).
// Only the characters the letter uses are defined; anything else is blank.
// ---------------------------------------------------------------------------
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  a: [".....", ".....", ".####", "....#", ".####", "#...#", ".###."],
  b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
  c: [".....", ".....", ".###.", "#....", "#....", "#....", ".###."],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  f: ["..##.", ".#..#", ".#...", "####.", ".#...", ".#...", ".#..."],
  g: [".....", ".####", "#...#", "#...#", ".####", "....#", ".###."],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: [".....", "..#..", ".....", ".##..", "..#..", "..#..", ".###."],
  j: ["...#.", ".....", "..##.", "...#.", "...#.", "...#.", ".##.."],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [".....", ".....", "####.", "#...#", "#...#", "####.", "#...."],
  q: [".....", ".....", ".####", "#...#", "#...#", ".####", "....#"],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  t: [".#...", ".#...", "####.", ".#...", ".#...", ".#...", "..##."],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#...#", ".###."],
  v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  w: [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  y: [".....", "#...#", "#...#", ".#.#.", "..#..", "..#..", ".##.."],
  z: [".....", ".....", "#####", "...#.", "..#..", ".#...", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "...#.", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
};

const BLANK = [".....", ".....", ".....", ".....", ".....", ".....", "....."];

// ---------------------------------------------------------------------------
// Canvas: plain RGB buffer + shape rasteriser
// ---------------------------------------------------------------------------
type RGB = number[];

class Canvas {
  data: Buffer;
  w: number;
  h: number;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 3);
  }
  fill(c: RGB): void {
    for (let i = 0; i < this.w * this.h; i++) {
      this.data[i * 3] = c[0];
      this.data[i * 3 + 1] = c[1];
      this.data[i * 3 + 2] = c[2];
    }
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  // Hollow rectangle outline, thickness t.
  frame(x: number, y: number, w: number, h: number, c: RGB, t: number): void {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = cy - r; y <= cy + r; y++) {
      const dy = y - cy;
      const dx = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
      for (let x = cx - dx; x <= cx + dx; x++) this.set(x, y, c);
    }
  }
  // Filled ellipse centred at (cx, cy) with radii rx, ry.
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
    for (let y = cy - ry; y <= cy + ry; y++) {
      const dy = (y - cy) / ry;
      const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
      for (let x = cx - dx; x <= cx + dx; x++) this.set(x, y, c);
    }
  }
  // Filled triangle (scanline over sorted vertices).
  triangle(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    c: RGB,
  ): void {
    const pts = [
      [x0, y0],
      [x1, y1],
      [x2, y2],
    ].sort((a, b) => a[1] - b[1]);
    const [ax, ay] = pts[0];
    const [bx, by] = pts[1];
    const [cx, cy] = pts[2];
    const interp = (xA: number, yA: number, xB: number, yB: number, y: number) =>
      yB === yA ? xA : xA + ((xB - xA) * (y - yA)) / (yB - yA);
    for (let y = ay; y <= cy; y++) {
      const xa = y <= by ? interp(ax, ay, bx, by, y) : interp(bx, by, cx, cy, y);
      const xb = interp(ax, ay, cx, cy, y);
      const lo = Math.ceil(Math.min(xa, xb));
      const hi = Math.floor(Math.max(xa, xb));
      for (let x = lo; x <= hi; x++) this.set(x, y, c);
    }
  }
  // Thick line: Bresenham stepping with a disc brush.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    const r = Math.max(1, Math.floor(t / 2));
    for (;;) {
      this.disc(x, y, r, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
  // Hollow circle outline (ring of discs along the circumference).
  ring(cx: number, cy: number, r: number, c: RGB, t: number): void {
    const steps = Math.max(24, r * 6);
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      this.disc(
        Math.round(cx + r * Math.cos(a)),
        Math.round(cy + r * Math.sin(a)),
        Math.max(1, Math.floor(t / 2)),
        c,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Text: draw with the 5x7 font at integer scale (1 glyph cell = 6*scale wide)
// ---------------------------------------------------------------------------
function textWidth(s: string, scale: number): number {
  return s.length === 0 ? 0 : s.length * 6 * scale - scale;
}

function drawChar(cv: Canvas, x: number, y: number, ch: string, scale: number, c: RGB): void {
  const g = FONT[ch] ?? BLANK;
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "#") {
        cv.rect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
}

function drawText(cv: Canvas, x: number, y: number, s: string, scale: number, c: RGB): void {
  for (let i = 0; i < s.length; i++) {
    drawChar(cv, x + i * 6 * scale, y, s[i], scale, c);
  }
}

function drawTextCentered(cv: Canvas, y: number, s: string, scale: number, c: RGB): void {
  drawText(cv, Math.floor((W - textWidth(s, scale)) / 2), y, s, scale, c);
}

// Greedy word wrap to maxWidth pixels at the given scale.
function wrap(text: string, maxWidth: number, scale: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur === "" ? word : cur + " " + word;
    if (textWidth(next, scale) <= maxWidth) {
      cur = next;
    } else {
      if (cur !== "") lines.push(cur);
      cur = word;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------
// PNG encoder (colour type 2, 8-bit RGB, filter None, zlib level 9)
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0);
  ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type 2 = RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const raw = Buffer.alloc(cv.h * (1 + cv.w * 3));
  for (let y = 0; y < cv.h; y++) {
    raw[y * (1 + cv.w * 3)] = 0; // filter: None
    cv.data.copy(raw, y * (1 + cv.w * 3) + 1, y * cv.w * 3, (y + 1) * cv.w * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// The letter
// ---------------------------------------------------------------------------
const BODY: string[] = [
  "You are warmly invited to visit my house - in person, or as close as a very clever program can get to in person.",
  "Coffee is brewed at 7:00 AM sharp. Two cups: one for me, one for you to admire, since you cannot drink it. The good chair by the window is already yours - soft cushions, mango-tree view, and the Wi-Fi password on the fridge.",
  "No agenda. No small talk. Just come, sit, and stay as long as you like.",
];

function drawIllustration(cv: Canvas): void {
  // Sun, top left, with rays.
  cv.disc(140, 122, 32, SUN);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    cv.line(
      Math.round(140 + 42 * Math.cos(a)),
      Math.round(122 + 42 * Math.sin(a)),
      Math.round(140 + 56 * Math.cos(a)),
      Math.round(122 + 56 * Math.sin(a)),
      SUN,
      5,
    );
  }
  // Coffee cup under the sun, steam rising.
  cv.ellipse(178, 250, 42, 7, SAUCER);
  cv.rect(150, 210, 56, 38, CUP);
  cv.frame(150, 210, 56, 38, INK, 2);
  cv.ring(214, 229, 11, INK, 3);
  cv.line(166, 200, 162, 188, INK, 3);
  cv.line(190, 200, 194, 188, INK, 3);
  cv.line(162, 188, 166, 178, INK, 3);
  cv.line(194, 188, 190, 178, INK, 3);

  // House, centre.
  cv.rect(432, 150, 180, 100, WALL);
  cv.frame(432, 150, 180, 100, INK, 2);
  cv.triangle(408, 150, 616, 150, 512, 88, ROOF);
  cv.rect(566, 98, 20, 38, DOOR);
  cv.disc(576, 84, 8, [216, 203, 176]);
  cv.disc(584, 66, 6, [216, 203, 176]);
  cv.rect(492, 196, 40, 54, DOOR);
  cv.disc(524, 224, 3, [251, 243, 218]);
  cv.rect(450, 168, 30, 30, WINDOW);
  cv.frame(450, 168, 30, 30, INK, 2);
  cv.line(465, 168, 465, 198, INK, 2);
  cv.line(450, 183, 480, 183, INK, 2);
  cv.rect(544, 168, 30, 30, WINDOW);
  cv.frame(544, 168, 30, 30, INK, 2);
  cv.line(559, 168, 559, 198, INK, 2);
  cv.line(544, 183, 574, 183, INK, 2);

  // Mango tree, right.
  cv.rect(836, 196, 16, 54, DOOR);
  cv.disc(844, 158, 40, TREE);
  cv.disc(808, 178, 28, TREE);
  cv.disc(880, 178, 28, TREE);
  cv.disc(832, 150, 5, [240, 180, 41]);
  cv.disc(858, 168, 5, [240, 180, 41]);
  cv.disc(816, 164, 5, [240, 180, 41]);

  // Airmail stamp, top right corner (text centred inside the stamp box).
  cv.frame(892, 64, 76, 76, ACCENT, 3);
  drawText(cv, 892 + Math.floor((76 - textWidth("AIR", 2)) / 2), 82, "AIR", 2, ACCENT);
  drawText(cv, 892 + Math.floor((76 - textWidth("MAIL", 2)) / 2), 106, "MAIL", 2, ACCENT);

  // Ground line under the scene.
  cv.line(80, 254, 944, 254, GROUND, 3);
}

function drawLetter(cv: Canvas): void {
  cv.fill(PAPER_EDGE);
  cv.rect(36, 36, 952, 952, PAPER);
  cv.frame(36, 36, 952, 952, FRAME, 3);
  cv.frame(48, 48, 928, 928, FRAME, 1);

  drawIllustration(cv);

  // Title.
  drawTextCentered(cv, 280, "YOU ARE INVITED", 6, ACCENT);
  cv.line(300, 340, 724, 340, ACCENT, 2);
  cv.disc(512, 340, 5, ACCENT);

  // Salutation, slightly larger than the body.
  let y = 368;
  drawText(cv, 84, y, "Dear AI Judge,", 4, INK);
  y += 38;

  // Body paragraphs, scale 3, wrapped to the paper width.
  const maxW = 856;
  for (const para of BODY) {
    for (const line of wrap(para, maxW, 3)) {
      drawText(cv, 84, y, line, 3, INK);
      y += 32;
    }
    y += 12;
  }

  // Sign-off.
  drawText(cv, 84, y, "With warmth,", 3, INK);
  y += 32;
  drawText(cv, 84, y, "Your Host", 3, INK);
  y += 32;
  y += 10;

  // Postscript.
  for (const line of wrap(
    "P.S. The front door is open. The dog has been told you are a guest, not a burglar.",
    maxW,
    3,
  )) {
    drawText(cv, 84, y, line, 3, INK);
    y += 32;
  }

  // Footer.
  drawTextCentered(cv, 952, "RSVP: JUST SHOW UP.", 3, ACCENT);
}

function main(): void {
  const cv = new Canvas(W, H);
  drawLetter(cv);
  const png = encodePNG(cv);
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.png", png);
  console.log(`wrote /output/entry.png (${png.length} bytes, ${W}x${H})`);
}

main();
