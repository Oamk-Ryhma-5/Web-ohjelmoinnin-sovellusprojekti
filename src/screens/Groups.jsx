import React, { useState } from 'react'; //tässä tuodaan reactin perustoimintoja
import { useNavigate } from 'react-router-dom'; //reititystyökalu
import { useLanguage } from '../context/useLanguage.js';
import { useUser } from '../context/useUser.js';

export default function Groups() {
  const { texts } = useLanguage();
  const { user } = useUser();
  const [query, setQuery] = useState(''); //pitää kirjaa kenttään kirjoitetusta tekstistä
  
  const [groups, setGroups] = useState([
    { id: 1, name: 'Sci-Fi Leffakerho' },
    { id: 2, name: 'Kauhuelokuvien ystävät' } //kovakoodattuja esimerkkejä ryhmistä.
  ]);
  const [newGroupName, setNewGroupName] = useState('');  //tallentaa uuden ryhmän nimen
  const navigate = useNavigate(); //hookki joka ohjaa käyttäjän eteenpäin hakusivulle

  function search(event) {
    event.preventDefault();  //tämä estää sivun uudelleenlatautumisen
    navigate(`/haku?q=${encodeURIComponent(query.trim())}`);
  }

  function handleCreateGroup(event) { //lisää ryhmän listaan jos nimi ei ole tyhjä samalla luodaan tunniste 
    event.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: Date.now(), //tämä luo yllä mainitun tunnisteen aikaleiman mukaan
      name: newGroupName.trim()
    };

    setGroups([...groups, newGroup]);
    setNewGroupName('');
  }

  function handleDeleteGroup(id) { //täällä poistetaan ryhmä idn perusteella
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

        {user ? ( //tarkistaa onko käyttäjä kirjautunut sisään jos on näyttää lomakkeen ryhmän luomiseen jos ei kehoitus kirjautumiseen
          <div className="logged-in-content">
            <form onSubmit={handleCreateGroup} style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Uuden ryhmän nimi..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{ marginRight: '0.5rem', padding: '0.4rem' }}
              />
              <button type="submit">Luo ryhmä</button>
            </form>
          </div>
        ) : (
          <p>kirjautuminen.</p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}> //ryhmälista
          {groups.map(group => (
            <li key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f9f9f9' }}>
              <span>{group.name}</span>
              {user && (
                <button onClick={() => handleDeleteGroup(group.id)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '0.3rem 0.6rem', cursor: 'pointer' }}>
                  Poista
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}