import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Elokuvahaku TMDb-rajapinnasta
app.get('/api/movies/search', async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.kakkatahna;

  if (!query) {
    return res.status(400).json({ error: 'Hakusana puuttuu' });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=fi-FI`
    );
    const data = await response.json();
    res.json(data.results);
  } catch (error) {
    res.status(500).json({ error: 'Virhe haettaessa elokuvia' });
  }
});

app.listen(PORT, () => {
  console.log(`Palvelin pyörii portissa ${PORT}`);
});