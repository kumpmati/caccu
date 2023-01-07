export const str = (v: unknown): v is string => typeof v === 'string';
export const func = (v: unknown): v is string => typeof v === 'function';
