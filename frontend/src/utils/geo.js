// Great-circle distance between two points, in kilometres.
// Replaces the hardcoded distanceKm that made every plant the same
// distance away no matter where the farmer actually was.
export function haversineKm(a, b) {
  if (!a || !b) return null;

  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return +(2 * R * Math.asin(Math.sqrt(h))).toFixed(1);
}

/** Google Maps directions from the farmer's position to a plant. */
export function directionsUrl(from, to) {
  const dest = `${to.lat},${to.lng}`;
  return from
    ? `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${dest}`
    : `https://www.google.com/maps/search/?api=1&query=${dest}`;
}
