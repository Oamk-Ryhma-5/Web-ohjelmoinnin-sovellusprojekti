import React, { useState, useEffect } from 'react';
import { useUser } from '../context/useUser.js';
import { useLanguage } from '../context/useLanguage.js';

export default function AddToGroupModel({ movie }) {
  const { user } = useUser();
  const { texts } = useLanguage();
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Haetaan ryhmät, joihin käyttäjä kuuluu
  useEffect(() => {
    if (user?.id && isOpen) {
      fetch('/api/groups')
        .then((res) => {
          if (!res.ok) throw new Error('Virhe haettaessa ryhmiä');
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setUserGroups(data);
          }
        })
        .catch((err) => console.error('Virhe ryhmien hakemisessa:', err));
    }
  }, [user, isOpen]);

  const handleAddMovie = async () => {
    if (!selectedGroupId || !movie) return;

    // Varmistetaan että saadaan poster-polku riippumatta kentän nimestä
    let rawPoster = movie.poster_path || movie.posterUrl || '';
    
    // Jos kyseessä on täysi URL, siistitään se pelkäksi suhteelliseksi poluksi
    if (rawPoster.startsWith('https://image.tmdb.org/t/p/')) {
      rawPoster = rawPoster.replace(/^https:\/\/image\.tmdb\.org\/t\/p\/[^\/]+/, '');
    }

    try {
      const response = await fetch(`/api/groups/${selectedGroupId}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie_id: String(movie.id),
          movie_title: movie.title || movie.name || texts.titleMissing,
          poster_path: rawPoster,
          added_by: user.id,
        }),
      });

      if (response.ok) {
        setStatusMessage(texts.addedToGroup || '✅ Lisätty ryhmään!');
        setTimeout(() => {
          setStatusMessage('');
          setIsOpen(false);
        }, 1500);
      } else {
        setStatusMessage(texts.alreadyInGroup || '⚠️ Elokuva on jo ryhmässä.');
      }
    } catch (err) {
      console.error('Virhe elokuvan lisäämisessä:', err);
      setStatusMessage(texts.errorAdding || '❌ Virhe lisättäessä.');
    }
  };

  if (!user) return null;

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="button"
        >
          ➕ {texts.addToGroup || 'Lisää ryhmään'}
        </button>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: '0.8rem', borderRadius: '6px', backgroundColor: '#f9f9f9', marginTop: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold' }}>
            {texts.selectGroup || 'Valitse ryhmä'}:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              style={{ padding: '0.4rem' }}
            >
              <option value="">{texts.selectGroupPlaceholder || '-- Valitse ryhmä --'}</option>
              {userGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <button onClick={handleAddMovie} disabled={!selectedGroupId} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
              {texts.save || 'Tallenna'}
            </button>
            <button onClick={() => setIsOpen(false)} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', background: '#ccc' }}>
              {texts.cancel || 'Peruuta'}
            </button>
          </div>
          {statusMessage && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{statusMessage}</p>}
        </div>
      )}
    </div>
  );
}