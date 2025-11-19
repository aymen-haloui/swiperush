import { CONFIG } from '../config';

export const info = (...args: unknown[]) => {
  console.log('[INFO]', new Date().toISOString(), ...args);
};

export const warn = (...args: unknown[]) => {
  console.warn('[WARN]', new Date().toISOString(), ...args);
};

export const error = (...args: unknown[]) => {
  console.error('[ERROR]', new Date().toISOString(), ...args);
};

export const debug = (...args: unknown[]) => {
  if (!CONFIG.isProd) {
    console.debug('[DEBUG]', new Date().toISOString(), ...args);
  }
};

export default { info, warn, error, debug };
