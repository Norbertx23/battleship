import { Routes, Route } from 'react-router-dom';
import Lobby from './components/Lobby';
import MatchHistory from './components/MatchHistory';
import RulesPage from './pages/RulesPage';
import LegalPage from './pages/LegalPage';
import privacyPl from './content/legal/privacy.md?raw';
import privacyEn from './content/legal/privacy.en.md?raw';
import termsPl from './content/legal/terms.md?raw';
import termsEn from './content/legal/terms.en.md?raw';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/match_history" element={<MatchHistory />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/privacy" element={<LegalPage sources={{ pl: privacyPl, en: privacyEn }} kickerKey="legal.privacyKicker" />} />
      <Route path="/terms" element={<LegalPage sources={{ pl: termsPl, en: termsEn }} kickerKey="legal.termsKicker" />} />
    </Routes>
  );
}

export default App;
