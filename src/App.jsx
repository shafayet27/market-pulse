import React, { useEffect, useState, useRef } from 'react';
import Modal from './components/Modal';

const REFRESH_INTERVAL_MS = 60000;
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
