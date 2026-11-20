import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GithubIcon from './GithubIcon';

export const REPO_URL = 'https://github.com/Norbertx23/battleship';

const linkClass = 'inline-flex min-h-7 items-center gap-1 text-ink hover:text-ink-deep';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-dashed border-dash">
      <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-x-4 px-6 py-0.5 text-[0.625rem] text-muted md:max-w-340 md:pl-26">
        <span>{t('footer.text')}</span>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-3 text-[0.6875rem] font-bold">
          <Link to="/privacy" className={linkClass}>{t('footer.privacy')}</Link>
          <Link to="/terms" className={linkClass}>{t('footer.terms')}</Link>
          <a href={REPO_URL} className={linkClass}><GithubIcon size={12} />GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
