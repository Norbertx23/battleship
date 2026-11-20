import { vi } from 'vitest';

export function makeSocket() {
  const handlers = {};
  return {
    id: 'me',
    handlers,
    on: vi.fn((ev, cb) => { handlers[ev] = cb; }),
    off: vi.fn(),
    emit: vi.fn(),
  };
}

export const ONE_SHIP = [{ x: 0, y: 0, size: 1, vertical: false }];
