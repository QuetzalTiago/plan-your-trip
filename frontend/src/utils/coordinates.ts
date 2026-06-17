/**
 * Replace coordinate patterns with Google Maps links
 */
export function replaceCoordinatesWithLinks(text: string): string {
  // Regex to match: (latitude: NUMBER, longitude: NUMBER)
  // Matches both positive and negative numbers with optional decimals
  const coordPattern =
    /\(latitude:\s*(-?\d+\.?\d*),\s*longitude:\s*(-?\d+\.?\d*)\)/gi;

  return text.replace(coordPattern, (_match, lat, lng) => {
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    return `[(view on maps)](${googleMapsUrl})`;
  });
}
