import pako from 'pako';

/**
 * Extracts the average RGB color from a 1×1 or very small PNG
 * encoded as a base64 string (with or without data-URI prefix).
 *
 * Works with colorType 2 (RGB) and colorType 6 (RGBA).
 */
export function extractColorFromBase64PNG(base64) {
  try {
    const pure = base64.replace(/^data:image\/png;base64,/, '');
    const bytes = base64ToBytes(pure);

    // Validate PNG signature
    const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
      if (bytes[i] !== PNG_SIG[i]) throw new Error('Not a PNG');
    }

    let offset = 8;
    let colorType = 2;
    const idatBytes = [];

    while (offset < bytes.length - 4) {
      const chunkLen = readUint32BE(bytes, offset);
      const type = readChunkType(bytes, offset + 4);

      if (type === 'IHDR') {
        colorType = bytes[offset + 17];
      } else if (type === 'IDAT') {
        for (let i = 0; i < chunkLen; i++) {
          idatBytes.push(bytes[offset + 8 + i]);
        }
      } else if (type === 'IEND') {
        break;
      }

      offset += 12 + chunkLen;
    }

    // Decompress IDAT (full zlib stream)
    const compressed = new Uint8Array(idatBytes);
    const raw = pako.inflate(compressed);

    // For a 1×1 image every scanline has 1 filter byte then pixel data
    // colorType 2 = RGB (3 bytes/px), colorType 6 = RGBA (4 bytes/px)
    const bytesPerPixel = colorType === 6 ? 4 : 3;
    const r = raw[1];
    const g = raw[2];
    const b = raw[3];

    return { r, g, b };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Color name lookup
// ─────────────────────────────────────────────

const COLOR_NAMES = [
  { name: 'Red',            r: 220,  g: 20,   b: 20  },
  { name: 'Crimson',        r: 180,  g: 10,   b: 40  },
  { name: 'Coral',          r: 255,  g: 120,  b: 90  },
  { name: 'Salmon',         r: 250,  g: 128,  b: 114 },
  { name: 'Orange Red',     r: 255,  g: 80,   b: 0   },
  { name: 'Orange',         r: 255,  g: 140,  b: 0   },
  { name: 'Amber',          r: 255,  g: 180,  b: 0   },
  { name: 'Golden Yellow',  r: 240,  g: 200,  b: 20  },
  { name: 'Yellow',         r: 255,  g: 230,  b: 30  },
  { name: 'Lime Green',     r: 100,  g: 210,  b: 50  },
  { name: 'Apple Green',    r: 80,   g: 170,  b: 60  },
  { name: 'Emerald',        r: 10,   g: 150,  b: 80  },
  { name: 'Forest Green',   r: 20,   g: 100,  b: 40  },
  { name: 'Olive',          r: 100,  g: 110,  b: 30  },
  { name: 'Sage Green',     r: 130,  g: 160,  b: 120 },
  { name: 'Mint',           r: 160,  g: 220,  b: 190 },
  { name: 'Teal',           r: 10,   g: 150,  b: 140 },
  { name: 'Turquoise',      r: 60,   g: 200,  b: 190 },
  { name: 'Cyan',           r: 0,    g: 210,  b: 220 },
  { name: 'Sky Blue',       r: 100,  g: 180,  b: 230 },
  { name: 'Powder Blue',    r: 160,  g: 195,  b: 225 },
  { name: 'Cornflower',     r: 100,  g: 140,  b: 220 },
  { name: 'Royal Blue',     r: 30,   g: 70,   b: 200 },
  { name: 'Navy',           r: 15,   g: 30,   b: 110 },
  { name: 'Periwinkle',     r: 140,  g: 140,  b: 215 },
  { name: 'Lavender',       r: 180,  g: 160,  b: 220 },
  { name: 'Purple',         r: 130,  g: 40,   b: 180 },
  { name: 'Plum',           r: 110,  g: 30,   b: 100 },
  { name: 'Violet',         r: 150,  g: 50,   b: 210 },
  { name: 'Magenta',        r: 220,  g: 30,   b: 170 },
  { name: 'Fuchsia',        r: 210,  g: 0,    b: 130 },
  { name: 'Hot Pink',       r: 255,  g: 60,   b: 140 },
  { name: 'Pink',           r: 255,  g: 150,  b: 180 },
  { name: 'Dusty Rose',     r: 190,  g: 120,  b: 130 },
  { name: 'Blush',          r: 240,  g: 185,  b: 185 },
  { name: 'Burgundy',       r: 120,  g: 20,   b: 40  },
  { name: 'Maroon',         r: 100,  g: 15,   b: 20  },
  { name: 'Rust',           r: 175,  g: 70,   b: 25  },
  { name: 'Terracotta',     r: 195,  g: 95,   b: 65  },
  { name: 'Burnt Orange',   r: 200,  g: 110,  b: 30  },
  { name: 'Copper',         r: 185,  g: 110,  b: 50  },
  { name: 'Bronze',         r: 160,  g: 100,  b: 40  },
  { name: 'Camel',          r: 195,  g: 150,  b: 105 },
  { name: 'Tan',            r: 210,  g: 175,  b: 130 },
  { name: 'Peach',          r: 255,  g: 200,  b: 160 },
  { name: 'Warm Beige',     r: 235,  g: 210,  b: 180 },
  { name: 'Ivory',          r: 250,  g: 245,  b: 220 },
  { name: 'Cream',          r: 250,  g: 240,  b: 215 },
  { name: 'Off-White',      r: 245,  g: 240,  b: 235 },
  { name: 'White',          r: 250,  g: 250,  b: 250 },
  { name: 'Light Grey',     r: 210,  g: 210,  b: 210 },
  { name: 'Silver',         r: 185,  g: 190,  b: 195 },
  { name: 'Grey',           r: 150,  g: 150,  b: 150 },
  { name: 'Dark Grey',      r: 90,   g: 90,   b: 90  },
  { name: 'Charcoal',       r: 50,   g: 50,   b: 55  },
  { name: 'Black',          r: 20,   g: 20,   b: 20  },
  { name: 'Chocolate',      r: 105,  g: 55,   b: 30  },
  { name: 'Dark Brown',     r: 70,   g: 40,   b: 25  },
  { name: 'Warm Brown',     r: 140,  g: 85,   b: 55  },
  { name: 'Taupe',          r: 160,  g: 145,  b: 130 },
  { name: 'Warm Taupe',     r: 180,  g: 160,  b: 135 },
  { name: 'Warm Mauve',     r: 185,  g: 145,  b: 145 },
  { name: 'Cool Mauve',     r: 175,  g: 135,  b: 155 },
  { name: 'Dusty Pink',     r: 200,  g: 155,  b: 155 },
  { name: 'Nude',           r: 225,  g: 190,  b: 165 },
  { name: 'Mustard',        r: 210,  g: 165,  b: 30  },
  { name: 'Gold',           r: 220,  g: 180,  b: 50  },
  { name: 'Champagne',      r: 245,  g: 225,  b: 185 },
];

/**
 * Finds the nearest named color for a given RGB value
 * using perceptually-weighted Euclidean distance.
 */
export function getNearestColorName(r, g, b) {
  let minDist = Infinity;
  let closest = 'Unknown';

  for (const c of COLOR_NAMES) {
    const rMean = (r + c.r) / 2;
    const dr = r - c.r, dg = g - c.g, db = b - c.b;
    const dist = Math.sqrt(
      (2 + rMean / 256) * dr * dr +
      4 * dg * dg +
      (2 + (255 - rMean) / 256) * db * db
    );
    if (dist < minDist) { minDist = dist; closest = c.name; }
  }

  return closest;
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function readUint32BE(bytes, off) {
  return (
    ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0
  );
}

function readChunkType(bytes, off) {
  return String.fromCharCode(bytes[off], bytes[off + 1], bytes[off + 2], bytes[off + 3]);
}
