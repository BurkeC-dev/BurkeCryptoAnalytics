import React, { useState } from "react";

const NAV_ITEMS = [
  { id: "tracker", icon: "👁️", label: "Tracker" },
  { id: "wallet", icon: "💼", label: "Wallet" }
];

function Sidebar({ isOpen, active, onChange, onToggle }) {
  return (
    <aside className="sidebar">
      <button className="sidebar-toggle" type="button" onClick={onToggle}>
        {isOpen ? "Collapse" : "Menu"}
      </button>

      <div
        className={
          "sidebar-rail " + (isOpen ? "sidebar-rail--open" : "")
        }
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              "sidebar-item " +
              (active === item.id ? "sidebar-item--active" : "")
            }
            onClick={() => onChange(item.id)}
          >
            <span>{item.icon}</span>
            {isOpen && (
              <span className="sidebar-label">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("tracker");
  const [showForm, setShowForm] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Simple form state for now (no saving yet)
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    usdAmount: "",
    coinAmount: "",
    gasFees: "",
    buySellFees: "",
    liveLink: ""
  });

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCoinPresetChange(value) {
    if (!value || value === "OTHER") return;
    const presets = {
      BTC: { name: "Bitcoin", symbol: "BTC" },
      SOL: { name: "Solana", symbol: "SOL" },
      ETH: { name: "Ethereum", symbol: "ETH" },
      XRP: { name: "XRP", symbol: "XRP" }
    };
    const preset = presets[value];
    if (!preset) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || preset.name,
      symbol: prev.symbol || preset.symbol
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // For now just log; we’ll wire real saving later
    console.log("Form submitted", form);
  }

  function handleClear() {
    setForm({
      name: "",
      symbol: "",
      usdAmount: "",
      coinAmount: "",
      gasFees: "",
      buySellFees: "",
      liveLink: ""
    });
  }

  return (
    <div className="app-shell">
      <div className="app-card">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          active={activeTab}
          onChange={setActiveTab}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Main panel */}
        <div className="app-main">
          {/* Header row */}
          <div className="app-header-row">
            <div>
              <h1 className="app-header-title">Burke Crypto Analytics</h1>
              <h2 className="app-header-subtitle">
                Calm, Clear Tracking for Your Crypto
              </h2>
              <p className="app-header-tagline">
                Just because the market is chaos doesn&apos;t mean your
                dashboard has to be.
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="app-tab-row">
                <button
                  type="button"
                  className={
                    "app-tab " +
                    (activeTab === "tracker" ? "app-tab--active" : "")
                  }
                  onClick={() => setActiveTab("tracker")}
                >
                  <span>👁️</span>
                  <span>Tracker</span>
                </button>
                <button
                  type="button"
                  className={
                    "app-tab " +
                    (activeTab === "wallet" ? "app-tab--active" : "")
                  }
                  onClick={() => setActiveTab("wallet")}
                >
                  <span>💼</span>
                  <span>Wallet</span>
                </button>
              </div>

              <button
                type="button"
                className="app-add-button"
                onClick={() => setShowForm((prev) => !prev)}
              >
                <span>{showForm ? "Hide form" : "Add token"}</span>
              </button>
            </div>
          </div>

          {/* Quick summary text */}
          <div className="app-summary-line">
            {activeTab === "tracker"
              ? "Use this space to track coins you care about in one calm view."
              : "Wallet view will help you see overall exposure and totals."}
          </div>

          {/* Form */}
          {showForm && (
            <div className="app-form-card">
              <div className="app-form-header">
                <div>
                  <div className="app-form-eyebrow">Token Manager</div>
                  <div className="app-form-title">
                    {form.name || form.symbol || "New token entry"}
                  </div>
                </div>
                <button
                  className="app-form-close"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* quick coin picker */}
                <label className="field" style={{ marginBottom: 8 }}>
                  <span className="field-label">Quick coin select</span>
                  <select
                    className="field-select"
                    defaultValue=""
                    onChange={(e) => handleCoinPresetChange(e.target.value)}
                  >
                    <option value="">Choose a popular coin…</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="SOL">Solana (SOL)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="XRP">XRP</option>
                    <option value="OTHER">Other / Custom</option>
                  </select>
                </label>

                <div className="field-grid">
                  <Field
                    label="Name of Coin"
                    value={form.name}
                    placeholder="Bitcoin"
                    onChange={(v) => handleFormChange("name", v)}
                  />
                  <Field
                    label="Symbol / Ticker"
                    value={form.symbol}
                    placeholder="BTC"
                    onChange={(v) => handleFormChange("symbol", v)}
                  />
                  <Field
                    label="$USD Amount"
                    value={form.usdAmount}
                    placeholder="411"
                    type="number"
                    onChange={(v) => handleFormChange("usdAmount", v)}
                  />
                  <Field
                    label="Coin Amount"
                    value={form.coinAmount}
                    placeholder="0.00457278"
                    type="number"
                    onChange={(v) => handleFormChange("coinAmount", v)}
                  />
                  <Field
                    label="Crypto / Gas Fees (optional)"
                    value={form.gasFees}
                    placeholder="0.003 SOL"
                    onChange={(v) => handleFormChange("gasFees", v)}
                  />
                  <Field
                    label="Buy / Sell Fees (optional)"
                    value={form.buySellFees}
                    placeholder="$1.25"
                    onChange={(v) => handleFormChange("buySellFees", v)}
                  />
                </div>

                <label className="field" style={{ marginTop: 8 }}>
                  <span className="field-label">Live price link (optional)</span>
                  <input
                    className="field-input"
                    value={form.liveLink}
                    onChange={(e) =>
                      handleFormChange("liveLink", e.target.value)
                    }
                    placeholder="https://dexscreener.com/..."
                  />
                </label>

                <div className="app-form-footer">
                  <button
                    type="button"
                    className="app-link-ghost"
                    onClick={handleClear}
                  >
                    Clear form
                  </button>
                  <button type="submit" className="app-submit">
                    Save (log only for now)
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Token list placeholder */}
          <div className="app-token-list">
            <div className="app-token-empty">
              Token cards will live here once we wire up saving/editing again.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
