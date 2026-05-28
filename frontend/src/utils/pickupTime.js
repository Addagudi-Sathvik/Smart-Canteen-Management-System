/** 9:00 AM – 5:00 PM pickup window (15-minute steps). */

export const PICKUP_OPEN_MINUTES = 9 * 60;
export const PICKUP_CLOSE_MINUTES = 17 * 60; // 5:00 PM

export function formatPickupSlot(hour24, minute) {
  const period = hour24 < 12 ? 'AM' : 'PM';
  const displayHour = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
  const displayMin = minute === 0 ? '00' : String(minute).padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
}

export function generatePickupSlots() {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    const steps = hour === 17 ? 1 : 4;
    for (let i = 0; i < steps; i++) {
      slots.push(formatPickupSlot(hour, i * 15));
    }
  }
  return slots;
}

export function slotToMinutes(slot) {
  if (!slot || typeof slot !== 'string') return null;
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return hour * 60 + minute;
}

export function slotToTimeInput(slot) {
  const minutes = slotToMinutes(slot);
  if (minutes === null) return '09:00';
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function timeInputToPickupSlot(timeValue) {
  if (!timeValue) return '';
  const [hourStr, minuteStr] = timeValue.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return '';
  return formatPickupSlot(hour, minute);
}

export function isValidPickupSlot(slot) {
  const minutes = slotToMinutes(slot);
  if (minutes === null) return false;
  return minutes >= PICKUP_OPEN_MINUTES && minutes <= PICKUP_CLOSE_MINUTES;
}

/** Canonical display string for API + validation (e.g. "10:00 AM"). */
export function normalizePickupSlot(slot) {
  if (!slot || typeof slot !== 'string') return '';
  const trimmed = slot.trim().replace(/\s+/g, ' ');
  const minutes = slotToMinutes(trimmed);
  if (minutes === null || !isValidPickupSlot(trimmed)) return '';
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  return formatPickupSlot(hour, min);
}

export function getDefaultPickupSlot(slots) {
  if (!slots?.length) return '';
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (nowMinutes < PICKUP_OPEN_MINUTES) return slots[0];
  if (nowMinutes > PICKUP_CLOSE_MINUTES) return slots[slots.length - 1];

  const upcoming = slots.find((s) => slotToMinutes(s) >= nowMinutes);
  return upcoming || slots[slots.length - 1];
}
