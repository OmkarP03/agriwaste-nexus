// ═══════════════════════════════════════════════════════
//  AgriWaste Nexus — background imagery
//  Swap any path below to change the photo used in that
//  spot. Files live in frontend/public/images/.
// ═══════════════════════════════════════════════════════

export const IMG = {
  hero:        '/images/bg-hero.jpg',         // dashboard hero — crop residue being loaded
  biochar:     '/images/bg-biochar.jpg',      // biochar / pyrolysis
  biogas:      '/images/bg-biogas.jpg',       // biogas plant
  carbon:      '/images/bg-carbon.jpg',       // carbon market / green energy
  marketplace: '/images/bg-marketplace.jpg',  // farm waste marketplace
  field:       '/images/bg-field.jpg',        // farmland / environment
};

// Dark green gradient overlays — always used behind white text
export const OVERLAY_STRONG = 'linear-gradient(rgba(23,74,39,0.88), rgba(23,74,39,0.66))';
export const OVERLAY_MID    = 'linear-gradient(rgba(23,74,39,0.80), rgba(23,74,39,0.52))';
export const OVERLAY_SOFT   = 'linear-gradient(rgba(23,74,39,0.75), rgba(23,74,39,0.45))';

/**
 * Build a background-image style: gradient overlay on top of a photo.
 * Never place text on a photo without one of these overlays.
 */
export function bgImage(src, overlay = OVERLAY_MID) {
  return { backgroundImage: overlay + ', url("' + src + '")' };
}

export const CROP_EMOJI = {
  rice: '🌾', wheat: '🌿', maize: '🌽',
  sugarcane: '🎋', cotton: '🌼', soybean: '🫘',
};

export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export const compactInr = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + ' Cr';
  if (v >= 100000)   return '₹' + (v / 100000).toFixed(2) + ' L';
  if (v >= 1000)     return '₹' + (v / 1000).toFixed(1) + 'K';
  return '₹' + v.toLocaleString('en-IN');
};

export const num = (n, d = 1) => Number(n || 0).toFixed(d);
