#!/usr/bin/env node
/**
 * update.js
 * data/latest.json を読み込んでindex.htmlを自動生成する
 * Claude Codeがデータ収集後にこのスクリプトを実行する
 */

const fs = require('fs');
const path = require('path');

// データ読み込み
const dataPath = path.join(__dirname, 'data', 'latest.json');
if (!fs.existsSync(dataPath)) {
  console.error('❌ data/latest.json が見つかりません');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const now = new Date(data.updated_at);
const dateStr = now.toLocaleDateString('ja-JP', {
  year: 'numeric', month: 'long', day: 'numeric',
  weekday: 'long', timeZone: 'Asia/Tokyo'
});
const timeStr = now.toLocaleTimeString('ja-JP', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo'
});

// リスクレベルのスタイル
const riskStyle = {
  '最高': { badge: 'crit', color: '#c0392b', label: '🔴 危険度: 最高' },
  '高':   { badge: 'high', color: '#e67e22', label: '🟠 危険度: 高' },
  '中':   { badge: 'mod',  color: '#2980b9', label: '🔵 危険度: 中' },
  '低':   { badge: 'low-r',color: '#27ae60', label: '🟢 危険度: 低' },
};

// 国データのマッピング
const countryMap = {
  JP: { flag: '🇯🇵', name: '日本',         region: 'asia' },
  KR: { flag: '🇰🇷', name: '韓国',         region: 'asia' },
  TW: { flag: '🇹🇼', name: '台湾',         region: 'china-taiwan' },
  CN: { flag: '🇨🇳', name: '中国',         region: 'china-taiwan' },
  PH: { flag: '🇵🇭', name: 'フィリピン',   region: 'asean' },
  VN: { flag: '🇻🇳', name: 'ベトナム',     region: 'asean' },
  DE: { flag: '🇩🇪', name: 'ドイツ',       region: 'europe' },
  FR: { flag: '🇫🇷', name: 'フランス',     region: 'europe' },
  GB: { flag: '🇬🇧', name: 'イギリス',     region: 'europe' },
  US: { flag: '🇺🇸', name: 'アメリカ',     region: 'north-america' },
  CA: { flag: '🇨🇦', name: 'カナダ',       region: 'north-america' },
  AU: { flag: '🇦🇺', name: 'オーストラリア', region: 'oceania' },
};

// 国カードHTML生成
function countryCard(code, countryData) {
  const meta = countryMap[code];
  if (!meta || !countryData) return '';
  const risk = riskStyle[countryData.risk_level] || riskStyle['中'];
  return `
  <div class="country-card" id="card-${code.toLowerCase()}">
    <div class="country-header" onclick="toggleCard('card-${code.toLowerCase()}')">
      <span class="country-flag">${meta.flag}</span>
      <span class="country-name">${meta.name}</span>
      <span class="country-risk ${risk.badge}">${risk.label}</span>
      <span class="toggle-icon">▼</span>
    </div>
    <div class="country-body">
      <div class="key-event-box">
        <span class="key-event-label">📌 本日の注目</span>
        <span class="key-event-text">${countryData.key_event || '—'}</span>
      </div>
      <p class="country-summary">${countryData.summary || '情報収集中...'}</p>
      ${countryData.sources ? `<div class="source-note">出典: ${countryData.sources}</div>` : ''}
    </div>
  </div>`;
}

// 地域セクションHTML生成
function regionSection(id, flag, title, sub, riskLabel, riskClass, codes) {
  const cards = codes.map(c => countryCard(c, data.countries[c])).join('\n');
  return `
<section class="region-section" id="${id}">
  <div class="region-header">
    <div class="region-flag">${flag}</div>
    <div class="region-title">
      <h2>${title}</h2>
      <div class="sub">${sub}</div>
    </div>
    <div class="risk-badge ${riskClass}">${riskLabel}</div>
  </div>
  ${cards}
</section>`;
}

// ホルムズ状況バッジ
const hormuzStatus = data.market?.hormuz_status || '情報確認中';
const hormuzColor = hormuzStatus.includes('封鎖') ? '#c0392b'
  : hormuzStatus.includes('部分') ? '#e67e22' : '#27ae60';

