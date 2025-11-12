const isProd = import.meta.env.MODE === 'production';

export const info = (...args: unknown[]) => {
  // keep info-level logs in all environments for important events
  console.log('[INFO]', ...args);
};

export const warn = (...args: unknown[]) => {
  console.warn('[WARN]', ...args);
};

export const error = (...args: unknown[]) => {
  console.error('[ERROR]', ...args);
};

export const debug = (...args: unknown[]) => {
  if (!isProd) console.debug('[DEBUG]', ...args);
};

export default { info, warn, error, debug };
