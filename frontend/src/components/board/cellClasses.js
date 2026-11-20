const BASE = 'relative flex aspect-square min-w-0 items-center justify-center border-0 border-r border-b border-gridline p-0 font-hand text-[clamp(14px,2.2vw,26px)] font-bold leading-none';
const CROSS = "after:content-['✕']";

const KINDS = {
  empty: 'bg-transparent',
  ship: 'bg-ship shadow-[inset_0_0_0_2px_var(--color-ink)]',
  shipHit: `bg-ship shadow-[inset_0_0_0_2px_var(--color-ink)] text-pen ${CROSS}`,
  hit: `text-pen ${CROSS}`,
  sunk: `hatch-pen text-pen ${CROSS}`,
  miss: "after:block after:size-1.5 after:rounded-full after:bg-pencil after:content-['']",
  mark: 'bg-highlight',
  ghost: 'hatch-ink shadow-[inset_0_0_0_2px_var(--color-ink)]',
};

export function cellClasses(kind, { interactive = false } = {}) {
  const look = KINDS[kind] || KINDS.empty;
  const hover = interactive ? ' cursor-crosshair' + (kind === 'empty' ? ' hover:bg-[#FFF4C2]' : '') : '';
  return `${BASE} ${look}${hover}`;
}
