import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import PaperLayout from '../components/layout/PaperLayout';
import { cellClasses } from '../components/board/cellClasses';

const TILTS = ['-rotate-[0.6deg]', 'rotate-[0.5deg]', '-rotate-[0.3deg]', 'rotate-[0.6deg]', '-rotate-[0.5deg]', 'rotate-[0.4deg]'];
const RICH = {
  b: <strong />,
  k: <kbd className="rounded-[5px] border-[1.5px] border-ink-dark bg-white px-1.5 text-[13px] font-extrabold" />,
  h: <span className="font-hand text-[22px] text-ink" />,
};
const LEGEND = ['sunk', 'hit', 'miss', 'mark'];

function Card({ n, children, title }) {
  return (
    <section className={`flex flex-col gap-2.5 bg-white p-6 note-shadow ${TILTS[n - 1]}`}>
      <span className="font-hand text-[44px] leading-none font-bold text-pen">{n}</span>
      <h2 className="m-0 text-xl font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

export default function RulesPage() {
  const { t } = useTranslation();
  const body = (key) => (
    <p className="m-0 text-base leading-relaxed text-graphite"><Trans i18nKey={`rules.${key}.body`} components={RICH} /></p>
  );

  return (
    <PaperLayout active="rules">
      <div className="flex flex-col gap-1.5">
        <span className="-rotate-2 self-start font-hand text-[26px] text-pen">{t('rules.kicker')}</span>
        <h1 className="m-0 text-[44px] font-extrabold tracking-[-0.02em]">{t('nav.rules')}</h1>
      </div>

      <main className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        <Card n={1} title={t('rules.s1.title')}>{body('s1')}</Card>
        <Card n={2} title={t('rules.s2.title')}>{body('s2')}</Card>
        <Card n={3} title={t('rules.s3.title')}>{body('s3')}</Card>
        <Card n={4} title={t('rules.s4.title')}>{body('s4')}</Card>
        <Card n={5} title={t('rules.s5.title')}>
          {LEGEND.map((kind) => (
            <div key={kind} className="flex items-center gap-3 text-[15px]">
              <span className={`${cellClasses(kind)} w-[30px] shrink-0 border border-gridline bg-white text-2xl`} />
              {t(`rules.s5.${kind}`)}
            </div>
          ))}
        </Card>
        <Card n={6} title={t('rules.s6.title')}>{body('s6')}</Card>
      </main>

      <Link to="/" className="sketch-border inline-flex min-h-[52px] items-center self-center border-ink bg-ink px-8 text-lg font-extrabold text-white no-underline">
        {t('rules.cta')}
      </Link>
    </PaperLayout>
  );
}
