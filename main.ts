// news-image-20261120 — "The World in One Page": Friday 20 November 2026.
// A broadsheet front page drawn programmatically with a hand-made 5x7
// bitmap font and a hand-rolled PNG encoder. Node 22, standard library
// only, no network, no clock, no randomness: two runs write identical bytes.
// Every story below was verified against a live wire on 20 Nov 2026 (UTC)
// or is an event of Friday 20 Nov itself; near-misses that broke on an
// earlier day are listed in the DATE CHECK box, never as stories.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- font --
// 5x7 pixel glyphs, drawn by hand in this session. Lowercase is rendered
// as capitals (broadsheet style); every other character maps to a glyph
// below, unknown characters render as a blank.
const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '$': ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '*': ['00000', '10101', '01110', '11111', '01110', '10101', '00000'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '@': ['01110', '10001', '10111', '10101', '10110', '10000', '01110'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '>': ['10000', '01000', '00100', '00010', '00100', '01000', '10000'],
  '<': ['00001', '00010', '00100', '01000', '00100', '00010', '00001'],
  '~': ['00000', '00000', '01001', '10110', '00000', '00000', '00000'],
  '^': ['00100', '01010', '10001', '00000', '00000', '00000', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
const BLANK = FONT[' '];
function glyph(ch: string): string[] {
  const up = ch.toUpperCase();
  return FONT[up] ?? FONT[ch] ?? BLANK;
}
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

// ------------------------------------------------------------- canvas --
type RGB = [number, number, number];
const W = 1024;
const H = 1024;
const PAPER: RGB = [247, 242, 231];
const INK: RGB = [26, 26, 26];
const RED: RGB = [185, 28, 28];
const NAVY: RGB = [30, 58, 95];
const GOLD: RGB = [180, 130, 30];
const GREY: RGB = [110, 105, 95];
const LGREY: RGB = [214, 207, 194];
const WHITE: RGB = [255, 255, 255];
const SKIN1: RGB = [232, 190, 150];
const SKIN2: RGB = [210, 165, 120];
const SKIN3: RGB = [240, 205, 170];

class Canvas {
  buf: Uint8Array;
  constructor() {
    this.buf = new Uint8Array(W * H * 3);
    this.fill(PAPER);
  }
  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = c[0];
      this.buf[i * 3 + 1] = c[1];
      this.buf[i * 3 + 2] = c[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, c);
  }
  frame(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
    this.rect(x, y, w, t, c);
    this.rect(x, y + h - t, w, t, c);
    this.rect(x, y, t, h, c);
    this.rect(x + w - t, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r) this.px(cx + x, cy + y, c);
  }
  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 2) {
      const t = (a * Math.PI) / 180;
      this.px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
    }
  }
  poly(pts: [number, number][], c: RGB): void {
    // Scanline fill of a simple polygon.
    let minY = H;
    let maxY = 0;
    for (const [, y] of pts) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[(i + 1) % pts.length];
        if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
          xs.push(Math.round(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = xs[k]; x <= xs[k + 1]; x++) this.px(x, y, c);
    }
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      this.line(x0, y0, x1, y1, c);
    }
  }
  text(s: string, x: number, y: number, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of s) {
      const g = glyph(ch);
      for (let r = 0; r < 7; r++)
        for (let col = 0; col < 5; col++)
          if (g[r][col] === '1') this.rect(cx + col * scale, y + r * scale, scale, scale, c);
      cx += 6 * scale;
    }
  }
  textC(s: string, cx: number, y: number, scale: number, c: RGB): void {
    this.text(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
  }
  // Word-wrap into lines of at most maxW pixels; returns lines drawn.
  para(s: string, x: number, y: number, maxW: number, scale: number, c: RGB, lh: number): number {
    const words = s.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (textWidth(t, scale) <= maxW || !cur) cur = t;
      else { lines.push(cur); cur = w; }
    }
    if (cur) lines.push(cur);
    lines.forEach((ln, i) => this.text(ln, x, y + i * lh, scale, c));
    return lines.length;
  }
}

