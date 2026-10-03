import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage.js';
import { useUser } from '../context/useUser.js';

export default function Groups() {
  const { texts } = useLanguage();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/groups')
      .then(res => res.json())
      .then(data => setGroups(Array.isArray(data) ? data : []))
      .catch(err => console.error('Virhe ryhmien hakemisessa:', err));
  }, []);

  function search(event) {
    event.preventDefault();
    navigate(`/haku?q=${encodeURIComponent(query.trim())}`);
  }

  async function handleCreateGroup(event) {
    event.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newGroupName.trim(),
          owner_id: user?.id || null
        })
      });

      if (response.ok) {
        const createdGroup = await response.json();
        setGroups([createdGroup, ...groups]);
        setNewGroupName('');
        navigate(`/ryhma/${createdGroup.id}`, { state: { group: createdGroup } });
      }
    } catch (error) {
      console.error('Ryhmän luonti epäonnistui:', error);
    }
  }

  async function handleDeleteGroup(id) {
    if (!window.confirm('Haluatko varmasti poistaa tämän ryhmän?')) return;

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id })
      });
      if (response.ok) {
        setGroups(groups.filter(group => group.id !== id));
      }
    } catch (error) {
      console.error('Ryhmän poisto epäonnistui:', error);
    }
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

        {/* Ryhmälista (Kaikki näkevät ryhmät) */}
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {groups.map(group => {
            const isOwner = user && String(user.id) === String(group.owner_id);

            return (
              <li key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f9f9f9' }}>
                <Link 
                  to={`/ryhma/${group.id}`} 
                  state={{ group }} 
                  style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold' }}
                >
                  {group.name}
                </Link>
                {isOwner && (
                  <button onClick={() => handleDeleteGroup(group.id)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>
                    {texts.delete || 'Poista'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}