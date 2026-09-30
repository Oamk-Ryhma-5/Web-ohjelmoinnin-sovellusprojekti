import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage.js';
import { useUser } from '../context/useUser.js';

export default function Groups() {
  const { texts } = useLanguage();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  
  // Luetaan ryhmät localStoragesta (tai käytetään oletusryhmiä)
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('app_groups');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Sci-Fi Leffakerho' },
      { id: 2, name: 'Kauhuelokuvien ystävät' }
    ];
  });

  const [newGroupName, setNewGroupName] = useState('');
  const navigate = useNavigate();

  // Tallennetaan ryhmät aina kun 'groups'-tila muuttuu
  useEffect(() => {
    localStorage.setItem('app_groups', JSON.stringify(groups));
  }, [groups]);

  function search(event) {
    event.preventDefault();
    navigate(`/haku?q=${encodeURIComponent(query.trim())}`);
  }

  function handleCreateGroup(event) {
    event.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: Date.now(),
      name: newGroupName.trim()
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    setNewGroupName('');

    // Ohjataan uuteen ryhmään
    navigate(`/ryhma/${newGroup.id}`, { state: { group: newGroup } });
  }

  function handleDeleteGroup(id) {
    setGroups(groups.filter(group => group.id !== id));
  }

  return (
    <div className="container">
      {/* Elokuva- ja sarjahaku */}
      <section className="home-search" aria-labelledby="home-title">
        <h1 id="home-title">{texts.homeTitle || 'Elokuvat ja sarjat'}</h1>
        <form className="quick-search" onSubmit={search}>
          <div className="quick-search-field">
            <label htmlFor="quick-search">{texts.quickSearch || 'Hae nimellä'}</label>
            <input
              id="quick-search"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={texts.searchPlaceholder || 'Kirjoita elokuvan tai sarjan nimi'}
            />
          </div>
        </form>
      </section>

      {/* Ryhmien hallinta */}
      <section className="groups-section" style={{ marginTop: '2rem', padding: '1rem' }}>
        <h2>{texts.groups || 'Ryhmät'}</h2>

        {user ? (
          <div className="logged-in-content">
            <form onSubmit={handleCreateGroup} style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder={texts.newGroupNamePlaceholder || 'Uuden ryhmän nimi...'}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{ marginRight: '0.5rem', padding: '0.4rem' }}
              />
              <button type="submit">{texts.createGroup || 'Luo ryhmä'}</button>
            </form>
          </div>
        ) : (
          <p>{texts.loginToCreateGroups || 'Kirjaudu sisään luodaksesi ryhmiä.'}</p>
        )}

        {/* ryhmälista */}
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {groups.map(group => (
            <li key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f9f9f9' }}>
              <Link 
                to={`/ryhma/${group.id}`} 
                state={{ group }} 
                style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}
              >
                {group.name}
              </Link>
              {user && (
                <button onClick={() => handleDeleteGroup(group.id)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>
                  {texts.delete || 'Poista'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}