// ------------------------------------------------------------ PNG out --
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter none
    Buffer.from(cv.buf.buffer, cv.buf.byteOffset + y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------- story data --
interface Hero { n: number; kick: string; head: string; body: string; src: string; art: 'chart' | 'draft' | 'people'; }
interface Card { n: number; kick: string; head: string; body: string; src: string; art: string; }
interface Brief { n: number; place: string; line: string; }

const HEROES: Hero[] = [
  {
    n: 1, kick: 'NEW YORK - MARKETS', art: 'chart',
    head: 'Anthropic closes up 17% at $97.17',
    body: 'Opened at $111.50, briefly worth $2tn. The $81.3bn IPO is the largest ever. The offering closes Friday. The Dow falls 1,101.',
    src: 'REUTERS / BBC / CNN',
  },
  {
    n: 2, kick: 'ANTALYA - CLIMATE', art: 'draft',
    head: 'COP31 closing day, fuels cut',
    body: 'Revised draft drops every fossil-fuel mention and the $120bn figure. No deal yet. Final text due midnight.',
    src: 'UNFCCC / REUTERS / THE HINDU',
  },
  {
    n: 3, kick: 'SHENZHEN - AFTERMATH', art: 'people',
    head: 'A day on, Europe answers',
    body: 'Europe says it is ready for talks with Russia. Putin vows a painful reply over the Crimea bridge strikes. Ukraine unmentioned.',
    src: 'BBC / THE TIMES',
  },
];

const CARDS: Card[] = [
  { n: 4, kick: 'ODISHA - STORM', art: 'storm', head: 'Akvan landfall due at noon', body: '100,000+ evacuated. Winds 90-100 km/h, gusts 110. Red alerts in 11 districts.', src: 'IMD' },
  { n: 5, kick: 'KYIV - WAR', art: 'embassy', head: 'EU to summon Russia envoy', body: 'Strikes damage the Austrian and Dutch embassies. 1 killed, 5 hurt. Cathedral hit.', src: 'EURONEWS / AFP' },
  { n: 6, kick: 'TAIZ - YEMEN', art: 'city', head: 'Inside the besieged city', body: 'Residents speak to the BBC: "I tell my son it is just fireworks."', src: 'BBC' },
  { n: 7, kick: 'OTTAWA - TECH', art: 'servers', head: 'Canada bets on AI centres', body: 'Investors pour in as US towns push back against data-centre builds.', src: 'BBC' },
  { n: 8, kick: 'SACRAMENTO - TECH', art: 'chip', head: 'California probes Nvidia', body: 'State targets Nvidia in a China AI chip probe.', src: 'BBC' },
  { n: 9, kick: 'NEW YORK - MARKETS', art: 'placard', head: 'Protests greet the debut', body: 'Rallies in New York and San Francisco against the $2tn listing.', src: 'GUARDIAN' },
  { n: 10, kick: 'MANAMA - ENERGY', art: 'refinery', head: 'Bapco nears full restart', body: 'Bahrain refinery recovers after six strikes on the plant.', src: '20 NOV' },
  { n: 11, kick: 'BRUSSELS - SECURITY', art: 'shield', head: 'NATO meets spy chiefs', body: 'Talks with intelligence chiefs in Brussels.', src: '20 NOV' },
  { n: 12, kick: 'BERLIN - DIPLOMACY', art: 'flag', head: 'Merz sets Ukraine terms', body: 'Sustained support for Kyiv and terms for talks with Russia.', src: '20 NOV' },
  { n: 13, kick: 'WASHINGTON - HEALTH', art: 'virus', head: 'Measles stages a US comeback', body: 'Vaccine fears fuel the return of measles across the US.', src: 'BBC' },
];

const BRIEFS: Brief[] = [
  { n: 14, place: 'KAMPALA', line: 'Survivors of Uganda deadly landslide seek justice at the UN. BBC.' },
  { n: 15, place: 'BOGOTA', line: 'Colombia president earns a reputation for courting controversy. BBC.' },
  { n: 16, place: 'DOHA', line: 'Qatar foreign ministers discuss Gulf developments by phone.' },
  { n: 17, place: 'RIYADH', line: 'Saudi crown prince and CENTCOM chief discuss defence ties.' },
  { n: 18, place: 'GULF', line: 'Gulf Railway to link six nations, cut Hormuz dependence.' },
  { n: 19, place: 'BRUSSELS', line: 'EU takes Austria to court over arrest-warrant rules.' },
  { n: 20, place: 'BEIJING', line: 'Xi: constructive ties with Moscow and Washington are essential.' },
  { n: 21, place: 'NEW DELHI', line: 'Modi opens FICCI centenary meet, pitching growth to 2047.' },
  { n: 22, place: 'NEW DELHI', line: 'India signs Rs 1,976-crore navy missile deal with Israel Aerospace.' },
  { n: 23, place: 'TBILISI', line: 'Girl, 3, pulled from rubble eight hours after a gas blast.' },
  { n: 24, place: 'WASHINGTON', line: 'Trump tells European leaders Putin wants to end the war.' },
  { n: 25, place: 'WELLINGTON', line: 'India and New Zealand resume their Test on day two.' },
  { n: 26, place: 'ASIA', line: "Women's Asian Hockey Champions Trophy begins." },
  { n: 27, place: 'MUMBAI', line: 'Cumin sodas take on cola giants in India. BBC.' },
  { n: 28, place: 'DHAKA', line: "Fire at ancestral home of Bangladesh's Yunus; arson suspected." },
  { n: 29, place: 'LONDON', line: 'UK and EU leaders meet for a summit today.' },
  { n: 30, place: 'NEW YORK', line: 'S&P falls for a sixth straight day; VIX near 29.' },
  { n: 31, place: 'LONDON', line: 'Gold slides to $3,624, lowest since September 2025.' },
  { n: 32, place: 'TOKYO', line: 'Bitcoin slides about 2.4% to near $61,500.' },
  { n: 33, place: 'SAO PAULO', line: 'Petrobras boosts Europe exports on a Mercosur tax break.' },
  { n: 34, place: 'NEW YORK', line: 'Nasdaq lists a new semiconductor ETF, ISMH, today.' },
];

const STATS: [string, string][] = [
  ['$81.3bn', 'ANTHROPIC IPO, LARGEST EVER'],
  ['$97.17', 'ANTHROPIC CLOSE, UP 17%'],
  ['100,000+', 'EVACUATED AHEAD OF AKVAN'],
  ['144-80', 'COP31 DRAFT PARAGRAPHS'],
  ['1,101', 'DOW POINTS LOST'],
  ['$3,624', 'GOLD, LOWEST SINCE SEPT 2025'],
];

const REGIONS: [string, number, RGB][] = [
  ['ASIA-PACIFIC', 8, RED],
  ['EUROPE', 6, NAVY],
  ['AMERICAS', 10, GOLD],
  ['MIDEAST', 5, [0, 120, 90]],
  ['AFRICA', 1, [120, 70, 160]],
  ['OCEANIA', 1, [200, 90, 40]],
  ['WORLD', 3, GREY],
];

const DATECHECK =
  'Shenzhen summit itself (Thu 19 Nov) - ICJ Myanmar ruling (Thu 19 Nov) - Han Duck-soo verdict (Thu 19 Nov) - ' +
  'Pete Rose pardon (Thu 19 Nov) - Fiona the hippo dies (Thu 19 Nov) - Gaza tank raid ends (Thu 19 Nov) - ' +
  'Senegal boat sinks (Thu 19 Nov) - Van Gogh $190.4m sale (Wed 18 Nov) - Fed minutes (Wed 18 Nov) - ' +
  'Voyager 1 one light-day (Wed 18 Nov) - Qeshm Island strikes (Tue 17 Nov) - Gemini 4 Neon (Wed 18 Nov) - ' +
  'Pew Islam projection (not that day\'s news)';

// ------------------------------------------------------------ artwork --
// Small flat illustrations, one per story. All shapes are drawn from
// numbers below; no image is copied in.
function drawChart(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, WHITE);
  cv.frame(x, y, w, h, LGREY, 1);
  const base = y + h - 18;
  const vals: [string, number, RGB][] = [
    ['$83', 83, NAVY],
    ['$111.50', 111.5, RED],
    ['$97.17', 97.17, GOLD],
  ];
  const names = ['IPO', 'OPEN', 'CLOSE'];
  const bw = 52;
  const gap = Math.floor((w - 3 * bw) / 4);
  vals.forEach(([lab, v, c], i) => {
    const bx = x + gap + i * (bw + gap);
    const bh = Math.round(((v / 120) * (h - 34)));
    cv.rect(bx, base - bh, bw, bh, c);
    cv.text(lab, bx + Math.floor((bw - textWidth(lab, 1)) / 2), base - bh - 10, 1, INK);
    cv.text(names[i], bx + Math.floor((bw - textWidth(names[i], 1)) / 2), base + 4, 1, GREY);
  });
  cv.line(x + 6, base, x + w - 6, base, INK);
}

