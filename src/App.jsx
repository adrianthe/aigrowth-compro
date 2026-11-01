import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Studio from './pages/Studio';
import Tools from './pages/Tools';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Offer from './pages/Offer';
import ThankYou from './pages/ThankYou';
import ProtectedRoute from './components/ProtectedRoute';
import TrafficTracker from './components/TrafficTracker';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <TrafficTracker />
        <div className="app-wrapper">
          <Header />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />

              <Route path="/courses" element={<Studio type="course" />} />
              <Route path="/courses/:slug" element={<Offer type="course" />} />
              <Route path="/gratis" element={<Studio type="freebie" />} />
              <Route path="/gratis/:slug" element={<Offer type="freebie" />} />
              <Route path="/terima-kasih" element={<ThankYou />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
