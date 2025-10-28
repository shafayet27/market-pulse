/*
MarketPulse.live - Full Vite React App with Routing + Modal Detail View + Tailwind

--- Structure ---
/vite.config.js
/package.json
/postcss.config.js
/tailwind.config.js
/src/main.jsx
/src/App.jsx
/src/components/Modal.jsx

--- How to test on Vercel ---
1. npm create vite@latest marketpulse --template react
2. cd marketpulse
3. Replace src/App.jsx, src/main.jsx, tailwind.config.js, postcss.config.js, vite.config.js with the versions below.
4. npm install
5. npm run dev → local test (http://localhost:5173)
6. git init && git add . && git commit -m "init"
7. Push to GitHub
8. Go to https://vercel.com → New Project → Import your repo → Vercel auto-detects Vite → Deploy.
9. Add your Google AdSense code in /src/components/AdBanner.jsx and set REACT_APP_FMP_API_KEY in Vercel Environment Variables.
*/

// ---------------- package.json ----------------
{
  "name": "marketpulse",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.13",
    "vite": "^5.4.6"
  }
}

// ---------------- vite.config.js ----------------
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
});

// ---------------- postcss.config.js ----------------
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

// ---------------- tailwind.config.js ----------------
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

// ---------------- src/main.jsx ----------------
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// ---------------- src/index.css ----------------
@tailwind base;
@tailwind components;
@tailwind utilities;
body { @apply bg-white text-slate-800; }

// ---------------- src/components/Modal.jsx ----------------
import React from 'react';
export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-gray-600">✕</button>
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ---------------- src/App.jsx ----------------
import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import Modal from './components/Modal';

const REFRESH_INTERVAL_MS = 60_000;
const CRYPTO_IDS = ["bitcoin", "ethereum", "solana", "cardano"];
const STOCK_SYMBOLS = ["AAPL", "TSLA", "MSFT", "AMZN"];
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || "";

const fmt = (n) => n ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';

function useInterval(callback, delay) {
  const saved = useRef();
  useEffect(() => { saved.current = callback; });
  useEffect(() => {
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function AdBanner() {
  return (
    <div className="my-4 flex justify-center">
      <div className="bg-gray-100 border border-dashed border-gray-300 p-4 rounded text-center w-full max-w-md">
        <div className="text-sm text-gray-600">Ad placeholder (insert AdSense)</div>
      </div>
    </div>
  );
}

export default function App() {
  const [cryptos, setCryptos] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [chart, setChart] = useState([]);

  async function fetchCryptos() {
    const ids = CRYPTO_IDS.join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`);
    const data = await res.json();
    setCryptos(data);
  }

  async function fetchStocks() {
    const base = `https://financialmodelingprep.com/api/v3/quote-short/${STOCK_SYMBOLS.join(',')}`;
    const url = FMP_API_KEY ? `${base}?apikey=${FMP_API_KEY}` : base;
    const res = await fetch(url);
    const data = await res.json();
    setStocks(data);
  }

  async function fetchChart(id) {
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`;
    const res = await fetch(url);
    const data = await res.json();
    setChart(data.prices || []);
  }

  useEffect(() => {
    fetchCryptos();
    fetchStocks();
  }, []);

  useInterval(() => {
    fetchCryptos();
    fetchStocks();
  }, REFRESH_INTERVAL_MS);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">MarketPulse.live</h1>
      <p className="text-sm text-gray-500">Live crypto & stock snapshot</p>
      <AdBanner />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Cryptocurrencies</h2>
          {cryptos.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50" onClick={() => { setSelected({ type: 'crypto', item: c }); fetchChart(c.id); }}>
              <div className="flex items-center gap-3">
                <img src={c.image} className="w-8 h-8" />
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">${fmt(c.current_price)}</div>
                </div>
              </div>
              <div className={c.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}>{c.price_change_percentage_24h?.toFixed(2)}%</div>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Stocks</h2>
          {stocks.map((s) => (
            <div key={s.symbol} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div>{s.symbol}</div>
              <div>${fmt(s.price)}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-8 text-xs text-gray-500">Data from CoinGecko & FinancialModelingPrep • Not financial advice</footer>

      <Modal open={!!selected} onClose={() => { setSelected(null); setChart([]); }} title={selected?.item?.name || 'Details'}>
        {chart.length === 0 && <div className="text-sm text-gray-500">Loading 7-day chart…</div>}
        {chart.length > 0 && <Chart data={chart} />}
      </Modal>
    </div>
  );
}

function Chart({ data }) {
  const w = 300, h = 120;
  const max = Math.max(...data.map(p => p[1]));
  const min = Math.min(...data.map(p => p[1]));
  const points = data.map((p, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((p[1] - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return <svg width={w} height={h}><polyline fill="none" stroke="blue" strokeWidth="2" points={points} /></svg>;
}