function drawDraft(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, WHITE);
  cv.frame(x, y, w, h, LGREY, 1);
  const px = x + 12;
  const pw = w - 24;
  // Draft page lines.
  for (let i = 0; i < 2; i++) cv.rect(px, y + 6 + i * 7, pw, 2, LGREY);
  cv.text('FOSSIL FUELS', px, y + 20, 2, RED);
  cv.line(px - 2, y + 28, px + textWidth('FOSSIL FUELS', 2) + 2, y + 28, RED);
  cv.line(px - 2, y + 30, px + textWidth('FOSSIL FUELS', 2) + 2, y + 30, RED);
  cv.text('144 > 80', px, y + 40, 2, INK);
  cv.text('PARAS', px + textWidth('144 > 80', 2) + 8, y + 44, 1, GREY);
}

function drawFigure(cv: Canvas, cx: number, y: number, skin: RGB, suit: RGB, hair: RGB, name: string, flag: RGB[]): void {
  // Flag behind the figure.
  const fw = 62;
  const fh = 16;
  const fx = cx - Math.floor(fw / 2);
  const fy = y;
  const stripe = Math.floor(fh / flag.length);
  flag.forEach((c, i) => cv.rect(fx, fy + i * stripe, fw, stripe, c));
  if (name === 'TRUMP') cv.rect(fx, fy, 22, 8, NAVY);
  if (name === 'XI') cv.circle(fx + 8, fy + 8, 2, GOLD);
  cv.frame(fx, fy, fw, fh, INK, 1);
  // Head, hair, suit, tie, table, name plate. Everything ends by y + 67.
  cv.circle(cx, y + 26, 9, skin);
  cv.rect(cx - 9, y + 18, 18, 5, hair);
  cv.rect(cx - 14, y + 36, 28, 18, suit);
  cv.rect(cx - 3, y + 36, 6, 18, WHITE);
  cv.rect(cx - 1, y + 36, 3, 11, RED);
  cv.rect(cx - 30, y + 54, 60, 3, [120, 72, 40]);
  cv.rect(cx - 21, y + 58, 42, 10, WHITE);
  cv.frame(cx - 21, y + 58, 42, 10, INK, 1);
  cv.text(name, cx - Math.floor(textWidth(name, 1) / 2), y + 60, 1, INK);
}

