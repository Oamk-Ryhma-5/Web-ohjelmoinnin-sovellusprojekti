import React, { useState, useEffect } from 'react'; //tässä tuodaan reactin perustoimintoja
import { useNavigate, Link } from 'react-router-dom'; //reititystyökalu + Link-komponentti
import { useLanguage } from '../context/useLanguage.js';
import { useUser } from '../context/useUser.js';

export default function Groups() {
  const { texts } = useLanguage();
  const { user } = useUser();
  const [query, setQuery] = useState(''); //pitää kirjaa kenttään kirjoitetusta tekstistä
  
  // Luetaan ryhmät localStoragesta tai käytetään oletusryhmiä
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('app_groups');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Sci-Fi Leffakerho' },
      { id: 2, name: 'Kauhuelokuvien ystävät' } //kovakoodattuja esimerkkejä ryhmistä.
    ];
  });

  const [newGroupName, setNewGroupName] = useState('');  //tallentaa uuden ryhmän nimen
  const navigate = useNavigate(); //hookki joka ohjaa käyttäjän eteenpäin hakusivulle

  // Tallennetaan ryhmät aina kun 'groups'-tila muuttuu
  useEffect(() => {
    localStorage.setItem('app_groups', JSON.stringify(groups));
  }, [groups]);

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

    // Ohjataan käyttäjä suoraan uuden ryhmän sivulle ja välitetään ryhmän tiedot statessa
    navigate(`/ryhma/${newGroup.id}`, { state: { group: newGroup } });
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

        {user ? ( /* tarkistaa onko käyttäjä kirjautunut sisään jos on näyttää lomakkeen ryhmän luomiseen jos ei kehoitus kirjautumiseen */
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