import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useUser } from '../context/useUser.js';
import { useLanguage } from '../context/useLanguage.js';

export default function GroupDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useUser();
  const { texts } = useLanguage();

  const [group, setGroup] = useState(location.state?.group || null);
  const [movies, setMovies] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tarkistetaan onko kirjautunut käyttäjä tämän ryhmän omistaja
  const isOwner = user && group && String(user.id) === String(group.owner_id);

  // Haetaan ryhmän perustiedot tietokannasta jos niitä ei ole statessa
  useEffect(() => {
    if (!group) {
      fetch(`/api/groups/${id}`)
        .then((res) => res.json())
        .then((data) => setGroup(data))
        .catch((err) => console.error('Virhe ryhmän tietojen hakemisessa:', err));
    }
  }, [id, group]);

  // Haetaan ryhmän jäsenet tietokannasta
  const fetchMembers = () => {
    fetch(`/api/groups/${id}/members`)
      .then((res) => res.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Virhe jäsenten hakemisessa:', err));
  };

  useEffect(() => {
    fetchMembers();
  }, [id]);

  // Haetaan ryhmän elokuvat tietokannasta
  useEffect(() => {
    fetch(`/api/groups/${id}/movies`)
      .then((res) => res.json())
      .then((data) => {
        setMovies(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Virhe elokuvien hakemisessa:', err);
        setLoading(false);
      });
  }, [id]);

  // Lähetä liittymispyyntö ryhmään
  async function handleJoinRequest() {
    if (!user) return;
    try {
      const response = await fetch(`/api/groups/${id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });
      if (response.ok) {
        alert('Liittymispyyntö lähetetty!');
        fetchMembers();
      }
    } catch (error) {
      console.error('Liittymispyyntö epäonnistui:', error);
    }
  }

  // Poistu ryhmästä itse (kirjautunut jäsen)
  async function handleLeaveGroup() {
    if (!user) return;
    try {
      const response = await fetch(`/api/groups/${id}/members/${user.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        alert('Poistuit ryhmästä.');
        fetchMembers();
      }
    } catch (error) {
      console.error('Ryhmästä poistuminen epäonnistui:', error);
    }
  }

  // Omistaja hyväksyy tai hylkää pyynnön
  async function handleRequestAction(userId, action) {
    try {
      const response = await fetch(`/api/groups/${id}/requests/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Pyynnön käsittely epäonnistui:', error);
    }
  }

  // Poista jäsen ryhmästä (omistajan toiminto)
  async function handleRemoveMember(userId) {
    try {
      const response = await fetch(`/api/groups/${id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Jäsenen poisto epäonnistui:', error);
    }
  }

  // Elokuvan poistaminen ryhmästä
  async function handleDeleteMovie(movieId) {
    try {
      const response = await fetch(`/api/groups/${id}/movies/${movieId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id })
      });

      if (response.ok) {
        setMovies((prevMovies) =>
          prevMovies.filter((movie) => String(movie.movie_id) !== String(movieId) && String(movie.id) !== String(movieId))
        );
      } else {
        const errData = await response.json();
        alert(errData.error || 'Elokuvan poisto epäonnistui.');
      }
    } catch (error) {
      console.error('Virhe elokuvaa poistettaessa:', error);
    }
  }

  if (loading) {
    return <div className="container"><p>Ladataan...</p></div>;
  }

  const userMembership = members.find((m) => user && String(m.user_id) === String(user.id));
  
  // Onko käyttäjä ryhmän hyväksytty jäsen tai omistaja
  const isAcceptedMember = user && (isOwner || (userMembership && userMembership.status === 'accepted'));

  return (
    <div className="container" style={{ padding: '1rem' }}>
      <h1>{group ? group.name : `Ryhmä #${id}`}</h1>

      {/* Liittymisnappi kirjautuneelle käyttäjälle, joka ei vielä ole jäsen eikä omistaja */}
      {user && !isOwner && !userMembership && (
        <button
          onClick={handleJoinRequest}
          style={{ background: '#0066cc', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem' }}
        >
          {texts?.joinGroup || 'Liity ryhmään'}
        </button>
      )}

      {/* "Poistu ryhmästä" -painike hyväksytylle jäsenelle (joka ei ole omistaja) */}
      {isAcceptedMember && !isOwner && (
        <button
          onClick={handleLeaveGroup}
          style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', marginBottom: '1rem' }}
        >
          {texts?.leaveGroup || 'Poistu ryhmästä'}
        </button>
      )}

      {userMembership && userMembership.status === 'pending' && (
        <p style={{ fontStyle: 'italic', color: '#666' }}>Liittymispyyntö odottaa omistajan hyväksyntää.</p>
      )}

      {/* Ryhmän jäsenet - Näkyy vain kirjautuneille jäsenille / omistajalle */}
      <section className="group-members-section" style={{ marginTop: '1.5rem', background: '#f5f5f5', padding: '1rem', borderRadius: '8px' }}>
        <h2>{texts?.members || 'Jäsenet'}</h2>
        
        {!user ? (
          <p>Kirjaudu sisään ja liity ryhmään nähdäksesi ryhmän jäsenet.</p>
        ) : !isAcceptedMember ? (
          <p>Sinun täytyy olla hyväksytty ryhmän jäsen nähdäksesi muut jäsenet.</p>
        ) : members.filter(m => m.status === 'accepted').length === 0 ? (
          <p>Ryhmällä ei ole vielä hyväksyttyjä jäseniä.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 1rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {members.filter(m => m.status === 'accepted').map((member) => (
              <li
                key={member.user_id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ddd',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                👤 {member.username}
                {/* Jäsenen poistonappi näytetään omistajalle */}
                {isOwner && String(member.user_id) !== String(group.owner_id) && (
                  <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    style={{ background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Odottavat pyynnöt näytetään vain omistajalle */}
        {isOwner && members.some(m => m.status === 'pending') && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
            <h3>Odottavat liittymispyynnöt</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {members.filter(m => m.status === 'pending').map((reqUser) => (
                <li key={reqUser.user_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span>{reqUser.username}</span>
                  <button
                    onClick={() => handleRequestAction(reqUser.user_id, 'accept')}
                    style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Hyväksy
                  </button>
                  <button
                    onClick={() => handleRequestAction(reqUser.user_id, 'reject')}
                    style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Hylkää
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Ryhmän elokuvat ja julisteet */}
      <section className="group-movies-section" style={{ marginTop: '2rem' }}>
        <h2>{texts?.groupMovies || 'Ryhmän elokuvat'}</h2>

        {movies.length === 0 ? (
          <p>Ryhmään ei ole vielä lisätty elokuvia.</p>
        ) : (
          <div
            className="movies-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1.5rem',
              marginTop: '1rem'
            }}
          >
            {movies.map((movie) => {
              const posterUrl = movie.poster_path
                ? movie.poster_path.startsWith('http')
                  ? movie.poster_path
                  : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null;

              const targetMovieId = movie.movie_id || movie.id;

              return (
                <div
                  key={targetMovieId}
                  className="movie-card"
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    background: '#ffffff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.movie_title || movie.title}
                      style={{
                        width: '100%',
                        height: '225px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '225px',
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        fontSize: '0.85rem'
                      }}
                    >
                      Ei julistetta
                    </div>
                  )}

                  <h3
                    style={{
                      fontSize: '1rem',
                      margin: '0.75rem 0 0.5rem 0',
                      textAlign: 'center',
                      wordBreak: 'break-word'
                    }}
                  >
                    {movie.movie_title || movie.title}
                  </h3>

                  {/* Poista elokuva -painike näytetään VAIN ryhmän hyväksytylle jäsenelle tai omistajalle */}
                  {isAcceptedMember && (
                    <button
                      onClick={() => handleDeleteMovie(targetMovieId)}
                      style={{
                        marginTop: 'auto',
                        background: '#ff4d4d',
                        color: 'white',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      {texts?.delete || 'Poista'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}