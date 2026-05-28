const crypto = require('crypto');

const QR_VERSION = 1;

/**
 * Cryptographically secure single-use pickup token.
 */
const generateQrToken = () => crypto.randomBytes(32).toString('hex');

/**
 * Compact QR payload — no PII (no name/email).
 * { v, o: orderId, t: token, p: pickupSlot, ts: ms }
 */
const buildQrPayload = (order) => {
  if (!order?.orderId || !order?.qrToken) {
    return null;
  }
  return {
    v: QR_VERSION,
    o: order.orderId,
    t: order.qrToken,
    p: order.pickupSlot || '',
    ts: order.qrGeneratedAt
      ? new Date(order.qrGeneratedAt).getTime()
      : Date.now(),
  };
};

const buildQrPayloadString = (order) => {
  const payload = buildQrPayload(order);
  return payload ? JSON.stringify(payload) : null;
};

/**
 * Parse scanned QR text (JSON). Returns null if invalid/tampered shape.
 */
const parseQrPayload = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  try {
    const data = JSON.parse(raw.trim());
    if (data.v !== QR_VERSION) return null;
    if (!data.o || typeof data.o !== 'string') return null;
    if (!data.t || typeof data.t !== 'string' || data.t.length < 32) return null;
    if (data.p != null && typeof data.p !== 'string') return null;
    if (data.ts != null && typeof data.ts !== 'number') return null;

    return {
      orderId: data.o.trim(),
      token: data.t.trim(),
      pickupSlot: data.p || '',
      timestamp: data.ts,
    };
  } catch {
    return null;
  }
};

module.exports = {
  generateQrToken,
  buildQrPayload,
  buildQrPayloadString,
  parseQrPayload,
};
