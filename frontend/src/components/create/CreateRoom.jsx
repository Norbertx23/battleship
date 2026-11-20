import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import PaperLayout from '../layout/PaperLayout';
import FleetSelector from './FleetSelector';
import Consent from '../lobby/Consent';

export default function CreateRoom({ nick, onNickChange, config, onConfigChange, onBack, onCreate }) {
  const { t } = useTranslation();

  const submit = (e) => {
    e.preventDefault();
    onCreate();
  };

  return (
    <PaperLayout active="lobby">
      <button type="button" onClick={onBack} className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start border-0 bg-transparent p-0 font-bold whitespace-nowrap text-ink-dark">
        <ArrowLeft size={20} aria-hidden="true" />{t('create.back')}
      </button>

      <main className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={submit} className="relative m-0 flex min-w-0 -rotate-[0.4deg] flex-col gap-5 bg-white p-7 note-shadow">
          <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-4xl font-extrabold tracking-[-0.02em]">{t('create.newRoom')}</h1>
            <p className="m-0 text-base text-pencil">{t('create.lead')}</p>
          </div>

          <div className="flex max-w-90 flex-col gap-0.5">
            <label htmlFor="create-nick" className="text-sm font-bold text-pencil">{t('lobby.yourName')}</label>
            <input
              id="create-nick"
              type="text"
              maxLength={30}
              value={nick}
              onChange={(e) => onNickChange(e.target.value)}
              placeholder={t('lobby.namePh')}
              className="h-12 w-full border-0 border-b-2 border-ink-dark bg-transparent px-1 font-hand text-3xl tracking-[0.02em] text-ink outline-none placeholder:text-placeholder focus:border-pen"
            />
          </div>

          <FleetSelector config={config} onChange={onConfigChange} />

          <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
            <Consent />
            <button type="submit" className="sketch-border whitespace-nowrap inline-flex min-h-13 cursor-pointer items-center border-ink bg-ink px-7 text-lg font-extrabold text-white transition-transform hover:-translate-y-0.5 hover:-rotate-1">
              {t('create.submit')}
            </button>
          </div>
        </form>

        <aside className="flex min-w-0 flex-col gap-4 pt-3">
          <h2 className="m-0 -rotate-[1.5deg] font-hand text-3xl font-bold text-ink">{t('create.next')}</h2>
          <ol className="m-0 flex flex-col gap-3 pl-5.5 text-base leading-normal text-graphite">
            <li>{t('create.s1')}</li>
            <li>{t('create.s2')}</li>
            <li>{t('create.s3')}</li>
          </ol>
          <Link to="/rules" className="text-base font-bold text-ink">{t('create.full')}</Link>
        </aside>
      </main>
    </PaperLayout>
  );
}
