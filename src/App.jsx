import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import PromptLibrary from './pages/PromptLibrary';
import Studio from './pages/Studio';
import Tools from './pages/Tools';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ArticleDetail from './pages/ArticleDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './contexts/LanguageContext';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div className="app-wrapper">
          <Header />
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<PromptLibrary />} />
              <Route path="/courses" element={<Studio />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/blog/:slug" element={<ArticleDetail />} />
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
