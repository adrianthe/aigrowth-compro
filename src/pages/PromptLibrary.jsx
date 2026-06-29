import React, { useState, useEffect } from 'react';
import ImageCard from '../components/ImageCard';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';

export default function PromptLibrary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState('All');
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [deepLinkId, setDeepLinkId] = useState(null);

  useEffect(() => {
    fetchPrompts();
    // Parse URL for deep link ID
    const query = new URLSearchParams(window.location.search);
    const idParam = query.get('id');
    if (idParam) {
      setDeepLinkId(idParam);
    }
  }, []);

  async function fetchPrompts() {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prompts:', error);
      } else {
        setPrompts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const allTags = ['All', ...new Set(prompts.flatMap(item => item.tags || []))];

  const filteredPrompts = prompts.filter(item => {
    const matchesSearch = item.prompt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = activeTag === 'All' || (item.tags && item.tags.includes(activeTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="library-page">
      <section className="gallery-section container">
        <div className="gallery-header fade-in">
          <h2 className="section-title">{t('library_title')}</h2>
          <p className="hero-subtitle text-center">{t('library_subtitle')}</p>
          
          <div className="filter-controls">
            <input 
              type="text" 
              className="search-input glass-panel" 
              placeholder={t('search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="tags-container">
              {allTags.map(tag => (
                <button 
                  key={tag} 
                  className={`filter-tag glass-panel ${activeTag === tag ? 'active' : ''}`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="no-results">{t('loading')}</div>
        ) : (
          <div className="prompts-grid fade-in">
            {filteredPrompts.length > 0 ? (
              filteredPrompts.map(prompt => (
                <ImageCard 
                  key={prompt.id} 
                  promptData={prompt} 
                  autoOpen={deepLinkId === String(prompt.id)} 
                />
              ))
            ) : (
              <div className="no-results">{t('no_results')}</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
