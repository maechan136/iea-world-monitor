#!/usr/bin/env node
/**
 * update.js
 * data/latest.json を読み込んでindex.htmlを自動生成する
 * ダーク Intelligence Dashboard テーマ
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'latest.json');
if (!fs.existsSync(dataPath)) {
  console.error('❌ data/latest.json が見つかりません');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const now = new Date();
const dateStr = now.toLocaleDateString('ja-JP', {
  year: 'numeric', month: 'long', day: 'numeric',
  weekday: 'long', timeZone: 'Asia/Tokyo'
});
const timeStr = now.toLocaleTimeString('ja-JP', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo'
});

const RISK_CONFIG = {
  '最高': { cls: 'risk-critical', dot: '#da3633', label: '危険度: 最高', badge: 'CRITICAL' },
  '高':   { cls: 'risk-high',     dot: '#fb923c', label: '危険度: 高',   badge: 'HIGH'     },
  '中':   { cls: 'risk-moderate', dot: '#d29922', label: '危険度: 中',   badge: 'MODERATE' },
  '低':   { cls: 'risk-low',      dot: '#3fb950', label: '危険度: 低',   badge: 'LOW'      },
};

const COUNTRY_META = {
  JP: { flag: '🇯🇵', name: '日本',           nameEn: 'JAPAN'         },
  KR: { flag: '🇰🇷', name: '韓国',           nameEn: 'SOUTH KOREA'  },
  TW: { flag: '🇹🇼', name: '台湾',           nameEn: 'TAIWAN'        },
  CN: { flag: '🇨🇳', name: '中国',           nameEn: 'CHINA'         },
  PH: { flag: '🇵🇭', name: 'フィリピン',     nameEn: 'PHILIPPINES'   },
  VN: { flag: '🇻🇳', name: 'ベトナム',       nameEn: 'VIETNAM'       },
  DE: { flag: '🇩🇪', name: 'ドイツ',         nameEn: 'GERMANY'       },
  FR: { flag: '🇫🇷', name: 'フランス',       nameEn: 'FRANCE'        },
  GB: { flag: '🇬🇧', name: 'イギリス',       nameEn: 'UK'            },
  US: { flag: '🇺🇸', name: 'アメリカ',       nameEn: 'USA'           },
  CA: { flag: '🇨🇦', name: 'カナダ',         nameEn: 'CANADA'        },
  AU: { flag: '🇦🇺', name: 'オーストラリア', nameEn: 'AUSTRALIA'     },
};

const REGIONS = [
  { id: 'asia',         icon: '🌏', title: 'アジア太平洋',   sub: 'ASIA-PACIFIC',          codes: ['JP', 'KR', 'TW'] },
  { id: 'china',        icon: '🐉', title: '中国',           sub: 'CHINA',                 codes: ['CN'] },
  { id: 'asean',        icon: '🌴', title: '東南アジア',     sub: 'SOUTHEAST ASIA',        codes: ['PH', 'VN'] },
  { id: 'europe',       icon: '🌍', title: '欧州',           sub: 'EUROPE',                codes: ['DE', 'FR', 'GB'] },
  { id: 'north-america',icon: '🌎', title: '北米',           sub: 'NORTH AMERICA',         codes: ['US', 'CA'] },
  { id: 'oceania',      icon: '🦘', title: 'オセアニア',     sub: 'OCEANIA',               codes: ['AU'] },
];

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function metricChips(metrics) {
  if (!metrics || !metrics.length) return '';
  return `<div class="metric-chips">${metrics.map(m =>
    `<div class="chip${m.alert ? ' chip-alert' : ''}">
      <span class="chip-val">${esc(m.value)}</span>
      <span class="chip-lbl">${esc(m.label)}</span>
    </div>`
  ).join('')}</div>`;
}

function bulletList(items, icon) {
  if (!items || !items.length) return '';
  return `<ul class="bullet-list">${items.map(i =>
    `<li><span class="bullet-icon">${icon}</span><span>${esc(i)}</span></li>`
  ).join('')}</ul>`;
}

function riskOutlookList(items) {
  if (!items || !items.length) return '';
  return `<ul class="bullet-list">${items.map(i => {
    const alertMatch = i.match(/^【(最高|高|中|低)リスク】/);
    const levelMap = { '最高': 'risk-critical', '高': 'risk-high', '中': 'risk-moderate', '低': 'risk-low' };
    const cls = alertMatch ? levelMap[alertMatch[1]] : '';
    const text = alertMatch ? i.replace(alertMatch[0], '') : i;
    return `<li><span class="risk-tag ${cls}">${alertMatch ? alertMatch[1] : ''}リスク</span><span>${esc(text)}</span></li>`;
  }).join('')}</ul>`;
}

function countryCard(code, idx) {
  const meta = COUNTRY_META[code];
  const cd = data.countries?.[code];
  if (!meta || !cd) return '';
  const risk = RISK_CONFIG[cd.risk_level] || RISK_CONFIG['中'];
  const cardId = `card-${code.toLowerCase()}`;

  return `
<div class="country-card" id="${cardId}">
  <div class="card-header" onclick="toggleCard('${cardId}')">
    <div class="card-header-left">
      <span class="card-flag">${meta.flag}</span>
      <div class="card-title-group">
        <span class="card-name">${meta.name}</span>
        <span class="card-name-en">${meta.nameEn}</span>
      </div>
    </div>
    <div class="card-header-right">
      <span class="risk-pill ${risk.cls}">
        <span class="risk-dot" style="background:${risk.dot}"></span>
        ${risk.label}
      </span>
      <span class="card-chevron">›</span>
    </div>
  </div>
  <div class="card-body">
    ${metricChips(cd.metrics)}
    <div class="key-event-row">
      <span class="ke-label">📌 本日の注目</span>
      <span class="ke-text">${esc(cd.key_event || '—')}</span>
    </div>
    <p class="card-summary">${esc(cd.summary || '')}</p>

    <div class="section-toggle" onclick="toggleSection('${code}-energy')">
      <span class="st-arrow" id="arr-${code}-energy">▶</span>
      <span>⚡ エネルギー・産業影響</span>
    </div>
    <div class="section-body" id="sec-${code}-energy">
      ${bulletList(cd.energy_impact, '⚡')}
    </div>

    <div class="section-toggle" onclick="toggleSection('${code}-policy')">
      <span class="st-arrow" id="arr-${code}-policy">▶</span>
      <span>🏛️ 政策対応</span>
    </div>
    <div class="section-body" id="sec-${code}-policy">
      ${bulletList(cd.policy_response, '🏛️')}
    </div>

    <div class="section-toggle" onclick="toggleSection('${code}-outlook')">
      <span class="st-arrow" id="arr-${code}-outlook">▶</span>
      <span>🔮 リスク見通し</span>
    </div>
    <div class="section-body" id="sec-${code}-outlook">
      ${riskOutlookList(cd.risk_outlook)}
    </div>

    ${cd.sources ? `<div class="card-sources">出典: ${esc(cd.sources)}</div>` : ''}
  </div>
</div>`;
}

function regionSection(region) {
  const cards = region.codes.map((c, i) => countryCard(c, i)).join('\n');
  return `
<section class="region-section" id="reg-${region.id}">
  <div class="region-hdr">
    <span class="region-icon">${region.icon}</span>
    <div class="region-title-group">
      <span class="region-title">${region.title}</span>
      <span class="region-sub">${region.sub}</span>
    </div>
  </div>
  ${cards}
</section>`;
}

const hormuzStatus = data.market?.hormuz_status || '情報確認中';
const hormuzDetail = data.market?.hormuz_detail || '';
const hormuzIsBlocked = hormuzStatus.includes('封鎖');
const hormuzIsPartial = hormuzStatus.includes('部分');
const hormuzColor = hormuzIsBlocked ? '#da3633' : hormuzIsPartial ? '#fb923c' : '#3fb950';
const hormuzFlowPct = data.risk_summary?.hormuz_flow_rate || (hormuzIsBlocked ? 0 : hormuzIsPartial ? 40 : 100);
const globalRiskIndex = data.risk_summary?.global_risk_index || 75;

const marketItems = [
  { label: 'Brent原油', value: data.market?.brent ? `$${data.market.brent}` : '—', unit: '/bbl', cls: 'val-up' },
  { label: 'WTI原油',  value: data.market?.wti   ? `$${data.market.wti}`   : '—', unit: '/bbl', cls: 'val-up' },
  { label: 'TTF天然ガス', value: data.market?.ttf ? `${data.market.ttf}€` : '—', unit: '/MWh', cls: 'val-warn' },
  { label: 'JKM LNG',  value: data.market?.jkm   ? `$${data.market.jkm}`  : '—', unit: '/MMBtu', cls: 'val-warn' },
];

const riskCounts = Object.values(data.countries || {}).reduce((acc, c) => {
  acc[c.risk_level] = (acc[c.risk_level] || 0) + 1; return acc;
}, {});

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="中東危機によるホルムズ海峡封鎖が各国エネルギー情勢に与える影響のリアルタイム分析">
<title>中東危機 エネルギー情勢モニター | World Intelligence Dashboard</title>
<style>
:root {
  --bg:      #0d1117;
  --bg2:     #161b22;
  --bg3:     #21262d;
  --border:  #30363d;
  --text:    #e6edf3;
  --text2:   #8b949e;
  --accent:  #388bfd;
  --crit:    #da3633;
  --high:    #fb923c;
  --warn:    #d29922;
  --ok:      #3fb950;
  --purple:  #a78bfa;
  --font-mono: 'SF Mono','Fira Code','Consolas',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6}

/* ── HEADER ─────────────────────────────── */
.hd{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.hd-logo{display:flex;align-items:center;gap:10px}
.hd-logo-icon{font-size:22px}
.hd-logo-text{font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:.05em}
.hd-logo-text span{color:var(--accent)}
.hd-sep{flex:1}
.hd-live{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11px;color:var(--text2)}
.live-dot{width:8px;height:8px;border-radius:50%;background:var(--ok);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.hd-risk-index{font-family:var(--font-mono);font-size:11px;background:var(--bg3);border:1px solid var(--border);padding:4px 10px;border-radius:4px}
.hd-risk-index strong{color:var(--crit);font-size:15px;margin-right:4px}

/* ── ALERT BANNER ───────────────────────── */
.alert-banner{background:#3d1111;border-bottom:1px solid var(--crit);padding:10px 24px;display:flex;align-items:flex-start;gap:10px;font-size:12px}
.alert-icon{color:var(--crit);font-size:16px;flex-shrink:0;margin-top:1px}
.alert-text{color:#ffa0a0;line-height:1.5}

/* ── HORMUZ BAR ─────────────────────────── */
.hormuz-bar{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 24px;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px}
.hz-label{font-family:var(--font-mono);font-size:10px;color:var(--text2);letter-spacing:.08em;white-space:nowrap}
.hz-status-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.hz-status{font-family:var(--font-mono);font-size:12px;font-weight:700}
.hz-detail{font-size:11px;color:var(--text2)}
.hz-flow{text-align:right;font-family:var(--font-mono);font-size:11px;color:var(--text2)}
.hz-flow-bar{width:120px;height:6px;background:var(--bg3);border-radius:3px;margin-top:4px;overflow:hidden}
.hz-flow-fill{height:100%;border-radius:3px;transition:width .5s}

/* ── MARKET BAR ─────────────────────────── */
.market-bar{background:var(--bg2);border-bottom:1px solid var(--border);padding:10px 24px;display:flex;gap:24px;flex-wrap:wrap;align-items:center}
.mkt-item{display:flex;flex-direction:column;align-items:center;min-width:90px}
.mkt-val{font-family:var(--font-mono);font-size:16px;font-weight:700;line-height:1.2}
.mkt-label{font-family:var(--font-mono);font-size:9px;color:var(--text2);letter-spacing:.05em;margin-top:2px}
.val-up{color:#f85149}
.val-warn{color:var(--warn)}
.val-ok{color:var(--ok)}
.mkt-sep{width:1px;height:32px;background:var(--border);flex-shrink:0}

/* ── RISK SUMMARY BAR ───────────────────── */
.risk-summary-bar{background:var(--bg2);border-bottom:1px solid var(--border);padding:8px 24px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.rs-label{font-family:var(--font-mono);font-size:10px;color:var(--text2);letter-spacing:.08em}
.rs-chip{display:flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:11px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:3px 8px}
.rs-dot{width:7px;height:7px;border-radius:50%}

/* ── NAV ────────────────────────────────── */
.region-nav{position:sticky;top:0;z-index:100;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;overflow-x:auto;scrollbar-width:none}
.region-nav::-webkit-scrollbar{display:none}
.nav-btn{flex-shrink:0;padding:10px 14px;font-family:var(--font-mono);font-size:11px;letter-spacing:.04em;color:var(--text2);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;white-space:nowrap;transition:all .15s}
.nav-btn:hover{color:var(--text)}
.nav-btn.active{color:var(--accent);border-bottom-color:var(--accent)}

/* ── MAIN LAYOUT ────────────────────────── */
main{max-width:1000px;margin:0 auto;padding:24px 16px 48px}

/* ── REGION SECTION ─────────────────────── */
.region-section{margin-bottom:32px;scroll-margin-top:42px}
.region-hdr{display:flex;align-items:center;gap:10px;padding:10px 0 10px;border-bottom:1px solid var(--border);margin-bottom:12px}
.region-icon{font-size:18px}
.region-title-group{display:flex;align-items:baseline;gap:8px}
.region-title{font-size:15px;font-weight:600}
.region-sub{font-family:var(--font-mono);font-size:10px;color:var(--text2);letter-spacing:.08em}

/* ── COUNTRY CARD ───────────────────────── */
.country-card{background:var(--bg2);border:1px solid var(--border);border-radius:6px;margin-bottom:10px;overflow:hidden;transition:border-color .15s}
.country-card:hover{border-color:#484f58}
.card-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;cursor:pointer;user-select:none}
.card-header-left{display:flex;align-items:center;gap:10px}
.card-flag{font-size:20px;line-height:1}
.card-title-group{display:flex;flex-direction:column;gap:1px}
.card-name{font-size:14px;font-weight:600}
.card-name-en{font-family:var(--font-mono);font-size:9px;color:var(--text2);letter-spacing:.08em}
.card-header-right{display:flex;align-items:center;gap:10px}
.risk-pill{display:flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:10px;padding:3px 8px;border-radius:12px;border:1px solid var(--border);font-weight:600}
.risk-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.risk-critical{color:#ffa0a0;background:rgba(218,54,51,.15);border-color:rgba(218,54,51,.4)}
.risk-high{color:#ffc180;background:rgba(251,146,60,.15);border-color:rgba(251,146,60,.4)}
.risk-moderate{color:#ffe082;background:rgba(210,153,34,.15);border-color:rgba(210,153,34,.4)}
.risk-low{color:#90ee90;background:rgba(63,185,80,.15);border-color:rgba(63,185,80,.4)}
.card-chevron{color:var(--text2);font-size:18px;transition:transform .2s;transform:rotate(90deg)}
.country-card.open .card-chevron{transform:rotate(-90deg)}
.card-body{display:none;padding:0 16px 16px}
.country-card.open .card-body{display:block}

/* ── METRIC CHIPS ───────────────────────── */
.metric-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;padding-top:4px}
.chip{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;display:flex;flex-direction:column;align-items:center;min-width:80px}
.chip-alert{border-color:rgba(218,54,51,.5);background:rgba(218,54,51,.1)}
.chip-val{font-family:var(--font-mono);font-size:13px;font-weight:700;line-height:1.2;color:var(--text)}
.chip-alert .chip-val{color:#ffa0a0}
.chip-lbl{font-family:var(--font-mono);font-size:9px;color:var(--text2);margin-top:2px;text-align:center;letter-spacing:.03em}

/* ── KEY EVENT ──────────────────────────── */
.key-event-row{background:#1c2027;border-left:3px solid var(--accent);border-radius:0 4px 4px 0;padding:8px 12px;margin-bottom:10px;display:flex;gap:8px;align-items:flex-start}
.ke-label{font-family:var(--font-mono);font-size:9px;color:var(--accent);letter-spacing:.05em;white-space:nowrap;margin-top:2px;flex-shrink:0}
.ke-text{font-size:12px;font-weight:600;color:var(--text);line-height:1.5}

/* ── SUMMARY ────────────────────────────── */
.card-summary{font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:10px}

/* ── COLLAPSIBLE SECTION ────────────────── */
.section-toggle{display:flex;align-items:center;gap:6px;padding:6px 8px;margin:4px 0 0;background:var(--bg3);border-radius:4px;cursor:pointer;font-size:12px;color:var(--text2);user-select:none;transition:background .15s}
.section-toggle:hover{background:#2d333b;color:var(--text)}
.st-arrow{font-family:var(--font-mono);font-size:10px;transition:transform .2s;display:inline-block}
.section-body{display:none;padding:6px 0 4px 8px}
.section-body.open{display:block}

/* ── BULLET LIST ────────────────────────── */
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:5px}
.bullet-list li{display:flex;gap:8px;align-items:flex-start;font-size:12px;color:var(--text2);line-height:1.5}
.bullet-icon{flex-shrink:0;font-size:11px;margin-top:1px}
.risk-tag{font-family:var(--font-mono);font-size:9px;padding:1px 5px;border-radius:3px;flex-shrink:0;margin-top:2px;font-weight:600}
.risk-tag.risk-critical{background:rgba(218,54,51,.25);color:#ffa0a0}
.risk-tag.risk-high{background:rgba(251,146,60,.25);color:#ffc180}
.risk-tag.risk-moderate{background:rgba(210,153,34,.25);color:#ffe082}
.risk-tag.risk-low{background:rgba(63,185,80,.25);color:#90ee90}

/* ── SOURCES ────────────────────────────── */
.card-sources{margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-family:var(--font-mono);font-size:9px;color:#484f58;letter-spacing:.03em}

/* ── FOOTER ─────────────────────────────── */
footer{background:var(--bg2);border-top:1px solid var(--border);padding:16px 24px;font-family:var(--font-mono);font-size:10px;color:var(--text2);text-align:center;line-height:2}

@media(max-width:600px){
  .hd{padding:10px 12px;gap:10px}
  .hormuz-bar{grid-template-columns:1fr;gap:6px}
  .hz-flow{text-align:left}
  .market-bar{gap:12px;padding:10px 12px}
  main{padding:16px 12px 40px}
  .metric-chips{gap:4px}
  .chip{min-width:70px}
}
</style>
</head>
<body>

<!-- ═══ HEADER ═══ -->
<div class="hd">
  <div class="hd-logo">
    <span class="hd-logo-icon">🌍</span>
    <span class="hd-logo-text">WORLD <span>MONITOR</span></span>
  </div>
  <div class="hd-sep"></div>
  <div class="hd-risk-index">
    <strong>${globalRiskIndex}</strong>グローバルリスク指数
  </div>
  <div class="hd-live">
    <span class="live-dot"></span>
    最終更新: ${dateStr} ${timeStr} JST
  </div>
</div>

${data.global_alert ? `<!-- ═══ ALERT BANNER ═══ -->
<div class="alert-banner">
  <span class="alert-icon">⚡</span>
  <span class="alert-text"><strong>本日の最重要動向: </strong>${esc(data.global_alert)}</span>
</div>` : ''}

<!-- ═══ HORMUZ BAR ═══ -->
<div class="hormuz-bar">
  <span class="hz-label">🚢 ホルムズ海峡</span>
  <div class="hz-status-row">
    <span class="hz-status" style="color:${hormuzColor}">${esc(hormuzStatus)}</span>
    ${hormuzDetail ? `<span class="hz-detail">${esc(hormuzDetail)}</span>` : ''}
  </div>
  <div class="hz-flow">
    <div style="color:${hormuzColor};font-weight:700;font-size:12px">${hormuzFlowPct}%</div>
    <div>通過流量（危機前比）</div>
    <div class="hz-flow-bar"><div class="hz-flow-fill" style="width:${hormuzFlowPct}%;background:${hormuzColor}"></div></div>
  </div>
</div>

<!-- ═══ MARKET BAR ═══ -->
<div class="market-bar">
  ${marketItems.map((m, i) => `${i > 0 ? '<div class="mkt-sep"></div>' : ''}
  <div class="mkt-item">
    <span class="mkt-val ${m.cls}">${esc(m.value)}</span>
    <span class="mkt-label">${esc(m.label)}${esc(m.unit)}</span>
  </div>`).join('')}
  <div class="mkt-sep"></div>
  <div class="mkt-item">
    <span class="mkt-val" style="color:var(--text2);font-size:12px">${esc(data.risk_summary?.brent_vs_precrisis || '—')}</span>
    <span class="mkt-label">危機前比(Brent)</span>
  </div>
</div>

<!-- ═══ RISK SUMMARY ═══ -->
<div class="risk-summary-bar">
  <span class="rs-label">国別危険度:</span>
  ${riskCounts['最高'] ? `<span class="rs-chip"><span class="rs-dot" style="background:var(--crit)"></span>最高: ${riskCounts['最高']}カ国</span>` : ''}
  ${riskCounts['高']   ? `<span class="rs-chip"><span class="rs-dot" style="background:var(--high)"></span>高: ${riskCounts['高']}カ国</span>` : ''}
  ${riskCounts['中']   ? `<span class="rs-chip"><span class="rs-dot" style="background:var(--warn)"></span>中: ${riskCounts['中']}カ国</span>` : ''}
  ${riskCounts['低']   ? `<span class="rs-chip"><span class="rs-dot" style="background:var(--ok)"></span>低: ${riskCounts['低']}カ国</span>` : ''}
  ${data.risk_summary?.iea_strategic_release ? `<span class="rs-label" style="margin-left:8px">IEA協調放出:</span><span class="rs-chip">${esc(data.risk_summary.iea_strategic_release)}</span>` : ''}
</div>

<!-- ═══ NAV ═══ -->
<nav class="region-nav" id="regionNav">
${REGIONS.map((r, i) => `  <button class="nav-btn${i === 0 ? ' active' : ''}" onclick="goRegion('reg-${r.id}',this)">${r.icon} ${r.title}</button>`).join('\n')}
</nav>

<!-- ═══ MAIN ═══ -->
<main>
${REGIONS.map(r => regionSection(r)).join('\n')}
</main>

<footer>
  🌍 中東危機 エネルギー情勢モニター &nbsp;|&nbsp; 生産性カウンセラー® 前川 勇<br>
  データソース: ${(data.data_sources || []).map(esc).join(' · ')}<br>
  本レポートはAIが自動収集・生成したものです。投資・政策判断には一次情報をご確認ください。
</footer>

<script>
function toggleCard(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}

function toggleSection(id) {
  const body = document.getElementById('sec-' + id);
  const arrow = document.getElementById('arr-' + id);
  const isOpen = body.classList.toggle('open');
  arrow.style.transform = isOpen ? 'rotate(90deg)' : '';
}

function goRegion(id, btn) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

window.addEventListener('scroll', () => {
  const regionIds = [${REGIONS.map(r => `'reg-${r.id}'`).join(',')}];
  const tabs = document.querySelectorAll('.nav-btn');
  let cur = 0;
  regionIds.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 60) cur = i;
  });
  tabs.forEach((t, i) => t.classList.toggle('active', i === cur));
});
</script>
</body>
</html>`;

const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`✅ index.html 生成完了 (${dateStr} ${timeStr})`);
console.log(`   ホルムズ: ${hormuzStatus}`);
console.log(`   Brent: $${data.market?.brent || '—'} | WTI: $${data.market?.wti || '—'} | TTF: ${data.market?.ttf || '—'}€`);
console.log(`   国別リスク: 最高=${riskCounts['最高']||0} 高=${riskCounts['高']||0} 中=${riskCounts['中']||0} 低=${riskCounts['低']||0}`);
