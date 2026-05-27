import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          containerClassName="!top-4 sm:!top-6"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--toast-bg, #1C1917)',
              color: '#FFFBEB',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 16px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              boxShadow: '0 10px 40px -10px rgba(28, 25, 23, 0.2)',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#ECFDF5' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#FEF2F2' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
