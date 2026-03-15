export const VALID_ENVIRONMENTS = ['development', 'staging', 'production'] as const;
export type Environment = (typeof VALID_ENVIRONMENTS)[number];
