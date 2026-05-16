"use strict";

// =============================================================
// Универсальный загрузчик степенной модели.
// Параметры передаются через глобал CRYPTO_PL_CONFIG, который
// должен быть определён в HTML до подключения этого скрипта:
//   {
//     symbol: "BTC" | "ETH" | ...,
//     name:   "Bitcoin" | "Ethereum",
//     accent: "#f7931a",                  // цвет акцента
//     genesis: "2009-01-03",              // дата запуска сети
//     firstPrice: "2010-07-17",           // первая рыночная цена
//     embedded: [["YYYY-MM-DD", price], ...], // fallback история
//   }
// =============================================================
(function () {
  const CFG = window.CRYPTO_PL_CONFIG;
  if (!CFG) { console.error("CRYPTO_PL_CONFIG is missing"); return; }

  // Применяем цвет акцента
  document.documentElement.style.setProperty("--accent", CFG.accent);

  const GENESIS = new Date(CFG.genesis + "T00:00:00Z");
  const FIRST_PRICE_DATE = new Date(CFG.firstPrice + "T00:00:00Z");
  const MS_PER_DAY = 86400000;

  let basisDate = GENESIS;
  function daysSinceBasis(d) {
    return (d.getTime() - basisDate.getTime()) / MS_PER_DAY;
  }

  // =============================================================
  // OLS-регрессия в лог-лог пространстве
  // =============================================================
  function fitPowerLaw(pts) {
    const xs = [], ys = [];
    for (const p of pts) {
      const days = daysSinceBasis(p.date);
      if (days <= 0 || p.price <= 0) continue;
      xs.push(Math.log10(days));
      ys.push(Math.log10(p.price));
    }
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      den += (xs[i] - mx) ** 2;
    }
    const b = num / den;
    const a = my - b * mx;
    const residuals = xs.map((x, i) => ys[i] - (a + b * x));
    // R²
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
      ssRes += residuals[i] ** 2;
      ssTot += (ys[i] - my) ** 2;
    }
    const r2 = 1 - ssRes / ssTot;
    return { a, b, residuals, xs, ys, r2, n };
  }

  function quantile(arr, q) {
    const s = [...arr].sort((x, y) => x - y);
    const pos = (s.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return s[lo];
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }

  // =============================================================
  // Состояние
  // =============================================================
  let points = (CFG.embedded || []).map(([d, p]) => ({ date: new Date(d + "T00:00:00Z"), price: p }));
  let model = null;
  let extremes = null;
  let quantiles = null;
  let dataSource = "embedded";

  const SHOW = {
    extremes: true,
    quantile: false,
    points: true,
    mode: "date", // "date" | "loglog"
  };

  function recompute() {
    model = fitPowerLaw(points);
    const r = model.residuals;
    extremes = { upper: Math.max(...r), lower: Math.min(...r) };
    quantiles = { upper: quantile(r, 0.95), lower: quantile(r, 0.05) };
    document.getElementById("model-coef").textContent =
      `a = ${model.a.toFixed(4)}, b = ${model.b.toFixed(4)} · R² = ${model.r2.toFixed(4)} · n = ${model.n}`;
  }

  function fairValue(date) {
    const days = daysSinceBasis(date);
    if (days <= 0) return NaN;
    return Math.pow(10, model.a + model.b * Math.log10(days));
  }
  function channelAt(date, dev) {
    return fairValue(date) * Math.pow(10, dev);
  }

  // =============================================================
  // Построение графика
  // =============================================================
  function buildTraces() {
    const lastDate = points[points.length - 1].date;
    const horizon = new Date(lastDate.getTime() + 5 * 365 * MS_PER_DAY);
    const startDate = new Date(GENESIS.getTime() + 200 * MS_PER_DAY);
    const grid = [];
    const stepDays = 10;
    for (let t = startDate.getTime(); t <= horizon.getTime(); t += stepDays * MS_PER_DAY) {
      grid.push(new Date(t));
    }

    const gridDays = grid.map(d => daysSinceBasis(d));
    const fair = grid.map(d => fairValue(d));
    const upE = grid.map(d => channelAt(d, extremes.upper));
    const lowE = grid.map(d => channelAt(d, extremes.lower));
    const upQ = grid.map(d => channelAt(d, quantiles.upper));
    const lowQ = grid.map(d => channelAt(d, quantiles.lower));

    const xPoints = SHOW.mode === "date" ? points.map(p => p.date) : points.map(p => daysSinceBasis(p.date));
    const xGrid = SHOW.mode === "date" ? grid : gridDays;
    const yPoints = points.map(p => p.price);

    const traces = [];

    if (SHOW.extremes) {
      traces.push({
        x: xGrid, y: upE,
        name: "Верх канала (экстремум)",
        mode: "lines",
        line: { color: "#f85149", width: 1.5, dash: "dot" },
        hovertemplate: "Верх (экстр.): $%{y:,.0f}<extra></extra>",
      });
      traces.push({
        x: xGrid, y: lowE,
        name: "Низ канала (экстремум)",
        mode: "lines",
        line: { color: "#3fb950", width: 1.5, dash: "dot" },
        fill: "tonexty",
        fillcolor: hexToRgba(CFG.accent, 0.04),
        hovertemplate: "Низ (экстр.): $%{y:,.0f}<extra></extra>",
      });
    }

    if (SHOW.quantile) {
      traces.push({
        x: xGrid, y: upQ,
        name: "95-й квантиль",
        mode: "lines",
        line: { color: "#d29922", width: 1, dash: "dash" },
        hovertemplate: "95%: $%{y:,.0f}<extra></extra>",
      });
      traces.push({
        x: xGrid, y: lowQ,
        name: "5-й квантиль",
        mode: "lines",
        line: { color: "#58a6ff", width: 1, dash: "dash" },
        hovertemplate: "5%: $%{y:,.0f}<extra></extra>",
      });
    }

    traces.push({
      x: xGrid, y: fair,
      name: "Fair Value (регрессия)",
      mode: "lines",
      line: { color: CFG.accent, width: 2.5 },
      hovertemplate: "Fair: $%{y:,.2f}<extra></extra>",
    });

    if (SHOW.points) {
      traces.push({
        x: xPoints, y: yPoints,
        name: CFG.symbol + " цена",
        mode: "lines",
        line: { color: "#58a6ff", width: 1.2 },
        hovertemplate: SHOW.mode === "date"
          ? "%{x|%Y-%m-%d}<br>" + CFG.symbol + ": $%{y:,.2f}<extra></extra>"
          : "День %{x:.0f}<br>" + CFG.symbol + ": $%{y:,.2f}<extra></extra>",
      });
    }
    return traces;
  }

  function buildLayout() {
    const isLogLog = SHOW.mode === "loglog";
    return {
      paper_bgcolor: "#0d1117",
      plot_bgcolor: "#0d1117",
      font: { color: "#e6edf3", family: "ui-monospace, SFMono-Regular, Menlo, monospace", size: 12 },
      margin: { l: 70, r: 20, t: 20, b: 50 },
      showlegend: true,
      legend: {
        orientation: "h",
        x: 0, y: 1.06,
        bgcolor: "rgba(22,27,34,0.6)",
        bordercolor: "#30363d",
        borderwidth: 1,
      },
      hovermode: "x unified",
      xaxis: {
        title: isLogLog
          ? "Дней от " + (basisDate === GENESIS ? "Genesis" : "первой цены") + " (log)"
          : "Дата",
        type: isLogLog ? "log" : "date",
        gridcolor: "#21262d",
        zerolinecolor: "#30363d",
        tickfont: { color: "#8b949e" },
      },
      yaxis: {
        title: "Цена " + CFG.symbol + " (USD, log)",
        type: "log",
        gridcolor: "#21262d",
        zerolinecolor: "#30363d",
        tickfont: { color: "#8b949e" },
        tickformat: "$,",
      },
    };
  }

  function render() {
    Plotly.react("chart", buildTraces(), buildLayout(), {
      responsive: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    });
    updateStats();
  }

  function updateStats() {
    const last = points[points.length - 1];
    const today = new Date();
    const fairToday = fairValue(today);
    const dev = last.price / fairValue(last.date) - 1;
    const upE = channelAt(today, extremes.upper);
    const lowE = channelAt(today, extremes.lower);
    const logP = Math.log10(last.price);
    const logL = Math.log10(lowE);
    const logU = Math.log10(upE);
    const pos = ((logP - logL) / (logU - logL)) * 100;

    document.getElementById("stat-price").textContent = "$" + fmt(last.price);
    document.getElementById("stat-fair").textContent = "$" + fmt(fairToday);
    const devEl = document.getElementById("stat-dev");
    devEl.textContent = (dev >= 0 ? "+" : "") + (dev * 100).toFixed(1) + "%";
    devEl.className = "value " + (dev >= 0 ? "green" : "red");
    const posEl = document.getElementById("stat-pos");
    posEl.textContent = isFinite(pos) ? pos.toFixed(0) + "%" : "—";
    posEl.className = "value " + (pos > 80 ? "red" : pos < 20 ? "green" : "");
  }

  function fmt(n) {
    if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (n >= 1) return n.toFixed(2);
    return n.toFixed(4);
  }

  function hexToRgba(hex, a) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // =============================================================
  // Загрузка данных
  //   1) CryptoCompare histoday allData=true — полная ежедневная история
  //   2) fallback: встроенный embedded
  //   3) спот-цена с CryptoCompare /data/price
  // =============================================================
  async function loadHistory() {
    const status = document.getElementById("status");
    status.textContent = "Грузим полную ежедневную историю из CryptoCompare…";
    status.className = "status-loading";

    try {
      const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${CFG.symbol}&tsym=USD&allData=true`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const arr = j && j.Data && j.Data.Data;
      if (!Array.isArray(arr) || arr.length === 0) throw new Error("empty data");
      const fresh = arr
        .filter(x => x.close > 0)
        .map(x => ({ date: new Date(x.time * 1000), price: x.close }));
      if (fresh.length < 100) throw new Error("too few points: " + fresh.length);
      points = fresh;
      dataSource = "CryptoCompare (daily, " + fresh.length + " pts)";
      status.textContent = "✓ Загружено " + fresh.length + " дневных точек с CryptoCompare.";
      status.className = "status-ok";
    } catch (e) {
      console.warn("history fetch failed:", e);
      status.textContent = "Не удалось загрузить онлайн-историю (" + e.message + "). Используется встроенная.";
      status.className = "status-fail";
      dataSource = "embedded (monthly, " + points.length + " pts)";
    }
    document.getElementById("data-source").textContent = dataSource;
  }

  async function fetchSpot() {
    try {
      const r = await fetch(
        `https://min-api.cryptocompare.com/data/price?fsym=${CFG.symbol}&tsyms=USD`,
        { cache: "no-store" }
      );
      if (!r.ok) return;
      const j = await r.json();
      if (j && j.USD > 0) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const last = points[points.length - 1];
        if ((today - last.date) / MS_PER_DAY > 0.5) {
          points.push({ date: today, price: j.USD });
        } else {
          points[points.length - 1] = { date: today, price: j.USD };
        }
      }
    } catch (e) { /* ignore */ }
  }

  // =============================================================
  // UI handlers
  // =============================================================
  function bindUI() {
    document.getElementById("btn-channels").addEventListener("click", function () {
      SHOW.extremes = !SHOW.extremes;
      this.classList.toggle("active", SHOW.extremes);
      render();
    });
    document.getElementById("btn-quantile").addEventListener("click", function () {
      SHOW.quantile = !SHOW.quantile;
      this.classList.toggle("active", SHOW.quantile);
      render();
    });
    document.getElementById("btn-points").addEventListener("click", function () {
      SHOW.points = !SHOW.points;
      this.classList.toggle("active", SHOW.points);
      render();
    });
    document.getElementById("x-mode").addEventListener("change", function () {
      SHOW.mode = this.value;
      render();
    });
    document.getElementById("basis").addEventListener("change", function () {
      basisDate = this.value === "genesis" ? GENESIS : FIRST_PRICE_DATE;
      recompute();
      render();
    });
  }

  // =============================================================
  // Старт
  // =============================================================
  (async function () {
    bindUI();
    // 1) сначала рисуем по embedded fallback, чтобы что-то показать сразу
    if (points.length > 0) {
      recompute();
      render();
    }
    // 2) грузим полную историю
    await loadHistory();
    // 3) добавляем спот-цену на сегодня
    await fetchSpot();
    // 4) пересчёт и перерисовка
    if (points.length > 0) {
      recompute();
      render();
    }
  })();
})();