function drawPeople(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [235, 228, 210]);
  cv.frame(x, y, w, h, LGREY, 1);
  const third = Math.floor(w / 3);
  drawFigure(cv, x + Math.floor(third / 2), y + 2, SKIN1, NAVY, [220, 200, 120],
    'TRUMP', [RED, WHITE, RED, WHITE, RED]);
  drawFigure(cv, x + third + Math.floor(third / 2), y + 2, SKIN2, [40, 40, 40], INK,
    'XI', [RED, RED, RED]);
  drawFigure(cv, x + 2 * third + Math.floor(third / 2), y + 2, SKIN3, [60, 60, 70], [200, 200, 200],
    'PUTIN', [WHITE, [30, 90, 200], RED]);
}

function drawHeroArt(cv: Canvas, art: string, x: number, y: number, w: number, h: number): void {
  if (art === 'chart') drawChart(cv, x, y, w, h);
  else if (art === 'draft') drawDraft(cv, x, y, w, h);
  else drawPeople(cv, x, y, w, h);
}

function drawCardArt(cv: Canvas, art: string, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, [238, 232, 216]);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);
  if (art === 'storm') {
    cv.ring(cx, cy, 12, NAVY);
    cv.ring(cx, cy, 7, RED);
    cv.circle(cx, cy, 3, INK);
    cv.line(cx - 16, y + h - 6, cx - 12, y + h - 12, NAVY);
    cv.line(cx - 4, y + h - 6, cx, y + h - 12, NAVY);
    cv.line(cx + 8, y + h - 6, cx + 12, y + h - 12, NAVY);
  } else if (art === 'embassy') {
    cv.rect(cx - 20, cy - 4, 40, 14, NAVY);
    cv.rect(cx - 22, cy - 10, 44, 6, INK);
    for (let i = -1; i <= 1; i++) cv.rect(cx + i * 12 - 2, cy - 4, 4, 14, WHITE);
    cv.line(cx + 22, cy - 10, cx + 22, cy - 22, INK);
    cv.rect(cx + 22, cy - 22, 12, 7, RED);
  } else if (art === 'city') {
    cv.rect(cx - 24, cy - 2, 14, 14, NAVY);
    cv.rect(cx - 7, cy - 12, 14, 24, INK);
    cv.rect(cx + 10, cy - 6, 14, 18, NAVY);
    for (let i = 0; i < 3; i++) cv.rect(cx - 3, cy - 8 + i * 6, 6, 3, GOLD);
  } else if (art === 'servers') {
    cv.rect(cx - 22, cy - 12, 20, 24, INK);
    cv.rect(cx + 2, cy - 12, 20, 24, NAVY);
    for (let i = 0; i < 3; i++) {
      cv.rect(cx - 18, cy - 8 + i * 8, 12, 3, [0, 200, 120]);
      cv.rect(cx + 6, cy - 8 + i * 8, 12, 3, [0, 200, 120]);
    }
  } else if (art === 'chip') {
    cv.rect(cx - 11, cy - 11, 22, 22, INK);
    cv.rect(cx - 6, cy - 6, 12, 12, GOLD);
    for (let i = -1; i <= 1; i++) {
      cv.line(cx + i * 8, cy - 16, cx + i * 8, cy - 11, INK);
      cv.line(cx + i * 8, cy + 11, cx + i * 8, cy + 16, INK);
      cv.line(cx - 16, cy + i * 8, cx - 11, cy + i * 8, INK);
      cv.line(cx + 11, cy + i * 8, cx + 16, cy + i * 8, INK);
    }
  } else if (art === 'placard') {
    cv.line(cx - 12, cy - 12, cx - 12, cy + 14, INK);
    cv.line(cx + 12, cy - 8, cx + 12, cy + 14, INK);
    cv.rect(cx - 22, cy - 14, 20, 12, RED);
    cv.rect(cx + 2, cy - 10, 20, 12, NAVY);
    cv.rect(cx - 19, cy - 11, 14, 2, WHITE);
    cv.rect(cx + 5, cy - 7, 14, 2, WHITE);
  } else if (art === 'refinery') {
    cv.rect(cx - 20, cy - 6, 12, 18, INK);
    cv.rect(cx - 4, cy - 12, 12, 24, NAVY);
    cv.rect(cx + 12, cy - 2, 10, 14, INK);
    cv.circle(cx + 2, cy - 16, 4, RED);
    cv.circle(cx + 2, cy - 16, 2, GOLD);
  } else if (art === 'shield') {
    cv.poly([[cx, cy - 14], [cx + 13, cy - 8], [cx + 13, cy + 4], [cx, cy + 14], [cx - 13, cy + 4], [cx - 13, cy - 8]], NAVY);
    cv.text('*', cx - 3, cy - 5, 1, GOLD);
  } else if (art === 'flag') {
    cv.line(cx - 14, cy - 14, cx - 14, cy + 14, INK);
    cv.rect(cx - 14, cy - 14, 28, 6, INK);
    cv.rect(cx - 14, cy - 8, 28, 6, RED);
    cv.rect(cx - 14, cy - 2, 28, 6, GOLD);
  } else if (art === 'virus') {
    for (let a = 0; a < 360; a += 45) {
      const t = (a * Math.PI) / 180;
      cv.line(cx + Math.round(10 * Math.cos(t)), cy + Math.round(10 * Math.sin(t)),
        cx + Math.round(15 * Math.cos(t)), cy + Math.round(15 * Math.sin(t)), RED);
    }
    cv.circle(cx, cy, 10, NAVY);
    cv.circle(cx - 3, cy - 3, 2, WHITE);
    cv.circle(cx + 4, cy + 3, 2, WHITE);
  }
}

