import React from 'react';
import { useLanguage } from '../context/useLanguage.js';

export default function Groups() {
  const { texts } = useLanguage();

  return (
    <div className="container">
      <h1>{texts.groups || 'Ryhmät'}</h1>
      <p>Täältä voit luoda ja selata elokuvaryhmiä.</p>
    </div>
  );
}