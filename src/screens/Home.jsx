import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage.js';
import { useUser } from '../context/useUser.js';
import MovieList from '../components/MovieList.jsx';

export default function Home() {
  const { texts } = useLanguage();
  const { user } = useUser();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function search(event) {
    event.preventDefault();
    navigate(`/haku?q=${encodeURIComponent(query.trim())}`);
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
    </div>
  );
}