// ------------------------------------------------------------- layout --
function centerPara(cv: Canvas, s: string, cx: number, y: number, maxW: number, scale: number, c: RGB, lh: number): void {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (textWidth(t, scale) <= maxW || !cur) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  lines.forEach((ln, i) => cv.text(ln, cx - Math.floor(textWidth(ln, scale) / 2), y + i * lh, scale, c));
}

function drawBrief(cv: Canvas, x: number, y: number, maxW: number, b: Brief): number {
  const head = b.n + '. ' + b.place + ' - ';
  const words = b.line.split(' ');
  const lines: string[] = [];
  let cur = head;
  for (const w of words) {
    const t = cur + w;
    if (textWidth(t, 1) <= maxW || cur === head) cur = t + ' ';
    else { lines.push(cur.trim()); cur = w + ' '; }
  }
  if (cur.trim()) lines.push(cur.trim());
  lines.forEach((ln, i) => {
    if (i === 0) {
      cv.text(head, x, y, 1, RED);
      cv.text(ln.slice(head.length), x + textWidth(head, 1), y, 1, INK);
    } else {
      cv.text(ln, x, y + i * 8, 1, INK);
    }
  });
  return lines.length * 8 + 2;
}

const CONTINENTS: [number, number][][] = [
  [[-168, 66], [-140, 70], [-120, 72], [-95, 80], [-80, 73], [-60, 60], [-55, 47], [-70, 42], [-75, 35], [-80, 26], [-90, 21], [-97, 16], [-105, 20], [-115, 28], [-125, 40], [-125, 49], [-145, 60], [-165, 60]],
  [[-80, 10], [-60, 8], [-50, 0], [-35, -8], [-40, -20], [-48, -28], [-58, -35], [-65, -40], [-70, -52], [-73, -40], [-80, -20], [-80, -5]],
  [[-17, 15], [-10, 30], [0, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 10], [48, 0], [40, -15], [35, -25], [28, -33], [18, -35], [12, -18], [8, 4], [-8, 5]],
  [[-10, 36], [-9, 43], [-2, 48], [0, 51], [5, 53], [8, 57], [10, 59], [18, 56], [21, 55], [24, 58], [28, 60], [30, 62], [32, 70], [40, 68], [44, 66], [40, 60], [35, 55], [30, 50], [28, 45], [23, 40], [19, 42], [12, 44], [3, 43], [-2, 37]],
  [[32, 70], [45, 68], [55, 70], [70, 72], [90, 75], [110, 76], [130, 72], [150, 70], [170, 66], [178, 65], [170, 60], [162, 55], [158, 50], [150, 45], [142, 40], [135, 35], [130, 33], [127, 35], [122, 38], [120, 30], [115, 23], [108, 18], [105, 10], [100, 8], [95, 15], [90, 22], [85, 20], [80, 13], [77, 8], [72, 20], [65, 25], [60, 25], [55, 28], [50, 30], [45, 30], [40, 32], [36, 36]],
  [[113, -22], [114, -30], [115, -35], [120, -34], [130, -32], [137, -35], [140, -38], [145, -38], [150, -37], [153, -27], [150, -22], [146, -19], [142, -15], [137, -12], [132, -11], [126, -14], [122, -17], [118, -20]],
  [[-5, 50], [-3, 54], [-1, 58], [0, 54], [1, 51]],
  [[139, 35], [141, 38], [140, 41], [142, 44], [140, 42], [138, 37]],
  [[167, -41], [170, -44], [172, -43], [168, -40]],
];