// HTML全文生成
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="IEA加盟国の中東危機エネルギー状況をリアルタイムで追跡。毎朝6時更新。">
<title>IEA World Energy Monitor — 毎日更新</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: #0d0d0d;
    --paper: #f5f0e8;
    --accent: #c0392b;
    --accent2: #e67e22;
    --accent3: #2980b9;
    --muted: #6b6355;
    --border: #c8bfa8;
    --critical: #fdecea;
    --moderate: #fef9e7;
    --low: #eaf4fb;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--paper); color: var(--ink); font-family: 'Noto Serif JP', serif; line-height: 1.8; }

  header { background: var(--ink); color: var(--paper); padding: 2.5rem 2rem 2rem; text-align: center; }
  .header-label { font-family: 'Space Mono', monospace; font-size: 0.68rem; letter-spacing: 0.3em; color: var(--accent); text-transform: uppercase; margin-bottom: 0.8rem; }
  header h1 { font-size: clamp(1.3rem, 3vw, 2rem); font-weight: 700; line-height: 1.4; margin-bottom: 0.6rem; }
  .update-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
    padding: 0.4em 1em; margin-top: 1rem;
    font-family: 'Space Mono', monospace; font-size: 0.68rem; color: #ccc;
  }
  .live-dot { width: 8px; height: 8px; background: #2ecc71; border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

  /* グローバルアラート */
  .global-alert {
    background: var(--accent); color: white;
    padding: 0.8rem 2rem; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 0.72rem;
    letter-spacing: 0.05em;
  }

  /* 市場データバー */
  .market-bar {
    background: #1a1a1a; color: #e0d8cc;
    padding: 1rem 2rem; display: flex; flex-wrap: wrap;
    gap: 1.2rem; justify-content: center;
    font-family: 'Space Mono', monospace; font-size: 0.7rem;
    border-bottom: 2px solid var(--accent);
  }
  .market-item { text-align: center; }
  .market-val { font-size: 1.1rem; font-weight: 700; display: block; }
  .market-lbl { color: #888; font-size: 0.6rem; }
  .market-val.up { color: #e74c3c; }
  .market-val.down { color: #2ecc71; }
  .market-val.neutral { color: #f39c12; }

  /* ホルムズステータス */
  .hormuz-bar {
    background: ${hormuzColor}22; border-left: 4px solid ${hormuzColor};
    padding: 0.7rem 2rem; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 0.72rem;
  }
  .hormuz-status { color: ${hormuzColor}; font-weight: 700; }

  /* ナビ */
  .region-nav { position: sticky; top: 0; z-index: 100; background: var(--ink); display: flex; overflow-x: auto; scrollbar-width: none; }
  .region-nav::-webkit-scrollbar { display: none; }
  .nav-tab { flex-shrink: 0; padding: 0.8rem 1.1rem; font-family: 'Space Mono', monospace; font-size: 0.63rem; letter-spacing: 0.08em; color: #888; cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap; background: none; border-top: none; border-left: none; border-right: none; transition: all 0.2s; }
  .nav-tab:hover { color: var(--paper); }
  .nav-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  main { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }

  /* 地域セクション */
  .region-section { margin-bottom: 3rem; scroll-margin-top: 50px; }
  .region-header { display: flex; align-items: center; gap: 1rem; border-top: 2px solid var(--ink); padding-top: 1rem; margin-bottom: 1.2rem; }
  .region-flag { font-size: 1.5rem; }
  .region-title { flex: 1; }
  .region-title h2 { font-size: 1.2rem; font-weight: 700; }
  .region-title .sub { font-family: 'Space Mono', monospace; font-size: 0.62rem; color: var(--muted); letter-spacing: 0.08em; }
  .risk-badge { font-family: 'Space Mono', monospace; font-size: 0.6rem; padding: 0.3em 0.7em; letter-spacing: 0.08em; }
  .risk-critical { background: var(--accent); color: white; }
  .risk-high { background: var(--accent2); color: white; }
  .risk-moderate { background: var(--accent3); color: white; }

  /* 国カード */
  .country-card { border: 1px solid var(--border); margin-bottom: 1.2rem; background: white; }
  .country-header { display: flex; align-items: center; padding: 0.8rem 1.1rem; background: var(--ink); color: var(--paper); cursor: pointer; gap: 0.7rem; }
  .country-flag { font-size: 1.2rem; }
  .country-name { flex: 1; font-weight: 600; font-size: 0.95rem; }
  .country-risk { font-family: 'Space Mono', monospace; font-size: 0.58rem; padding: 0.2em 0.5em; }
  .crit { background: var(--accent); }
  .high { background: var(--accent2); }
  .mod { background: var(--accent3); }
  .low-r { background: #27ae60; }
  .toggle-icon { font-family: 'Space Mono', monospace; font-size: 0.8rem; color: #aaa; transition: transform 0.2s; }
  .country-card.open .toggle-icon { transform: rotate(180deg); }
  .country-body { display: none; padding: 1.2rem 1.4rem; }
  .country-card.open .country-body { display: block; }

  /* 注目イベント */
  .key-event-box { display: flex; gap: 0.6rem; align-items: flex-start; background: var(--critical); border-left: 3px solid var(--accent); padding: 0.6rem 0.9rem; margin-bottom: 0.8rem; }
  .key-event-label { font-family: 'Space Mono', monospace; font-size: 0.62rem; color: var(--accent); flex-shrink: 0; margin-top: 0.1rem; }
  .key-event-text { font-size: 0.85rem; font-weight: 600; }

  .country-summary { font-size: 0.88rem; line-height: 1.8; color: #333; margin-bottom: 0.8rem; }
  .source-note { font-family: 'Space Mono', monospace; font-size: 0.58rem; color: var(--muted); padding-top: 0.5rem; border-top: 1px solid var(--border); }

  /* フッター */
  footer { background: var(--ink); color: #666; padding: 1.5rem 2rem; font-family: 'Space Mono', monospace; font-size: 0.6rem; text-align: center; line-height: 2; }
  footer a { color: #888; }

  @media (max-width: 600px) {
    header { padding: 2rem 1rem 1.5rem; }
    main { padding: 1.5rem 1rem 3rem; }
    .market-bar { gap: 0.8rem; }
  }
</style>
</head>
<body>

<header>
  <div class="header-label">IEA Emergency Monitor — Daily Intelligence</div>
  <h1>🌍 中東危機 エネルギー情勢<br>リアルタイム国別モニター</h1>
  <div class="update-badge">
    <span class="live-dot"></span>
    最終更新: ${dateStr} ${timeStr} JST ／ 毎朝6:00 自動更新
  </div>
</header>

${data.global_alert ? `<div class="global-alert">⚡ 本日の最重要動向: ${data.global_alert}</div>` : ''}

<div class="hormuz-bar">
  ホルムズ海峡ステータス:
  <span class="hormuz-status">${hormuzStatus}</span>
</div>

<div class="market-bar">
  <div class="market-item">
    <span class="market-val up">${data.market?.brent ? '$' + data.market.brent : '—'}</span>
    <span class="market-lbl">Brent原油 /bbl</span>
  </div>
  <div class="market-item">
    <span class="market-val up">${data.market?.wti ? '$' + data.market.wti : '—'}</span>
    <span class="market-lbl">WTI原油 /bbl</span>
  </div>
  <div class="market-item">
    <span class="market-val neutral">${data.market?.ttf ? data.market.ttf + ' €/MWh' : '—'}</span>
    <span class="market-lbl">TTF天然ガス（欧州）</span>
  </div>
  <div class="market-item">
    <span class="market-val neutral">${data.market?.jkm ? '$' + data.market.jkm + '/MMBtu' : '—'}</span>
    <span class="market-lbl">JKM LNG（アジア）</span>
  </div>
</div>

<nav class="region-nav" id="regionNav">
  <button class="nav-tab active" onclick="scrollToRegion('asia')">🌏 アジア太平洋</button>
  <button class="nav-tab" onclick="scrollToRegion('china-taiwan')">🐉 中国・台湾</button>
  <button class="nav-tab" onclick="scrollToRegion('asean')">🌴 東南アジア</button>
  <button class="nav-tab" onclick="scrollToRegion('europe')">🌍 欧州</button>
  <button class="nav-tab" onclick="scrollToRegion('north-america')">🌎 北米</button>
  <button class="nav-tab" onclick="scrollToRegion('oceania')">🦘 オセアニア</button>
</nav>

<main>

${regionSection('asia', '🌏', 'アジア太平洋地域', 'ASIA-PACIFIC', 'HIGH RISK', 'risk-critical', ['JP', 'KR'])}
${regionSection('china-taiwan', '🐉', '中国・台湾', 'CHINA & TAIWAN', 'DIVERGENT RESILIENCE', 'risk-high', ['CN', 'TW'])}
${regionSection('asean', '🌴', '東南アジア', 'SOUTHEAST ASIA', 'ACUTE SHORTAGE', 'risk-critical', ['PH', 'VN'])}
${regionSection('europe', '🌍', '欧州', 'EUROPE — GAS STORAGE CRISIS', 'HIGH RISK', 'risk-high', ['DE', 'FR', 'GB'])}
${regionSection('north-america', '🌎', '北米', 'NORTH AMERICA — NET EXPORTERS', 'MODERATE', 'risk-moderate', ['US', 'CA'])}
${regionSection('oceania', '🦘', 'オセアニア', 'OCEANIA — REFINED PRODUCTS CRISIS', 'CRITICAL', 'risk-critical', ['AU'])}

</main>

<footer>
  IEA World Energy Monitor ／ 生産性カウンセラー® 前川 勇<br>
  データソース: ${(data.data_sources || []).join(' · ')}<br>
  本レポートはAIが自動収集・生成したものです。投資・政策判断には一次情報をご確認ください。<br>
  <a href="https://github.com/あなたのID/iea-world-monitor">GitHub</a>
</footer>

<script>
  function toggleCard(id) {
    document.getElementById(id).classList.toggle('open');
  }
  function scrollToRegion(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
  }
  window.addEventListener('scroll', () => {
    const regions = ['asia','china-taiwan','asean','europe','north-america','oceania'];
    const tabs = document.querySelectorAll('.nav-tab');
    let current = 0;
    regions.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 80) current = i;
    });
    tabs.forEach((t, i) => t.classList.toggle('active', i === current));
  });
</script>
</body>
</html>`;

// index.html 書き出し
const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`✅ index.html を更新しました（${dateStr} ${timeStr}）`);
console.log(`   ホルムズ: ${hormuzStatus}`);
console.log(`   Brent: ${data.market?.brent || '—'} $/bbl`);
