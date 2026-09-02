/** Free OpenStreetMap (Nominatim) geocoding helpers — no API key required. */

export type GeoPlace = {
  label: string;
  lat: number;
  lng: number;
  street: string;
  city: string;
  postcode: string;
};

const NOMINATIM = "https://nominatim.openstreetmap.org";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state_district?: string;
  postcode?: string;
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
};

function toPlace(r: NominatimResult): GeoPlace {
  const a = r.address ?? {};
  const street = [a.house_number, a.road, a.neighbourhood ?? a.suburb].filter(Boolean).join(", ");
  return {
    label: r.display_name ?? "",
    lat: Number(r.lat ?? 0),
    lng: Number(r.lon ?? 0),
    street: street || (r.display_name ?? "").split(",").slice(0, 2).join(", "),
    city: a.city ?? a.town ?? a.village ?? a.state_district ?? "",
    postcode: a.postcode ?? "",
  };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=pk&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search is unavailable right now.");
  const json = (await res.json()) as NominatimResult[];
  return json.map(toPlace).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<GeoPlace | null> {
  const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const json = (await res.json()) as NominatimResult;
  if (!json?.lat) return null;
  return { ...toPlace(json), lat, lng };
}
