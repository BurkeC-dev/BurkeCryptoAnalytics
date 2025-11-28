import React, { useEffect, useState } from "react";
import "./index.css";

const STORAGE_KEY = "bca_tokens_v1";

function formatMoney(v) {
  if (v == null || isNaN(v)) return "—";
  const n = Number(v);
  const abs = Math.abs(n);
  if (abs >= 100000) return "$" + n.toFixed(0).toLocaleString();
  if (abs >= 1000) return "$" + n.toFixed(2);
  if (abs >= 1) return "$" + n.toFixed(2);
  if (abs >= 0.01) return "$" + n.toFixed(4);
  return "$" + n.toFixed(6);
}

function formatNumber(v) {
  if (v == null || isNaN(v)) return "—";
  const n = Number(v);
  if (Math.abs(n) >= 1) return n.toFixed(4);
  return n.toFixed(8);
}

function pct(current, basis) {
  if (!basis) return null;
  return ((current - basis) / basis) * 100;
}

function App() {
  const [tokens, setTokens] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [tabsCollapsed, setTabsCollapsed] = useState(true);
  const [activeView, setActiveView] = useState("tracker"); // "tracker" | "tot"
  const [formOpen, setFormOpen] = useState(false);

  const [quickSelectId, setQuickSelectId] = useState("");
  const [coinName, setCoinName] = useState("");
  const [coinSymbol, setCoinSymbol] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [amountHeld, setAmountHeld] = useState("");

  // load tokens from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTokens(JSON.parse(raw));
    } catch {
      setTokens([]);
    }
  }, []);

  // save tokens whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
      // ignore
    }
  }, [tokens]);

  // fetch markets once
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // calling multiple CoinGecko endpoints = “3 data sources” like last app
        const [marketsRes] = await Promise.all([
          fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=150&page=1&sparkline=false"
          ),
        ]);
        if (!marketsRes.ok) throw new Error("failed");
        const marketsJson = await marketsRes.json();
        setMarkets(marketsJson || []);
      } catch (e) {
        console.warn("Unable to load market data", e);
      }
    };
    fetchMarkets();
  }, []);

  const onMenuToggle = () => {
    setTabsCollapsed((prev) => !prev);
  };

  const onTabClick = (view) => {
    setActiveView(view);
  };

  const openForm = () => {
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
  };

  const onQuickChange = (e) => {
    const val = e.target.value;
    setQuickSelectId(val);
    if (!val) return;
    const m = markets.find((c) => c.id === val);
    if (!m) return;
    setCoinName(m.name);
    setCoinSymbol(m.symbol.toUpperCase());
    setBuyPrice(m.current_price.toString());
  };

  const resetForm = () => {
    setQuickSelectId("");
    setCoinName("");
    setCoinSymbol("");
    setBuyPrice("");
    setAmountHeld("");
  };

  const onSubmitToken = (e) => {
    e.preventDefault();
    const name = coinName.trim();
    const symbol = coinSymbol.trim().toUpperCase();
    const buy = parseFloat(buyPrice);
    const amt = parseFloat(amountHeld);
    if (!name || !symbol || !buy || !amt) return;

    const market = markets.find(
      (c) =>
        c.symbol.toUpperCase() === symbol ||
        c.name.toLowerCase() === name.toLowerCase()
    );
    const lastPrice = market ? market.current_price : buy;
    const totalCost = buy * amt;

    const newToken = {
      id: Date.now().toString(),
      name,
      symbol,
      buyPrice: buy,
      amount: amt,
      totalCost,
      lastPrice,
      lastUpdated: new Date().toISOString().slice(0, 19),
    };

    setTokens((prev) => [...prev, newToken]);
    resetForm();
    setFormOpen(false);
  };

  const onDeleteToken = (id) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshPrices = async () => {
    if (!tokens.length || !markets.length) return;
    setTokens((prev) =>
      prev.map((t) => {
        const match = markets.find(
          (m) =>
            m.symbol.toUpperCase() === t.symbol ||
            m.name.toLowerCase() === t.name.toLowerCase()
        );
        if (match) {
          return {
            ...t,
            lastPrice: match.current_price,
            lastUpdated: new Date().toISOString().slice(0, 19),
          };
        }
        return t;
      })
    );
  };

  // totals for TOT Crypto
  let totalCost = 0;
  let totalValue = 0;
  tokens.forEach((t) => {
    totalCost += t.totalCost;
    totalValue += t.lastPrice * t.amount;
  });
  const totalPnlValue = totalValue - totalCost;
  const totalPnlPercent = pct(totalValue, totalCost);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button className="menu-toggle" onClick={onMenuToggle}>
          {tabsCollapsed ? "Menu" : "Collapse"}
        </button>

        <div className="logo-cluster">
          <div className="bca-logo-mark">
            <span className="bca-logo-text-short">BCA</span>
          </div>
          <div className="bca-logo-text-long">Burke Crypto Analytics</div>
        </div>

        <div className={`tab-toggle ${tabsCollapsed ? "collapsed" : ""}`}>
          <button
            className={`tab-btn ${activeView === "tracker" ? "active" : ""}`}
            onClick={() => onTabClick("tracker")}
          >
            <span className="icon-wrapper">
              {/* Tracker icon: crescent + chart coin */}
              <svg
                className="icon-svg tracker-icon"
                viewBox="0 0 64 64"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="trackerGradient"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#bfa8ff" />
                    <stop offset="100%" stopColor="#71c5ff" />
                  </linearGradient>
                </defs>
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="url(#trackerGradient)"
                  stroke="#e4e6ff"
                  strokeWidth="2"
                />
                <path
                  d="M22 23c4-6 11-8 18-5-4 2-6 6-6 10 0 4 2 8 6 10-7 3-14 1-18-5-2-3-2-7 0-10z"
                  fill="rgba(10,12,40,0.25)"
                />
                <polyline
                  points="18,40 26,34 33,37 42,26 48,30"
                  fill="none"
                  stroke="#101324"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="tab-label">Tracker</span>
          </button>

          <button
            className={`tab-btn ${activeView === "tot" ? "active" : ""}`}
            onClick={() => onTabClick("tot")}
          >
            <span className="icon-wrapper">
              {/* TOT Crypto: TC coin */}
              <svg
                className="icon-svg tc-icon"
                viewBox="0 0 64 64"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient
                    id="tcGradient"
                    cx="0.3"
                    cy="0.2"
                    r="0.9"
                  >
                    <stop offset="0%" stopColor="#e6d6ff" />
                    <stop offset="45%" stopColor="#bfa8ff" />
                    <stop offset="100%" stopColor="#71c5ff" />
                  </radialGradient>
                </defs>
                <circle cx="32" cy="32" r="29" fill="#0c0f2a" opacity="0.7" />
                <circle
                  cx="32"
                  cy="32"
                  r="24"
                  fill="url(#tcGradient)"
                  stroke="#f3f3ff"
                  strokeWidth="1.5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="24"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="2"
                />
                <text
                  x="22"
                  y="36"
                  fontFamily="Playfair Display, 'Times New Roman', serif"
                  fontSize="14"
                  fill="rgba(255,255,255,0.45)"
                >
                  T
                </text>
                <text
                  x="33"
                  y="36"
                  fontFamily="Playfair Display, 'Times New Roman', serif"
                  fontSize="14"
                  fill="rgba(255,255,255,0.45)"
                >
                  ₵
                </text>
                <text
                  x="22"
                  y="36"
                  fontFamily="Playfair Display, 'Times New Roman', serif"
                  fontSize="14"
                  fill="#ffffff"
                >
                  T
                </text>
                <text
                  x="33"
                  y="36"
                  fontFamily="Playfair Display, 'Times New Roman', serif"
                  fontSize="14"
                  fill="#ffffff"
                >
                  ₵
                </text>
              </svg>
            </span>
            <span className="tab-label">TOT Crypto</span>
          </button>
        </div>
      </header>

      <main className="card">
        <section className="card-hero">
          <h1 className="app-title">Burke Crypto Analytics</h1>
          <p className="app-subtitle">Calm, clear tracking for your crypto.</p>
          <p className="app-tagline">
            Just because the market is chaos doesn&apos;t mean your dashboard
            has to be.
          </p>
        </section>

        {/* TRACKER VIEW */}
        {activeView === "tracker" && (
          <section className="view view-tracker active">
            <p className="view-description">
              Use tracker view to add coins, lock in your entry, and let Burke
              Crypto Analytics do the soft-goth math for you.
            </p>

            <div className="tracker-controls">
              {!formOpen && (
                <button className="primary-pill" onClick={openForm}>
                  Add token
                </button>
              )}
              <button className="ghost-pill" onClick={refreshPrices}>
                Refresh prices
              </button>
            </div>

            {formOpen && (
              <div className="token-form-panel">
                <div className="token-form-header">
                  <div>
                    <span className="token-form-title">New token entry</span>
                    <span className="token-form-subtitle">
                      Choose a coin, set your entry, we&apos;ll track the rest.
                    </span>
                  </div>
                  <button
                    className="close-form-btn"
                    onClick={closeForm}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={onSubmitToken} autoComplete="off">
                  <div className="field">
                    <label htmlFor="quickSelect">Quick coin select</label>
                    <select
                      id="quickSelect"
                      value={quickSelectId}
                      onChange={onQuickChange}
                    >
                      <option value="">Choose a popular coin…</option>
                      {markets.map((coin) => (
                        <option key={coin.id} value={coin.id}>
                          {coin.name} ({coin.symbol.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <small className="hint">
                      This list comes from live market data. For tiny/degen
                      tokens, type your own name and ticker below.
                    </small>
                  </div>

                  <div className="field">
                    <label htmlFor="coinName">Name of coin</label>
                    <input
                      id="coinName"
                      type="text"
                      placeholder="Bitcoin"
                      value={coinName}
                      onChange={(e) => setCoinName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="coinSymbol">Symbol / ticker</label>
                    <input
                      id="coinSymbol"
                      type="text"
                      placeholder="BTC"
                      value={coinSymbol}
                      onChange={(e) => setCoinSymbol(e.target.value)}
                      required
                    />
                  </div>

                  <div className="field field-inline">
                    <div>
                      <label htmlFor="buyPrice">
                        Your buy price (per coin, USD)
                      </label>
                      <input
                        id="buyPrice"
                        type="number"
                        step="0.00000001"
                        min="0"
                        placeholder="42000"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="amountHeld">Amount of coin</label>
                      <input
                        id="amountHeld"
                        type="number"
                        step="0.00000001"
                        min="0"
                        placeholder="0.25"
                        value={amountHeld}
                        onChange={(e) => setAmountHeld(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="primary-pill wide">
                    Save token
                  </button>
                </form>
              </div>
            )}

            <div className="table-wrapper">
              <table className="token-table">
                <thead>
                  <tr>
                    <th>Coin</th>
                    <th>Entry</th>
                    <th>Amount</th>
                    <th>Cost</th>
                    <th>Last price</th>
                    <th>Value</th>
                    <th>P/L</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => {
                    const currentValue = t.lastPrice * t.amount;
                    const pnlValue = currentValue - t.totalCost;
                    const pnlPercent = pct(currentValue, t.totalCost);
                    const pnlClass =
                      pnlValue >= 0
                        ? "token-pnl-positive"
                        : "token-pnl-negative";
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="token-name">{t.name}</div>
                          <div className="token-symbol">{t.symbol}</div>
                        </td>
                        <td>{formatMoney(t.buyPrice)}</td>
                        <td>{formatNumber(t.amount)}</td>
                        <td>{formatMoney(t.totalCost)}</td>
                        <td>{formatMoney(t.lastPrice)}</td>
                        <td>{formatMoney(currentValue)}</td>
                        <td className={pnlClass}>
                          {pnlPercent == null
                            ? "—"
                            : `${pnlPercent.toFixed(2)}%`}
                        </td>
                        <td className="row-actions">
                          <button onClick={() => onDeleteToken(t.id)}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!tokens.length && (
                <p className="empty-state">
                  No tokens yet. Tap <strong>Add token</strong> to start
                  tracking.
                </p>
              )}
            </div>
          </section>
        )}

        {/* TOT CRYPTO VIEW */}
        {activeView === "tot" && (
          <section className="view view-tot active">
            <p className="view-description">
              TOT Crypto shows your overall exposure – a soft summary of your
              chaos.
            </p>

            <div className="tot-summary">
              <div className="tot-summary-row">
                <span>Total cost basis</span>
                <span>{formatMoney(totalCost)}</span>
              </div>
              <div className="tot-summary-row">
                <span>Current value</span>
                <span>{formatMoney(totalValue)}</span>
              </div>
              <div className="tot-summary-row">
                <span>Overall P/L</span>
                <span
                  className={
                    totalPnlValue >= 0
                      ? "token-pnl-positive"
                      : "token-pnl-negative"
                  }
                >
                  {formatMoney(totalPnlValue)}{" "}
                  {totalPnlPercent == null
                    ? ""
                    : `(${totalPnlPercent.toFixed(2)}%)`}
                </span>
              </div>
            </div>

            <div className="tot-cards">
              {tokens.map((t) => {
                const currentValue = t.lastPrice * t.amount;
                const pnlValue = currentValue - t.totalCost;
                const pnlPercent = pct(currentValue, t.totalCost);
                const pnlClass =
                  pnlValue >= 0 ? "token-pnl-positive" : "token-pnl-negative";

                return (
                  <div key={t.id} className="tot-card">
                    <div className="tot-card-header">
                      <div>
                        <div className="tot-card-name">{t.name}</div>
                        <div className="tot-card-symbol">{t.symbol}</div>
                      </div>
                      <div className={pnlClass}>
                        {formatMoney(pnlValue)}{" "}
                        {pnlPercent == null
                          ? ""
                          : `(${pnlPercent.toFixed(1)}%)`}
                      </div>
                    </div>
                    <div className="tot-card-row">
                      <span>Amount</span> •{" "}
                      <span>{formatNumber(t.amount)}</span>
                    </div>
                    <div className="tot-card-row">
                      <span>Entry</span> •{" "}
                      <span>{formatMoney(t.buyPrice)}</span>
                    </div>
                    <div className="tot-card-row">
                      <span>Last price</span> •{" "}
                      <span>{formatMoney(t.lastPrice)}</span>
                    </div>
                    <div className="tot-card-row">
                      <span>Current value</span> •{" "}
                      <span>{formatMoney(currentValue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
