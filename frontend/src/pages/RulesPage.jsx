import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import PaperLayout from '../components/layout/PaperLayout';
import { cellClasses } from '../components/board/cellClasses';

const TILTS = ['-rotate-[0.6deg]', 'rotate-[0.5deg]', '-rotate-[0.3deg]', 'rotate-[0.6deg]', '-rotate-[0.5deg]', 'rotate-[0.4deg]'];
const RICH = {
  b: <strong />,
  k: <kbd className="rounded-md border-[1.5px] border-ink-dark bg-white px-1.5 text-sm font-extrabold" />,
  h: <span className="font-hand text-2xl text-ink" />,
};
const LEGEND = ['sunk', 'hit', 'miss', 'mark'];

function Card({ n, children, title }) {
  return (
    <section className={`flex flex-col gap-2 bg-white p-5 note-shadow ${TILTS[n - 1]}`}>
      <h2 className="m-0 flex items-baseline gap-3 text-lg font-extrabold"><span aria-hidden="true" className="font-hand text-4xl leading-none font-bold text-pen">{n}</span>{title}</h2>
      {children}
    </section>
  );
}

export default function RulesPage() {
  const { t } = useTranslation();
  const body = (key) => (
    <p className="m-0 text-sm leading-relaxed text-graphite md:text-base"><Trans i18nKey={`rules.${key}.body`} components={RICH} /></p>
  );

  return (
    <PaperLayout active="rules">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="-rotate-2 self-start font-hand text-2xl text-pen">{t('rules.kicker')}</span>
          <h1 className="m-0 text-4xl font-extrabold tracking-[-0.02em] md:text-5xl">{t('nav.rules')}</h1>
        </div>
        <Link to="/" className="sketch-border whitespace-nowrap inline-flex min-h-13 items-center border-ink bg-ink px-8 text-lg font-extrabold text-white no-underline">
          {t('rules.cta')}
        </Link>
      </div>

      <main className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Card n={1} title={t('rules.s1.title')}>{body('s1')}</Card>
        <Card n={2} title={t('rules.s2.title')}>{body('s2')}</Card>
        <Card n={3} title={t('rules.s3.title')}>{body('s3')}</Card>
        <Card n={4} title={t('rules.s4.title')}>{body('s4')}</Card>
        <Card n={5} title={t('rules.s5.title')}>
          {LEGEND.map((kind) => (
            <div key={kind} className="flex items-center gap-3 text-sm md:text-base">
              <span className={`${cellClasses(kind)} w-7.5 shrink-0 border border-gridline bg-white text-2xl`} />
              {t(`rules.s5.${kind}`)}
            </div>
          ))}
        </Card>
        <Card n={6} title={t('rules.s6.title')}>{body('s6')}</Card>
      </main>
    </PaperLayout>
  );
}
