import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import App from './App';
import './styles/global.css';

/* Init theme before first render to avoid flash */
const saved = localStorage.getItem('ck-theme') || 'light';
document.documentElement.setAttribute('data-theme', saved);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background:'var(--s2)', color:'var(--t1)', border:'1px solid var(--border2)', fontSize:13 },
              success: { iconTheme:{ primary:'var(--acc2)', secondary:'var(--s2)' } },
              error:   { iconTheme:{ primary:'var(--rose)', secondary:'var(--s2)' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
