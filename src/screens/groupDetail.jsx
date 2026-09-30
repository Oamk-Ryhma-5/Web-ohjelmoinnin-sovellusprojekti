import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage.js';
import { useUser } from '../context/useUser.js';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { texts } = useLanguage();
  const { user: currentUser } = useUser(); // Noudetaan kirjautunut käyttäjä suoraan contextista

  const [group, setGroup] = useState(location.state?.group || null);
  const [members, setMembers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      // 1. Haetaan ryhmän perustiedot
      if (!group) {
        const resGroup = await fetch(`/api/groups/${id}`);
        if (resGroup.ok) {
          const groupData = await resGroup.json();
          setGroup(groupData);
        }
      }

      // 2. Haetaan ryhmän jäsenet
      const resMembers = await fetch(`/api/groups/${id}/members`);
      if (resMembers.ok) {
        const membersData = await resMembers.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      }

      // 3. Haetaan ryhmän elokuvat
      const resMovies = await fetch(`/api/groups/${id}/movies`);
      if (resMovies.ok) {
        const moviesData = await resMovies.json();
        setMovies(Array.isArray(moviesData) ? moviesData : []);
      }
    } catch (err) {
      console.error('Virhe ryhmän tietojen hakemisessa:', err);
    } finally {
      setLoading(false);
    }
  };

  // Tarkistetaan käyttäjän rooli/tila ryhmässä
  const currentMember = members.find(m => m.user_id === currentUser?.id);
  const isOwner = currentUser?.id && group?.owner_id === currentUser.id;
  const isAcceptedMember = isOwner || currentMember?.status === 'accepted';
  const isPending = currentMember?.status === 'pending';

  // Lähetä liittymispyyntö
  const handleJoinRequest = async () => {
    if (!currentUser) return alert(texts.loginToJoin || 'Kirjaudu sisään liittyäksesi ryhmään.');
    await fetch(`/api/groups/${id}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUser.id })
    });
    fetchGroupDetails();
  };

  // Hyväksy/Hylkää pyyntö
  const handleHandleRequest = async (userId, action) => {
    await fetch(`/api/groups/${id}/requests/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    fetchGroupDetails();
  };

  // Poistu ryhmästä tai poista jäsen
  const handleRemoveMember = async (userId) => {
    await fetch(`/api/groups/${id}/members/${userId}`, { method: 'DELETE' });
    if (userId === currentUser?.id) {
      navigate('/ryhmat');
    } else {
      fetchGroupDetails();
    }
  };

  if (loading) return <div className="container" style={{ padding: '2rem' }}>{texts.loading || 'Ladataan...'}</div>;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: '1rem', cursor: 'pointer', padding: '0.4rem 0.8rem' }}>
        &larr; {texts.back || 'Takaisin'}
      </button>

      <h1>{group?.name || `${texts.group || 'Ryhmä'} #${id}`}</h1>

      {/* JOS KÄYTTÄJÄ EI OLE HYVÄKSYTTY JÄSEN */}
      {!isAcceptedMember ? (
        <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <p>{texts.groupOnlyForMembers || '🔒 Tämän ryhmän sisältö on vain hyväksytyille jäsenille.'}</p>
          {isPending ? (
            <p style={{ color: '#d97706', fontWeight: 'bold' }}>
              {texts.pendingRequest || '⏳ Liittymispyyntösi odottaa ryhmän omistajan hyväksyntää.'}
            </p>
          ) : (
            <button onClick={handleJoinRequest} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              {texts.sendJoinRequest || 'Lähetä liittymispyyntö'}
            </button>
          )}
        </div>
      ) : (
        /* JOS KÄYTTÄJÄ ON HYVÄKSYTTY JÄSEN */
        <div style={{ marginTop: '2rem' }}>
          
          {/* Ryhmän kustomoitu sisältö (Elokuvat) */}
          <section style={{ marginBottom: '2rem' }}>
            <h2>{texts.groupMovies || 'Ryhmän elokuvat 🎬'}</h2>
            {movies.length > 0 ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {movies.map(movie => (
                  <div key={movie.id} style={{ border: '1px solid #ddd', padding: '0.5rem', borderRadius: '6px', width: '150px' }}>
                    {movie.poster_path && (
                      <img src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} alt={movie.movie_title} style={{ width: '100%' }} />
                    )}
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.5rem' }}>{movie.movie_title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>{texts.noGroupMovies || 'Ryhmälle ei ole vielä lisätty elokuvia.'}</p>
            )}
          </section>

          {/* Jäsenosio & Poistuminen */}
          <section style={{ marginBottom: '2rem' }}>
            <h2>{texts.members || 'Jäsenet 👥'}</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {members.filter(m => m.status === 'accepted').map(member => (
                <li key={member.user_id} style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                  <span>👤 {member.username} {member.user_id === group?.owner_id && `(${texts.owner || 'Omistaja'})`}</span>
                  
                  {/* Omistaja voi poistaa muita, tai jäsen voi poistua itse */}
                  {(isOwner && member.user_id !== currentUser?.id) && (
                    <button onClick={() => handleRemoveMember(member.user_id)} style={{ color: 'red', cursor: 'pointer' }}>
                      {texts.removeFromGroup || 'Poista ryhmästä'}
                    </button>
                  )}
                  {member.user_id === currentUser?.id && !isOwner && (
                    <button onClick={() => handleRemoveMember(currentUser.id)} style={{ cursor: 'pointer' }}>
                      {texts.leaveGroup || 'Poistu ryhmästä'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Omistajan osio odottaville pyynnöille */}
          {isOwner && (
            <section style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
              <h3>{texts.pendingRequestsHeader || 'Odottavat liittymispyynnöt 📩'}</h3>
              {members.filter(m => m.status === 'pending').length > 0 ? (
                members.filter(m => m.status === 'pending').map(req => (
                  <div key={req.user_id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span>{req.username}</span>
                    <button onClick={() => handleHandleRequest(req.user_id, 'accept')}>
                      {texts.accept || 'Hyväksy'}
                    </button>
                    <button onClick={() => handleHandleRequest(req.user_id, 'reject')}>
                      {texts.reject || 'Hylkää'}
                    </button>
                  </div>
                ))
              ) : (
                <p>{texts.noPendingRequests || 'Ei odottavia liittymispyyntöjä.'}</p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}