const BOARD_SIZE = 10;

export function fleetFits(config, size = BOARD_SIZE) {
  const board = Array.from({ length: size }, () => Array(size).fill(false));
  const lengths = Object.entries(config)
    .flatMap(([len, count]) => Array(Number(count) || 0).fill(Number(len)))
    .sort((a, b) => b - a);
  if (lengths.length === 0) return false;

  const free = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < size && ny < size && board[ny][nx]) return false;
      }
    }
    return true;
  };
  const cells = (x, y, len, vertical) => Array.from({ length: len }, (_, i) => (vertical ? [x, y + i] : [x + i, y]));
  const fits = (x, y, len, vertical) => cells(x, y, len, vertical).every(([cx, cy]) => cx < size && cy < size && free(cx, cy));

  return lengths.every((len) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        for (const vertical of [false, true]) {
          if (fits(x, y, len, vertical)) {
            cells(x, y, len, vertical).forEach(([cx, cy]) => { board[cy][cx] = true; });
            return true;
          }
        }
      }
    }
    return false;
  });
}
