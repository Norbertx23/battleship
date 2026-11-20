import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PaperLayout from '../components/layout/PaperLayout';

const components = {
  h1: ({ children }) => <h1 className="m-0 mt-1 mb-1.5 text-4xl font-extrabold tracking-[-0.02em]">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-7 mb-2 text-xl font-extrabold">{children}</h2>,
  p: ({ children }) => <p className="m-0 mb-2.5 text-base leading-[1.65] text-graphite">{children}</p>,
  ul: ({ children }) => <ul className="m-0 mb-2.5 list-disc pl-5.5 text-base leading-[1.65] text-graphite">{children}</ul>,
  ol: ({ children }) => <ol className="m-0 mb-2.5 list-decimal pl-5.5 text-base leading-[1.65] text-graphite">{children}</ol>,
  a: ({ href, children }) => (href && href.startsWith('/')
    ? <Link to={href} className="text-ink">{children}</Link>
    : <a href={href} className="text-ink">{children}</a>),
};

const splitHead = (source) => {
  const i = source.indexOf('\n## ');
  return i === -1 ? [source, ''] : [source.slice(0, i), source.slice(i)];
};

export default function LegalPage({ sources, kickerKey }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === 'pl' ? 'pl' : 'en';
  const [head, body] = splitHead(sources[lang]);
  const isTranslation = lang !== 'pl';

  return (
    <PaperLayout>
      <article lang={lang} className="relative w-full max-w-195 self-center bg-white px-6 py-10 note-shadow sm:px-11">
        <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
        <span className="font-hand text-2xl text-pen">{t(kickerKey)}</span>
        <div className="[&_p]:text-sm [&_p]:text-muted">
          <Markdown components={components}>{head}</Markdown>
        </div>
        {isTranslation && (
          <p className="mt-3.5 mb-1.5 border-l-[3px] border-ink bg-paper-dim px-4 py-3 text-sm leading-[1.55] text-graphite">
            {t('legal.translationNote')}
          </p>
        )}
        <Markdown components={components}>{body}</Markdown>
      </article>
    </PaperLayout>
  );
}
