import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// StrictMode intentionally omitted: it double-mounts in dev and would emit join/create twice.
createRoot(document.getElementById('root')).render(<App />);
