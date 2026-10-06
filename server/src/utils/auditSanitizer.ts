import { IAuditDevice, IAuditFieldDiff } from '../models/AuditLog';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'auth',
  'authorization',
  'secret',
  'jwt_secret',
  'apikey',
  'api_key',
  'privatekey',
  'creditcard',
  'cvv',
  'cardnumber',
  'otp',
  'pin',
]);

const IGNORED_DIFF_KEYS = new Set([
  '__v',
  '_id',
  'createdat',
  'updatedat',
  'passwordhash',
  'password',
]);

/**
 * Deeply sanitizes an object to remove sensitive credentials and secrets
 */
export function sanitizeAuditData(data: unknown): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeAuditData(val);
    } else {
      sanitized[key] = val;
    }
  }

  return sanitized;
}

/**
 * Human friendly field names
 */
export function formatFieldLabel(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Calculates field-level difference between oldValue and newValue
 */
export function calculateDiff(
  oldVal?: Record<string, unknown> | null,
  newVal?: Record<string, unknown> | null
): IAuditFieldDiff[] {
  if (!oldVal && !newVal) return [];

  const cleanOld = sanitizeAuditData(oldVal) || {};
  const cleanNew = sanitizeAuditData(newVal) || {};

  const allKeys = new Set([...Object.keys(cleanOld), ...Object.keys(cleanNew)]);
  const diffs: IAuditFieldDiff[] = [];

  for (const key of allKeys) {
    if (IGNORED_DIFF_KEYS.has(key.toLowerCase())) continue;

    const v1 = cleanOld[key];
    const v2 = cleanNew[key];

    // Deep compare equality for objects/primitives
    const v1Str = JSON.stringify(v1);
    const v2Str = JSON.stringify(v2);

    if (v1Str !== v2Str) {
      diffs.push({
        field: key,
        label: formatFieldLabel(key),
        oldValue: v1 !== undefined ? v1 : null,
        newValue: v2 !== undefined ? v2 : null,
      });
    }
  }

  return diffs;
}

/**
 * Parses user agent string to extract Browser, OS, and Device
 */
export function parseUserAgent(uaString = ''): IAuditDevice {
  if (!uaString) {
    return {
      browser: 'Web API / Client',
      os: 'System',
      deviceType: 'Desktop',
    };
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let deviceType = 'Desktop';

  // Device detection
  if (/mobile/i.test(uaString)) {
    deviceType = 'Mobile';
  } else if (/tablet|ipad/i.test(uaString)) {
    deviceType = 'Tablet';
  } else {
    deviceType = 'Desktop';
  }

  // OS detection
  if (/windows nt 10/i.test(uaString)) os = 'Windows 10/11';
  else if (/windows/i.test(uaString)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(uaString)) os = 'macOS';
  else if (/android/i.test(uaString)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(uaString)) os = 'iOS';
  else if (/linux/i.test(uaString)) os = 'Linux';

  // Browser detection
  if (/edg/i.test(uaString)) browser = 'Edge';
  else if (/chrome|crios/i.test(uaString) && !/opr|edge/i.test(uaString)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(uaString)) browser = 'Firefox';
  else if (/safari/i.test(uaString) && !/chrome|crios/i.test(uaString)) browser = 'Safari';
  else if (/opr/i.test(uaString)) browser = 'Opera';

  return {
    browser,
    os,
    deviceType,
  };
}

/**
 * Extracts clean client IP address from express request
 */
export function extractClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const list = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    const first = list[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim();
  }

  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
}