const PINS: [number, number, number, number][] = [
  [1, -74, 41, 0], [2, 30, 37, 0], [3, 114, 22, 0], [4, 85, 19, 0], [5, 30, 50, 0],
  [6, 44, 14, 0], [7, -76, 45, 0], [8, -121, 38, -7], [9, -122, 38, 7], [10, 50, 26, 0],
  [11, 4, 51, -6], [12, 13, 52, 6], [13, -77, 39, 8],
];

function drawMap(cv: Canvas): void {
  const mx = (lon: number): number => Math.round(20 + ((lon + 180) / 360) * 306);
  const my = (lat: number): number => Math.round(722 + ((80 - lat) / 140) * 174);
  for (const cont of CONTINENTS) {
    cv.poly(cont.map(([lo, la]): [number, number] => [mx(lo), my(la)]), [206, 198, 184]);
  }
  for (const [lo, la] of [[100, 0], [110, -2], [120, -5], [130, -3]] as [number, number][]) {
    cv.circle(mx(lo), my(la), 2, [206, 198, 184]);
  }
  for (const [n, lo, la, dy] of PINS) {
    const px = mx(lo);
    const py = my(la) + dy;
    cv.circle(px, py, 6, RED);
    const s = String(n);
    cv.text(s, px - Math.floor(textWidth(s, 1) / 2), py - 3, 1, WHITE);
  }
}

