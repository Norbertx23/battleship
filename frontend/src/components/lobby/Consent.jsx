import { Link } from 'react-router-dom';
import { Trans } from 'react-i18next';

export default function Consent({ className = '' }) {
  return (
    <p className={`m-0 text-sm text-muted ${className}`}>
      <Trans
        i18nKey="consent.text"
        components={{
          terms: <Link to="/terms" className="text-ink" />,
          privacy: <Link to="/privacy" className="text-ink" />,
        }}
      />
    </p>
  );
}
