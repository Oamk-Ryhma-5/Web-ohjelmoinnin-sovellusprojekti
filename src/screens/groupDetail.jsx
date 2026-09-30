import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/useLanguage.js';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { texts } = useLanguage();

  // Luetaan ryhmä-olio React Routerin statesta
  const groupFromState = location.state?.group;

  // Jos ryhmän nimi löytyy statesta, käytetään sitä. Muussa tapauksessa käytetään oletustekstiä.
  const groupName = groupFromState?.name || `${texts.group || 'Ryhmä'} #${id}`;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: '1rem', cursor: 'pointer', padding: '0.4rem 0.8rem' }}
      >
        &larr; {texts.back || 'Takaisin'}
      </button>

      <h1>{groupName}</h1>
    </div>
  );
}