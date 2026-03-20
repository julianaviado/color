// ─────────────────────────────────────────────
// Gift Recommendations by Season
// Each item links to an Amazon search or curated URL.
// Update the `url` fields with affiliate links once
// you have an Amazon Associates account.
// ─────────────────────────────────────────────

const GIFT_BASE = {
  Spring: [
    {
      category: 'Accessories',
      items: [
        { name: 'Gold-toned scarf in warm coral or peach', url: 'https://www.amazon.com/s?k=coral+scarf+warm+tones&tag=YOUR_TAG' },
        { name: 'Warm gold jewelry set', url: 'https://www.amazon.com/s?k=gold+jewelry+warm+tones&tag=YOUR_TAG' },
        { name: 'Coral or turquoise handbag', url: 'https://www.amazon.com/s?k=coral+handbag&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Home & Lifestyle',
      items: [
        { name: 'Warm terracotta or peach candle set', url: 'https://www.amazon.com/s?k=peach+terracotta+candle&tag=YOUR_TAG' },
        { name: 'Golden floral arrangement', url: 'https://www.amazon.com/s?k=warm+floral+arrangement&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Beauty',
      items: [
        { name: 'Warm peachy-coral lip palette', url: 'https://www.amazon.com/s?k=coral+warm+lip+palette&tag=YOUR_TAG' },
        { name: 'Golden bronzer or highlighter', url: 'https://www.amazon.com/s?k=golden+bronzer+highlighter&tag=YOUR_TAG' },
      ],
    },
  ],

  Summer: [
    {
      category: 'Accessories',
      items: [
        { name: 'Dusty rose or lavender silk scarf', url: 'https://www.amazon.com/s?k=dusty+rose+silk+scarf&tag=YOUR_TAG' },
        { name: 'Silver jewelry with soft stones', url: 'https://www.amazon.com/s?k=silver+jewelry+rose+quartz&tag=YOUR_TAG' },
        { name: 'Periwinkle or mauve tote bag', url: 'https://www.amazon.com/s?k=periwinkle+mauve+tote&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Home & Lifestyle',
      items: [
        { name: 'Soft lavender or powder blue candle', url: 'https://www.amazon.com/s?k=lavender+powder+blue+candle&tag=YOUR_TAG' },
        { name: 'Dusty rose stationery set', url: 'https://www.amazon.com/s?k=dusty+rose+stationery&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Beauty',
      items: [
        { name: 'Cool-toned berry lip color', url: 'https://www.amazon.com/s?k=cool+berry+lip+color&tag=YOUR_TAG' },
        { name: 'Soft pink or mauve eyeshadow palette', url: 'https://www.amazon.com/s?k=mauve+eyeshadow+palette&tag=YOUR_TAG' },
      ],
    },
  ],

  Autumn: [
    {
      category: 'Accessories',
      items: [
        { name: 'Rust or terracotta wool scarf', url: 'https://www.amazon.com/s?k=rust+terracotta+scarf&tag=YOUR_TAG' },
        { name: 'Bronze or copper jewelry', url: 'https://www.amazon.com/s?k=bronze+copper+jewelry&tag=YOUR_TAG' },
        { name: 'Camel or chocolate leather bag', url: 'https://www.amazon.com/s?k=camel+leather+bag&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Home & Lifestyle',
      items: [
        { name: 'Warm amber or cinnamon candle set', url: 'https://www.amazon.com/s?k=amber+cinnamon+candle+set&tag=YOUR_TAG' },
        { name: 'Earthy toned throw blanket', url: 'https://www.amazon.com/s?k=earthy+tones+throw+blanket&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Beauty',
      items: [
        { name: 'Warm earthy eyeshadow palette', url: 'https://www.amazon.com/s?k=warm+earthy+eyeshadow+palette&tag=YOUR_TAG' },
        { name: 'Terracotta or brick lip color', url: 'https://www.amazon.com/s?k=terracotta+brick+lip+color&tag=YOUR_TAG' },
      ],
    },
  ],

  Winter: [
    {
      category: 'Accessories',
      items: [
        { name: 'Icy blue or fuchsia silk scarf', url: 'https://www.amazon.com/s?k=icy+blue+silk+scarf&tag=YOUR_TAG' },
        { name: 'Silver or platinum jewelry', url: 'https://www.amazon.com/s?k=silver+platinum+jewelry+set&tag=YOUR_TAG' },
        { name: 'Black or deep navy structured bag', url: 'https://www.amazon.com/s?k=black+navy+structured+bag&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Home & Lifestyle',
      items: [
        { name: 'Clean white or cool grey candle', url: 'https://www.amazon.com/s?k=white+grey+luxury+candle&tag=YOUR_TAG' },
        { name: 'Icy silver photo frame or decor', url: 'https://www.amazon.com/s?k=silver+photo+frame+decor&tag=YOUR_TAG' },
      ],
    },
    {
      category: 'Beauty',
      items: [
        { name: 'Bold cool-red or fuchsia lip', url: 'https://www.amazon.com/s?k=cool+red+fuchsia+lipstick&tag=YOUR_TAG' },
        { name: 'Cool plum or icy highlight palette', url: 'https://www.amazon.com/s?k=cool+plum+highlight+palette&tag=YOUR_TAG' },
      ],
    },
  ],
};

export function getGiftRecommendations(primarySeason) {
  return GIFT_BASE[primarySeason] ?? GIFT_BASE.Spring;
}
