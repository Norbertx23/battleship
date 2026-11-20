const COLS = 'ABCDEFGHIJ'.split('');
const ROWS = Array.from({ length: 10 }, (_, i) => i + 1);
const AXIS = 'grid items-center text-center font-hand text-base md:text-xl font-bold text-pencil';

export default function BoardFrame({ children, label, boardProps = {} }) {
  const { className: extra = '', ...rest } = boardProps;
  return (
    <div className="grid w-full grid-cols-[1.375rem_minmax(0,1fr)] grid-rows-[1.375rem_auto] gap-1">
      <span />
      <div aria-hidden="true" className={`${AXIS} grid-cols-10`}>
        {COLS.map((c) => <span key={c}>{c}</span>)}
      </div>
      <div aria-hidden="true" className={`${AXIS} grid-rows-10`}>
        {ROWS.map((r) => <span key={r}>{r}</span>)}
      </div>
      <div role="group" aria-label={label} className={`relative grid grid-cols-10 self-start border-2 border-ink-dark bg-white ${extra}`} {...rest}>
        {children}
      </div>
    </div>
  );
}
