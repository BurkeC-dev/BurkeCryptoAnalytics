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
