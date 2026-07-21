// All product prices are stored in USD. SSP/USD is highly volatile in South
// Sudan, so this rate is a rough PLACEHOLDER, not a live figure — update it
// regularly (or wire it to a live feed) before relying on it for real pricing.
export const SSP_PER_USD: number = Number(process.env.NEXT_PUBLIC_SSP_PER_USD) || 4500;

export const CURRENCIES = ["USD", "SSP"] as const;
export type Currency = (typeof CURRENCIES)[number];
