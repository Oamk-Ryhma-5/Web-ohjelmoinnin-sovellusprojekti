import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Testireitti
app.get('/', (req, res) => {
  res.send('Backend toimii!');
});

app.listen(PORT, () => {
  console.log(`Palvelin pyörii portissa ${PORT}`);
});