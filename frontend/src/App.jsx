import { Routes, Route } from 'react-router-dom';
import Lobby from './components/Lobby';
import MatchHistory from './components/MatchHistory';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/match_history" element={<MatchHistory />} />
    </Routes>
  );
}

export default App;
