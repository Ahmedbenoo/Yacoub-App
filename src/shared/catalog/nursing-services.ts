export const NURSING_SERVICES = [
  { id: 'injection', kind: 'visit', priceMin: 125, priceMax: 125 },
  { id: 'cannulaIv', kind: 'visit', priceMin: 175, priceMax: 175 },
  { id: 'ivDrip', kind: 'visit', priceMin: 300, priceMax: 300 },
  { id: 'woundSimple', kind: 'visit', priceMin: 250, priceMax: 250 },
  { id: 'woundLarge', kind: 'visit', priceMin: 425, priceMax: 425 },
  { id: 'catheter', kind: 'visit', priceMin: 375, priceMax: 375 },
  { id: 'ngTube', kind: 'visit', priceMin: 350, priceMax: 350 },
  { id: 'nebulizer', kind: 'visit', priceMin: 175, priceMax: 175 },
  { id: 'labSample', kind: 'visit', priceMin: 200, priceMax: 200 },
  { id: 'vitals', kind: 'visit', priceMin: 175, priceMax: 175 },
  { id: 'shift8', kind: 'shift', priceMin: 700, priceMax: 700 },
  { id: 'shift12', kind: 'shift', priceMin: 1050, priceMax: 1050 },
  { id: 'shift24', kind: 'shift', priceMin: 2050, priceMax: 2050 },
] as const;

export type NursingService = (typeof NURSING_SERVICES)[number];
export type NursingServiceId = NursingService['id'];
export type NursingServiceKind = NursingService['kind'];

export function isNursingServiceId(value: string): value is NursingServiceId {
  return NURSING_SERVICES.some((service) => service.id === value);
}

export function getNursingService(id: string): NursingService | undefined {
  return NURSING_SERVICES.find((service) => service.id === id);
}

export function nursingServicesByKind(kind: NursingServiceKind): NursingService[] {
  return NURSING_SERVICES.filter((service) => service.kind === kind);
}

export function formatNursingPriceRange(priceMin: number, priceMax: number): string {
  if (priceMin === priceMax) return String(priceMin);
  return `${priceMin} - ${priceMax}`;
}

export function resolveNursingServiceIds(input: { serviceId: string; serviceIds?: string[] }): string[] {
  if (input.serviceIds?.length) return [...input.serviceIds];
  return input.serviceId ? [input.serviceId] : [];
}

export function quoteNursingServices(ids: string[]): { priceMin: number; priceMax: number } | null {
  const services = ids.map((id) => getNursingService(id)).filter((service) => service !== undefined);
  if (!services.length) return null;
  return {
    priceMin: services.reduce((sum, service) => sum + service.priceMin, 0),
    priceMax: services.reduce((sum, service) => sum + service.priceMax, 0),
  };
}

export function formatNursingQuote(input: { price?: number; priceMin?: number; priceMax?: number }): string | null {
  if (input.price) return String(input.price);
  if (input.priceMin && input.priceMax) return formatNursingPriceRange(input.priceMin, input.priceMax);
  return null;
}
