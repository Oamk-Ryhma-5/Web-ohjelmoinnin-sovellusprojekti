import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage.js';
import { useUser } from '../context/useUser.js';

export default function Groups() { 
  const { texts } = useLanguage();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  
  const [groups, setGroups] = useState([ //kovakoodattuja esimerkkiryhmiä tässä pidetään kirjaa ryhmistä. 
    { id: 1, name: 'Sci-Fi Leffakerho' },
    { id: 2, name: 'Kauhuelokuvien ystävät' }
  ]);

  const [newGroupName, setNewGroupName] = useState(''); //newgroupname pitää kirjaa siitä mitä luodun ryhmän nimikenttään tulee. usestate on hookki joka tallentaa listan ja newgroupname tallentaa uuden ryhmän.
  const navigate = useNavigate();

  function search(event) {
    event.preventDefault(); //tää estää sivun uudelleenlatauksen kesken kaiken
    navigate(`/haku?q=${encodeURIComponent(query.trim())}`); //tällä siirrytään hakusivulle hakusanan kanssa.
  }

  function handleCreateGroup(event) { //tän koko idea on tarkistaa että onko kenttä tyhjä
    event.preventDefault();
    if (!newGroupName.trim()) return; //jos kentässä ei ole mitään niin mitään ei tapahdu

    const newGroup = { //luuaan ryhmä-olio jonka id on aikaleima (date.now) luo uniikin numeron
      id: Date.now(),
      name: newGroupName.trim()
    };

    setGroups([...groups, newGroup]); //tämä tavallaan tavallaan kopsaa vanhan ryhmälistan ja laittaa ja lisätään uusi perään
    setNewGroupName(''); //tämä tyhjentää kentän luonnin jälkeen ettei sinne jää roikkumaan se vanha teksti eikä sitä tarvitse deletoida manuaalisesti
  }

  function handleDeleteGroup(id) { //no tämä on aika itsestään selvä. suodattaa pois ryhmän jonka id vastaa poistettavaa id.tä. eli käytetään filtteri metodia.
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

        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {groups.map(group => (
            <li key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', padding: '0.5rem', background: '#f9f9f9' }}> //tässä käydään läpi groups ja
            joka ryhmälle luodaan oma li -elementti =list item jota käytetään listoja tehdessä joka on pitkälti joko rivi tai laatikko.
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