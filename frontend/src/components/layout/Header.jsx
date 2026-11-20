import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitch from './LanguageSwitch';

const ITEMS = [
  { key: 'lobby', to: '/' },
  { key: 'history', to: '/match_history' },
  { key: 'rules', to: '/rules' },
];

export default function Header({ active, right, withNav = true }) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link to="/" className="font-hand text-[40px] font-bold leading-none text-ink no-underline">Battleship</Link>
      <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
        {right}
        {withNav && (
          <nav aria-label="Main" className="flex flex-wrap gap-6 text-[15px] font-bold">
            {ITEMS.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                className={active === item.key
                  ? 'text-ink-dark underline decoration-pen decoration-[3px] underline-offset-[6px]'
                  : 'text-pencil no-underline hover:text-ink-dark'}
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>
        )}
        <LanguageSwitch />
      </div>
    </header>
  );
}
