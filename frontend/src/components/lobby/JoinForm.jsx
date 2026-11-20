import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { useNotice } from '../../notice/useNotice';

const inputClass = 'h-12 w-full border-0 border-b-2 border-ink-dark bg-transparent px-1 font-hand text-[30px] text-ink outline-none placeholder:text-placeholder focus:border-pen';

export default function JoinForm({ nick, onNickChange, code, onCodeChange, onJoin }) {
  const { t } = useTranslation();
  const { notify } = useNotice();

  const submit = (e) => {
    e.preventDefault();
    if (!nick || !nick.trim()) {
      notify({ code: 'nickname_required' });
      return;
    }
    onJoin();
  };

  return (
    <form onSubmit={submit} className="relative m-0 flex -rotate-[0.6deg] flex-wrap items-end gap-5 bg-white px-7 pt-7 pb-6 note-shadow">
      <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-24 -ml-12 -rotate-3 bg-[rgba(244,217,120,0.75)]" />
      <div className="flex basis-full flex-col gap-1">
        <span className="text-xl font-extrabold">{t('lobby.joinTitle')}</span>
        <span className="text-[15px] text-pencil">{t('lobby.joinSub')}</span>
      </div>
      <div className="flex flex-[1_1_180px] flex-col gap-0.5">
        <label htmlFor="join-nick" className="text-[13px] font-bold text-pencil">{t('lobby.yourName')}</label>
        <input id="join-nick" type="text" maxLength={30} value={nick} onChange={(e) => onNickChange(e.target.value)} placeholder={t('lobby.namePh')} className={`${inputClass} tracking-[0.02em]`} />
      </div>
      <div className="flex flex-[1_1_160px] flex-col gap-0.5">
        <label htmlFor="join-code" className="text-[13px] font-bold text-pencil">{t('lobby.roomCode')}</label>
        <input id="join-code" type="text" value={code} onChange={(e) => onCodeChange(e.target.value)} placeholder="7F3K9Q" className={`${inputClass} uppercase tracking-[0.12em]`} />
      </div>
      <button type="submit" className="sketch-border inline-flex min-h-12 cursor-pointer items-center gap-2 border-pen bg-pen px-6 text-[17px] font-extrabold text-white transition-transform hover:-translate-y-0.5 hover:-rotate-1">
        <LogIn size={20} aria-hidden="true" />{t('lobby.join')}
      </button>
    </form>
  );
}