function build(): Canvas {
  const cv = new Canvas();
  cv.frame(4, 4, 1016, 1016, INK, 2);

  // Masthead.
  cv.textC('THE WORLD IN ONE PAGE', 512, 12, 1, GREY);
  cv.textC('Friday 20 November 2026', 512, 26, 6, INK);
  cv.textC('34 STORIES - 7 REGIONS - EVERY CONTINENT', 512, 74, 1, RED);
  cv.rect(16, 88, 992, 2, INK);

  // Kicker band.
  cv.rect(16, 94, 992, 22, RED);
  cv.textC('Anthropic soars, COP31 stalls, Europe answers the summit.', 512, 98, 2, WHITE);

  // Stat strip.
  for (let i = 0; i < STATS.length; i++) {
    const x = 16 + i * 165;
    if (i > 0) cv.rect(x, 122, 1, 44, LGREY);
    const [num, lab] = STATS[i];
    cv.text(num, x + Math.floor((165 - textWidth(num, 3)) / 2), 124, 3, i % 2 === 0 ? RED : NAVY);
    centerPara(cv, lab, x + 82, 148, 157, 1, INK, 9);
  }

  // Region strip.
  {
    let total = 0;
    const segs = REGIONS.map(([name, n, c]) => {
      const t = name + ' ' + n;
      total += 8 + 3 + textWidth(t, 1) + 16;
      return { t, c };
    });
    total -= 16;
    let x = 512 - Math.floor(total / 2);
    for (const s of segs) {
      cv.rect(x, 179, 8, 8, s.c);
      cv.text(s.t, x + 11, 179, 1, INK);
      x += 8 + 3 + textWidth(s.t, 1) + 16;
    }
  }
  cv.rect(16, 196, 992, 1, LGREY);

  // Heroes.
  const hx = [16, 350, 684];
  HEROES.forEach((h, i) => {
    const x0 = hx[i];
    const y0 = 200;
    const w = 322;
    cv.frame(x0, y0, w, 244, LGREY, 1);
    cv.rect(x0, y0, 20, 20, RED);
    cv.text(String(h.n), x0 + 10 - Math.floor(textWidth(String(h.n), 2) / 2), y0 + 3, 2, WHITE);
    cv.text(h.kick, x0 + 26, y0 + 6, 1, RED);
    cv.para(h.head, x0 + 8, y0 + 26, w - 16, 3, INK, 24);
    drawHeroArt(cv, h.art, x0 + 8, y0 + 78, w - 16, 68);
    cv.para(h.body, x0 + 8, y0 + 152, w - 16, 2, INK, 16);
    cv.text(h.src, x0 + 8, y0 + 232, 1, GREY);
  });

  // Small cards.
  CARDS.forEach((c, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x0 = 16 + col * 200;
    const y0 = 452 + row * 126;
    cv.frame(x0, y0, 192, 118, LGREY, 1);
    cv.rect(x0, y0, 16, 16, RED);
    cv.text(String(c.n), x0 + 8 - Math.floor(textWidth(String(c.n), 1) / 2), y0 + 4, 1, WHITE);
    cv.text(c.kick, x0 + 20, y0 + 4, 1, RED);
    cv.text(c.src, x0 + 192 - 6 - textWidth(c.src, 1), y0 + 4, 1, GREY);
    drawCardArt(cv, c.art, x0 + 6, y0 + 18, 180, 30);
    cv.para(c.head, x0 + 6, y0 + 52, 180, 2, INK, 16);
    cv.para(c.body, x0 + 6, y0 + 86, 180, 1, INK, 9);
  });

  // Map + briefs.
  cv.text('WHERE IT HAPPENED', 16, 706, 2, INK);
  drawMap(cv);
  cv.text('Red pins = stories 1-13.', 16, 904, 1, RED);
  cv.text('Positions approximate.', 16, 914, 1, GREY);
  cv.text('ALSO ON FRIDAY 20 NOVEMBER', 344, 706, 2, INK);
  {
    let y = 726;
    for (let i = 0; i < 11; i++) y += drawBrief(cv, 344, y, 326, BRIEFS[i]);
    y = 726;
    for (let i = 11; i < 21; i++) y += drawBrief(cv, 676, y, 326, BRIEFS[i]);
  }
  cv.rect(336, 704, 1, 224, LGREY);

  // DATE CHECK.
  cv.frame(16, 940, 992, 54, RED, 2);
  cv.text('DATE CHECK - LEFT OUT ON PURPOSE BECAUSE THEY BROKE BEFORE FRIDAY:', 24, 945, 1, RED);
  cv.para(DATECHECK, 24, 957, 976, 1, INK, 9);

  // Footer.
  cv.textC('Every story happened, or was first reported, on Friday 20 November 2026.', 512, 1000, 1, GREY);
  cv.textC('Sources: Reuters, AP, AFP, BBC, Al Jazeera, IMD, UNFCCC, Euronews, The Times. All items REPORTED from named sources.', 512, 1010, 1, GREY);
  return cv;
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const png = encodePNG(build());
  writeFileSync(join(outDir, 'entry.png'), png);
}

main();
