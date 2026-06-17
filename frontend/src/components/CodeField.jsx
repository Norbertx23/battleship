import { useState } from 'react';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default function CodeField({ code, revealable = false, textClassName = 'text-lg' }) {
    const [revealed, setRevealed] = useState(!revealable);
    const [copied, setCopied] = useState(false);

    const copyCode = async () => {
        const text = code || '';
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="inline-flex items-center justify-center gap-3 border border-[#00f2ea55] rounded px-3 py-2 bg-[#00000055]">
            <span className={`font-mono font-bold tracking-widest text-white select-all ${textClassName}`}>
                {revealed ? code : 'CODE'}
            </span>
            {revealable && (
                <button
                    type="button"
                    onClick={() => setRevealed(v => !v)}
                    title={revealed ? 'Hide code' : 'Reveal code'}
                    className="text-gray-400 hover:text-[#00f2ea] transition-colors"
                >
                    {revealed ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            )}
            <button
                type="button"
                onClick={copyCode}
                title="Copy code"
                className={`transition-colors ${copied ? 'text-[#39ff14]' : 'text-gray-400 hover:text-[#00f2ea]'}`}
            >
                {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
        </div>
    );
}
