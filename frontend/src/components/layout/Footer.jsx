import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GithubIcon from './GithubIcon';

export const REPO_URL = 'https://github.com/Norbertx23/battleship';

const linkClass = 'inline-flex min-h-7 items-center gap-1 text-ink hover:text-ink-deep';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-dashed border-dash">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-4 px-6 py-0.5 text-[10px] text-muted sm:pl-[104px]">
        <span>{t('footer.text')}</span>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-3 text-[11px] font-bold">
          <Link to="/privacy" className={linkClass}>{t('footer.privacy')}</Link>
          <Link to="/terms" className={linkClass}>{t('footer.terms')}</Link>
          <a href={REPO_URL} className={linkClass}><GithubIcon size={12} />GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
