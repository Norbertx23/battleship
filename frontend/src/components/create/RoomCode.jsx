import { useTranslation } from 'react-i18next';
import { Sailboat } from 'lucide-react';
import PaperLayout from '../layout/PaperLayout';
import CodeField from '../CodeField';

export default function RoomCode({ nick, code, onCancel }) {
  const { t } = useTranslation();

  const playingAs = (
    <span className="text-[15px] text-pencil">{t('room.playingAs')} <strong className="text-ink-dark">{nick}</strong></span>
  );

  return (
    <PaperLayout withNav={false} withFooter={false} headerRight={playingAs}>
      <main className="flex justify-center pt-6">
        <section className="relative flex w-full max-w-[560px] -rotate-[0.6deg] flex-col items-center gap-[22px] bg-white px-9 pt-11 pb-8 text-center note-shadow">
          <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
          <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.02em]">{t('room.ready')}</h1>
          <p className="m-0 text-base text-pencil">{t('room.lead')}</p>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[13px] font-bold text-pencil">{t('room.roomCode')}</span>
            <CodeField code={code} revealable />
          </div>

          <div aria-hidden="true" className="w-full border-t border-dashed border-dash" />

          <div role="status" className="flex items-center gap-3.5">
            <Sailboat size={40} aria-hidden="true" className="animate-bob text-ink" />
            <span className="font-hand text-[28px] text-ink-dark">
              {t('room.waiting')}
              <span className="animate-dot">.</span>
              <span className="animate-dot [animation-delay:0.2s]">.</span>
              <span className="animate-dot [animation-delay:0.4s]">.</span>
            </span>
          </div>

          <button type="button" onClick={onCancel} className="min-h-11 cursor-pointer border-0 bg-transparent text-[15px] font-bold text-pen-dark underline">
            {t('room.cancel')}
          </button>
        </section>
      </main>
    </PaperLayout>
  );
}
