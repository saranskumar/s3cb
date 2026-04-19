export const HEROES = ['Zeus', 'Apollo', 'Athena', 'Ares', 'Hera', 'Hermes', 'Artemis', 'Hephaestus', 'Demeter'];
export const VIBES = ['Chill', 'Focus', 'Zen', 'Hype', 'Flow', 'Deep', 'Wave', 'Peak', 'Vibe'];
export const BOTS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Sigma', 'Omega', 'Zeta', 'Epsilon', 'Theta'];
export const PIXELS = ['Mario', 'Link', 'Samus', 'Sonic', 'Tails', 'Kirby', 'Zelda', 'Ryu', 'Ken'];

export function getHeroUrl(seed) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=dde7c7,bfd8bd,77bfa3,fb923c,f0f9f5`;
}

export function getVibeUrl(seed) {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=dde7c7,bfd8bd,77bfa3,fb923c,f0f9f5`;
}

export function getBotUrl(seed) {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=dde7c7,bfd8bd,77bfa3,fb923c,f0f9f5`;
}

export function getPixelUrl(seed) {
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}&backgroundColor=dde7c7,bfd8bd,77bfa3,fb923c,f0f9f5`;
}

export function getSuperheroAvatar(nameOrEmail) {
  if (!nameOrEmail) return `https://api.dicebear.com/7.x/bottts/svg?seed=Anonymous&backgroundColor=dde7c7,f0f9f5`;
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nameOrEmail)}&backgroundColor=dde7c7,bfd8bd,77bfa3,fb923c,f0f9f5`;
}
