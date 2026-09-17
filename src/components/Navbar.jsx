import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#222', color: '#fff' }}>
      <Link to="/" style={{ color: '#fff' }}>Koti</Link>
      <Link to="/search" style={{ color: '#fff' }}>Haku</Link>
      <Link to="/login" style={{ color: '#fff' }}>Kirjaudu</Link>
    </nav>
  );
}

export default Navbar;