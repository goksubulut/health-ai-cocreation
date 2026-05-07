export const DISCOVER_IMAGE_URLS = [
  '/assets/discover/discover-01.png',
  '/assets/discover/discover-02.png',
  '/assets/discover/discover-03.png',
  '/assets/discover/discover-04.png',
  '/assets/discover/discover-05.png',
  '/assets/discover/discover-06.png',
  '/assets/discover/discover-07.png',
  '/assets/discover/discover-08.png',
  '/assets/discover/discover-09.png',
  '/assets/discover/discover-10.png',
  '/assets/discover/discover-11.png',
  '/assets/discover/discover-12.png',
  '/assets/discover/discover-13.png',
  '/assets/discover/discover-14.png',
  '/assets/discover/discover-15.png',
];

function toStableNumber(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return Math.abs(seed);
  const text = String(seed ?? '');
  const digits = text.replace(/\D/g, '');
  if (digits) return Math.abs(parseInt(digits, 10));
  return text.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export function getDiscoverImageForSeed(seed) {
  const list = DISCOVER_IMAGE_URLS;
  if (!list.length) return '/assets/mesh_1.png';
  const num = toStableNumber(seed);
  return list[num % list.length];
}
