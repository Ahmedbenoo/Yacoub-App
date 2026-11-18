export async function getCurrentCoordinates(): Promise<{ latitude: number; longitude: number }> {
  const geo = globalThis.navigator?.geolocation;
  if (!geo?.getCurrentPosition) {
    throw new Error('unavailable');
  }

  return new Promise((resolve, reject) => {
    geo.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => reject(new Error('denied')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30_000 },
    );
  });
}

export function mapsLinkFor(latitude: number, longitude: number) {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

export function formatLocationAddress(latitude: number, longitude: number, currentLabel: string) {
  return `${currentLabel} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})\n${mapsLinkFor(latitude, longitude)}`;
}
