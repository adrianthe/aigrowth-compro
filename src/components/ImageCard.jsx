import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImageCard.css';

export default function ImageCard({ promptData, autoOpen }) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      setIsModalOpen(true);
    }
  }, [autoOpen]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleCopy = (e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(displayPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (e) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/library?id=${promptData.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Parsing fallback logic for missing title columns
  const hasFallbackTitle = promptData.prompt && promptData.prompt.startsWith('[') && promptData.prompt.includes(']\n\n');
  const displayTitle = promptData.title || (hasFallbackTitle ? promptData.prompt.split(']\n\n')[0].substring(1) : 'Untitled AI Art');
  const displayPrompt = hasFallbackTitle ? promptData.prompt.split(']\n\n')[1] : promptData.prompt;


  return (
    <>
      <div className="image-card glass-panel" onClick={() => setIsModalOpen(true)} style={{cursor: 'pointer'}}>
        <div className="image-wrapper">
          <img src={promptData.imageUrl} alt={promptData.tags ? promptData.tags[0] : 'Prompt visual'} loading="lazy" />
          <div className="image-overlay">
            <h4 className="prompt-overlay-title">{displayTitle}</h4>
            <p className="prompt-text">{displayPrompt}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="copy-btn" onClick={handleCopy} style={{ flex: 1 }}>
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
              <button className="copy-btn" onClick={handleShare} style={{ background: 'rgba(255,255,255,0.2)' }} title="Bagikan Link Prompt">
                {shareCopied ? 'Link Copied!' : '🔗 Share'}
              </button>
            </div>
          </div>
        </div>
        <div className="card-info">
          <div className="tags-list">
            {promptData.tags?.map(tag => (
              <span key={tag} className="tag-badge">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="prompt-modal-overlay fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="prompt-modal-content glass-panel fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            <div className="modal-left">
              <img src={promptData.imageUrl} alt={promptData.title || "Full view"} />
            </div>
            <div className="modal-right">
              <h3 className="modal-title">{displayTitle}</h3>
              <div className="modal-prompt-box glass-input">
                <p>{displayPrompt}</p>
              </div>
              
              <div className="modal-tags">
                <p className="modal-subtitle">Tags:</p>
                <div className="tags-list">
                  {promptData.tags?.map(tag => (
                    <span key={tag} className="filter-tag glass-panel" style={{fontSize: '12px', padding: '6px 12px', margin: 0, cursor: 'default'}}>{tag}</span>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', width: '100%' }}>
                <button className="primary-btn modal-copy-btn" onClick={handleCopy} style={{ flex: 2, margin: 0 }}>
                  {copied ? '✅ Copied to Clipboard!' : '📄 Copy Full Prompt'}
                </button>
                <button className="glass-panel" onClick={handleShare} style={{ flex: 1, margin: 0, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  {shareCopied ? '✅ Link Copied!' : '🔗 Share Link'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
