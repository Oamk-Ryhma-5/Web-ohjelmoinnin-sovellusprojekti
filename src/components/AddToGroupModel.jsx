import React, { useState, useEffect } from 'react';
import { useUser } from '../context/useUser.js';
import { useLanguage } from '../context/useLanguage.js';

export default function AddToGroupModal({ movie }) {
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
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setUserGroups(data);
          }
        })
        .catch((err) => console.error('Virhe ryhmien hakemisessa:', err));
    }
  }, [user, isOpen]);

  const handleAddMovie = async () => {
    if (!selectedGroupId) return;

    try {
      const response = await fetch(`/api/groups/${selectedGroupId}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie_id: String(movie.id),
          movie_title: movie.title || movie.name,
          poster_path: movie.poster_path,
          added_by: user.id,
        }),
      });

      if (response.ok) {
        setStatusMessage('✅ Lisätty ryhmään!');
        setTimeout(() => {
          setStatusMessage('');
          setIsOpen(false);
        }, 1500);
      } else {
        setStatusMessage('⚠️ Elokuva on jo ryhmässä.');
      }
    } catch (err) {
      console.error('Virhe elokuvan lisäämisessä:', err);
      setStatusMessage('❌ Virhe lisättäessä.');
    }
  };

  if (!user) return null; // Ei näytetä mitään, jos käyttäjä ei ole kirjautunut

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          ➕ Lisää ryhmään
        </button>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: '0.8rem', borderRadius: '6px', backgroundColor: '#f9f9f9', marginTop: '0.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold' }}>Valitse ryhmä:</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              style={{ padding: '0.4rem' }}
            >
              <option value="">-- Valitse ryhmä --</option>
              {userGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <button onClick={handleAddMovie} disabled={!selectedGroupId} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
              Tallenna
            </button>
            <button onClick={() => setIsOpen(false)} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer', background: '#ccc' }}>
              Peruuta
            </button>
          </div>
          {statusMessage && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{statusMessage}</p>}
        </div>
      )}
    </div>
  );
}