#!/usr/bin/env node
/**
 * update.js
 * data/latest.json を読み込んでindex.htmlを自動生成する
 * IEA Emergency Analysis Report スタイル（黒ヘッダー＋クリーム地）
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
  '最高': { cls: 'risk-crit', label: '危険度: 最高', color: '#c0392b' },
  '高':   { cls: 'risk-high', label: '危険度: 高',   color: '#e67e22' },
  '中':   { cls: 'risk-mod',  label: '危険度: 中',   color: '#2980b9' },
  '低':   { cls: 'risk-low',  label: '危険度: 低',   color: '#27ae60' },
};

const COUNTRY_META = {
  JP: { flag: '🇯🇵', name: '日本',           nameEn: 'JAPAN'        },
  KR: { flag: '🇰🇷', name: '韓国',           nameEn: 'SOUTH KOREA'  },
  TW: { flag: '🇹🇼', name: '台湾',           nameEn: 'TAIWAN'       },
  CN: { flag: '🇨🇳', name: '中国',           nameEn: 'CHINA'        },
  PH: { flag: '🇵🇭', name: 'フィリピン',     nameEn: 'PHILIPPINES'  },
  VN: { flag: '🇻🇳', name: 'ベトナム',       nameEn: 'VIETNAM'      },
  DE: { flag: '🇩🇪', name: 'ドイツ',         nameEn: 'GERMANY'      },
  FR: { flag: '🇫🇷', name: 'フランス',       nameEn: 'FRANCE'       },
  GB: { flag: '🇬🇧', name: 'イギリス',       nameEn: 'UK'           },
  US: { flag: '🇺🇸', name: 'アメリカ',       nameEn: 'USA'          },
  CA: { flag: '🇨🇦', name: 'カナダ',         nameEn: 'CANADA'       },
  AU: { flag: '🇦🇺', name: 'オーストラリア', nameEn: 'AUSTRALIA'    },
};

const REGIONS = [
  { id: 'asia',          icon: '🌏', title: 'アジア太平洋', sub: 'ASIA-PACIFIC',    codes: ['JP','KR','TW'] },
  { id: 'china',         icon: '🐉', title: '中国',         sub: 'CHINA',           codes: ['CN'] },
  { id: 'asean',         icon: '🌴', title: '東南アジア',   sub: 'SOUTHEAST ASIA',  codes: ['PH','VN'] },
  { id: 'europe',        icon: '🌍', title: '欧州',         sub: 'EUROPE',          codes: ['DE','FR','GB'] },
  { id: 'north-america', icon: '🌎', title: '北米',         sub: 'NORTH AMERICA',   codes: ['US','CA'] },
  { id: 'oceania',       icon: '🦘', title: 'オセアニア',   sub: 'OCEANIA',         codes: ['AU'] },
];

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function metricChips(metrics) {
  if (!metrics || !metrics.length) return '';
  return `<div class="metric-chips">${metrics.map(m =>
    `<div class="chip${m.alert ? ' chip-alert' : ''}">
      <div class="chip-val">${esc(m.value)}</div>
      <div class="chip-lbl">${esc(m.label)}</div>
    </div>`
  ).join('')}</div>`;
}

function bulletList(items, icon) {
  if (!items || !items.length) return '';
  return `<ul class="bullet-list">${items.map(i =>
    `<li><span class="b-icon">${icon}</span><span>${esc(i)}</span></li>`
  ).join('')}</ul>`;
}

const HORIZON_COLOR = {
  '即時': '#c0392b', '即時〜': '#c0392b',
  '短期': '#e67e22', '短〜中期': '#e67e22',
  '中期': '#2980b9', '中〜長期': '#2980b9',
  '長期': '#6b6355', '当面': '#27ae60',
};

function horizonColor(h) {
  for (const [k,v] of Object.entries(HORIZON_COLOR)) {
    if (h.startsWith(k)) return v;
  }
  return '#6b6355';
}

function riskOutlookList(items) {
  if (!items || !items.length) return '';
  return `<ul class="bullet-list">${items.map(i => {
    const level   = i.level   || '情報';
    const horizon = i.horizon || '';
    const text    = i.text    || String(i);
    const levelColorMap = { '最高':'#c0392b','高':'#e67e22','中':'#2980b9','低':'#27ae60' };
    const lc = levelColorMap[level] || '#6b6355';
    const hc = horizonColor(horizon);
    return `<li class="outlook-li">
      <span class="risk-tag" style="background:${lc}20;color:${lc};border:1px solid ${lc}40">${esc(level)}リスク</span>
      <span class="horizon-tag" style="background:${hc}15;color:${hc};border:1px solid ${hc}35">${esc(horizon)}</span>
      <span>${esc(text)}</span>
    </li>`;
  }).join('')}</ul>`;
}

function outlookHorizonRange(items) {
  if (!items || !items.length) return '';
  const labels = items.map(i => i.horizon || '').filter(Boolean);
  if (!labels.length) return '';
  const hasImmediate = labels.some(h => h.startsWith('即時'));
  const hasShort     = labels.some(h => h.startsWith('短期') || h.startsWith('短〜'));
  const hasMid       = labels.some(h => h.startsWith('中期') || h.startsWith('中〜'));
  const hasLong      = labels.some(h => h.startsWith('長期') || h.startsWith('長'));
  const hasCurrent   = labels.some(h => h.startsWith('当面'));
  const parts = [];
  if (hasImmediate) parts.push('即時');
  if (hasShort)     parts.push('短期');
  if (hasMid)       parts.push('中期');
  if (hasLong)      parts.push('長期');
  if (hasCurrent)   parts.push('当面');
  if (parts.length <= 1) return parts[0] || '';
  return `${parts[0]}〜${parts[parts.length - 1]}`;
}

function collapsibleSection(code, sectionId, label, content) {
  return `
    <div class="sec-toggle" onclick="toggleSec('${code}-${sectionId}')">
      <span class="sec-arrow" id="arr-${code}-${sectionId}">▶</span>
      <span>${label}</span>
    </div>
    <div class="sec-body" id="sec-${code}-${sectionId}">${content}</div>`;
}

function countryCard(code) {
  const meta = COUNTRY_META[code];
  const cd = data.countries?.[code];
  if (!meta || !cd) return '';
  const risk = RISK_CONFIG[cd.risk_level] || RISK_CONFIG['中'];
  const id = `card-${code.toLowerCase()}`;

  return `
<div class="country-card" id="${id}">
  <div class="card-hdr" onclick="toggleCard('${id}')">
    <div class="card-hdr-left">
      <span class="card-code">${code}</span>
      <span class="card-flag">${meta.flag}</span>
      <span class="card-name">${meta.name}</span>
    </div>
    <div class="card-hdr-right">
      <span class="risk-badge ${risk.cls}">${risk.label}</span>
      <span class="card-arrow">▲</span>
    </div>
  </div>
  <div class="card-body">
    ${metricChips(cd.metrics)}
    <div class="risk-meter"><div class="risk-meter-fill" style="width:${{最高:'92%',高:'70%',中:'45%',低:'20%'}[cd.risk_level]||'50%'};background:${risk.color}"></div></div>
    <div class="key-event-row">
      <span class="ke-icon">📌</span>
      <span class="ke-text">${esc(cd.key_event || '—')}</span>
    </div>
    <p class="card-summary">${esc(cd.summary || '')}</p>
    ${collapsibleSection(code,'energy','⚡ エネルギー・産業影響', bulletList(cd.energy_impact,'⚡'))}
    ${collapsibleSection(code,'policy','🏛️ 政策対応', bulletList(cd.policy_response,'🏛️'))}
    ${collapsibleSection(code,'outlook',`🔮 リスク見通し${outlookHorizonRange(cd.risk_outlook) ? ' — ' + outlookHorizonRange(cd.risk_outlook) : ''}`, riskOutlookList(cd.risk_outlook))}
    ${cd.sources ? `<div class="card-src">出典: ${esc(cd.sources)}</div>` : ''}
  </div>
</div>`;
}

function regionSection(r) {
  const cards = r.codes.map(c => countryCard(c)).join('\n');
  return `
<section class="region-sec" id="reg-${r.id}">
  <div class="region-hdr">
    <span class="region-icon">${r.icon}</span>
    <div>
      <div class="region-title">${r.title}</div>
      <div class="region-sub">${r.sub}</div>
    </div>
  </div>
  ${cards}
</section>`;
}

const hormuzStatus = data.market?.hormuz_status || '情報確認中';
const hormuzDetail = data.market?.hormuz_detail || '';
const hormuzIsBlocked = hormuzStatus.includes('封鎖');
const hormuzIsPartial = hormuzStatus.includes('部分');
const hormuzColor = hormuzIsBlocked ? '#c0392b' : hormuzIsPartial ? '#e67e22' : '#27ae60';
const hormuzFlow = data.risk_summary?.hormuz_flow_rate || (hormuzIsBlocked ? 0 : hormuzIsPartial ? 40 : 100);
const globalRisk = data.risk_summary?.global_risk_index || 75;

const riskCounts = Object.values(data.countries || {}).reduce((a, c) => {
  a[c.risk_level] = (a[c.risk_level] || 0) + 1; return a;
}, {});

const STATS = [
  { val: data.market?.brent ? `$${data.market.brent}` : '—',  lbl: '現在のBrent価格' },
  { val: data.market?.wti   ? `$${data.market.wti}`   : '—',  lbl: 'WTI原油価格' },
  { val: data.market?.ttf   ? `${data.market.ttf}€`   : '—',  lbl: 'TTF天然ガス /MWh' },
  { val: data.market?.jkm   ? `$${data.market.jkm}`   : '—',  lbl: 'JKM LNG /MMBtu' },
  { val: `${hormuzFlow}%`,                                      lbl: 'ホルムズ通過量（危機前比）' },
  { val: data.risk_summary?.iea_strategic_release || '—',       lbl: 'IEA緊急備蓄放出量' },
];

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="中東危機によるホルムズ海峡封鎖が各国エネルギー情勢に与える影響のリアルタイム分析">
<title>中東危機 エネルギー情勢モニター by 前川勇</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root {
  --ink:    #0d0d0d;
  --paper:  #f5f0e8;
  --white:  #ffffff;
  --accent: #c0392b;
  --accent2:#e67e22;
  --accent3:#2980b9;
  --muted:  #6b6355;
  --border: #c8bfa8;
  --bg-chip:#ede8df;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:'Noto Serif JP',serif;line-height:1.8}

/* ══ HEADER ══════════════════════════════════════ */
.site-header{background:var(--ink);color:var(--paper);padding:3rem 2rem 2.5rem;text-align:center}
.hd-byline{font-family:'Space Mono',monospace;font-size:.65rem;letter-spacing:.25em;color:#888;margin-bottom:.5rem}
.hd-label{font-family:'Space Mono',monospace;font-size:.68rem;letter-spacing:.18em;color:var(--accent);text-transform:uppercase;margin-bottom:1.2rem}
.hd-title{font-size:clamp(1.6rem,4vw,2.6rem);font-weight:700;line-height:1.35;margin-bottom:.6rem;letter-spacing:-.01em}
.hd-meta{font-family:'Space Mono',monospace;font-size:.62rem;color:#777;margin-bottom:1.4rem;line-height:2}
.hd-alert-btn{display:inline-flex;align-items:center;gap:.5rem;background:var(--accent);color:#fff;
  font-family:'Space Mono',monospace;font-size:.65rem;letter-spacing:.12em;padding:.5rem 1.2rem;
  border:none;cursor:default}
.hd-alert-btn span{font-size:.9rem}

/* ══ STATS BAR ═══════════════════════════════════ */
.stats-bar{background:#1a1a1a;border-bottom:1px solid #333;
  display:grid;grid-template-columns:repeat(6,1fr);text-align:center;padding:.8rem 0}
.stat-item{padding:.4rem 1rem;border-right:1px solid #333}
.stat-item:last-child{border-right:none}
.stat-val{font-family:'Space Mono',monospace;font-size:1.1rem;font-weight:700;color:var(--accent);
  display:block;line-height:1.2}
.stat-lbl{font-family:'Space Mono',monospace;font-size:.58rem;color:#666;margin-top:.2rem;
  display:block;letter-spacing:.03em}

/* ══ HORMUZ BAR ══════════════════════════════════ */
.hormuz-bar{background:${hormuzColor}18;border-bottom:3px solid ${hormuzColor};
  padding:.7rem 2rem;display:flex;align-items:center;flex-wrap:wrap;gap:.8rem}
.hz-label{font-family:'Space Mono',monospace;font-size:.65rem;letter-spacing:.1em;color:var(--muted)}
.hz-status{font-family:'Space Mono',monospace;font-size:.75rem;font-weight:700;color:${hormuzColor}}
.hz-detail{font-family:'Space Mono',monospace;font-size:.58rem;color:var(--muted);flex:1;text-align:right}
.hz-flow-wrap{display:flex;align-items:center;gap:.5rem;font-family:'Space Mono',monospace;font-size:.6rem;color:var(--muted)}
.hz-bar{width:100px;height:5px;background:var(--border);border-radius:2px;overflow:hidden}
.hz-bar-fill{height:100%;border-radius:2px;background:${hormuzColor};width:${hormuzFlow}%}

/* ══ RISK SUMMARY ════════════════════════════════ */
.risk-bar{background:var(--ink);color:var(--paper);padding:.6rem 2rem;
  display:flex;align-items:center;gap:1.2rem;flex-wrap:wrap;
  font-family:'Space Mono',monospace;font-size:.62rem}
.rbar-label{color:#666;letter-spacing:.1em}
.rbar-chip{display:flex;align-items:center;gap:.4rem;background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.15);padding:.2rem .7rem;border-radius:2px}
.rbar-dot{width:7px;height:7px;border-radius:50%}

/* ══ NAV ══════════════════════════════════════════ */
.region-nav{position:sticky;top:0;z-index:100;background:var(--ink);
  display:flex;overflow-x:auto;scrollbar-width:none;border-bottom:2px solid #222}
.region-nav::-webkit-scrollbar{display:none}
.nav-btn{flex-shrink:0;padding:.75rem 1.1rem;font-family:'Space Mono',monospace;
  font-size:.62rem;letter-spacing:.07em;color:#666;background:none;border:none;
  border-bottom:3px solid transparent;cursor:pointer;white-space:nowrap;transition:all .2s;margin-bottom:-2px}
.nav-btn:hover{color:#ccc}
.nav-btn.active{color:var(--accent);border-bottom-color:var(--accent)}

/* ══ MAIN ═════════════════════════════════════════ */
main{max-width:960px;margin:0 auto;padding:2rem 1.5rem 4rem}

/* ══ REGION ═══════════════════════════════════════ */
.region-sec{margin-bottom:3rem;scroll-margin-top:44px}
.region-hdr{display:flex;align-items:center;gap:.8rem;padding:1rem 0 .7rem;
  border-top:2px solid var(--ink);margin-bottom:1rem}
.region-icon{font-size:1.3rem}
.region-title{font-size:1.1rem;font-weight:700;line-height:1.2}
.region-sub{font-family:'Space Mono',monospace;font-size:.58rem;color:var(--muted);letter-spacing:.1em;margin-top:.1rem}

/* ══ COUNTRY CARD ═════════════════════════════════ */
.country-card{border:1px solid var(--border);margin-bottom:1rem;background:var(--white)}
.card-hdr{display:flex;align-items:center;justify-content:space-between;
  padding:.7rem 1.1rem;background:var(--ink);color:var(--paper);cursor:pointer;gap:.6rem}
.card-hdr-left{display:flex;align-items:center;gap:.6rem}
.card-code{font-family:'Space Mono',monospace;font-size:.72rem;color:#666;letter-spacing:.05em}
.card-flag{font-size:1.2rem;line-height:1}
.card-name{font-size:.95rem;font-weight:600}
.card-hdr-right{display:flex;align-items:center;gap:.6rem}
.risk-badge{font-family:'Space Mono',monospace;font-size:.58rem;padding:.25rem .6rem;font-weight:700;flex-shrink:0}
.risk-crit{background:var(--accent);color:#fff}
.risk-high{background:var(--accent2);color:#fff}
.risk-mod{background:var(--accent3);color:#fff}
.risk-low{background:#27ae60;color:#fff}
.card-arrow{font-size:.8rem;color:#666;transition:transform .2s}
.country-card.open .card-arrow{transform:rotate(180deg)}
.card-body{display:none;padding:1.2rem 1.4rem}
.country-card.open .card-body{display:block}

/* ══ METRIC CHIPS ═════════════════════════════════ */
.metric-chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.9rem}
.chip{background:var(--bg-chip);border:1px solid var(--border);
  padding:.4rem .8rem;min-width:90px;display:flex;flex-direction:column;align-items:center}
.chip-alert{background:#fdecea;border-color:#f0aaaa}
.chip-val{font-family:'Space Mono',monospace;font-size:.88rem;font-weight:700;line-height:1.2;color:var(--ink)}
.chip-alert .chip-val{color:var(--accent)}
.chip-lbl{font-family:'Space Mono',monospace;font-size:.55rem;color:var(--muted);margin-top:.15rem;text-align:center;letter-spacing:.03em}

/* ══ RISK METER ═══════════════════════════════════ */
.risk-meter{height:4px;background:var(--border);margin:.3rem 0 .9rem;border-radius:2px;overflow:hidden}
.risk-meter-fill{height:100%;border-radius:2px;transition:width .5s}

/* ══ KEY EVENT ════════════════════════════════════ */
.key-event-row{display:flex;gap:.6rem;align-items:flex-start;
  background:#fdf8f2;border-left:3px solid var(--accent);
  padding:.55rem .85rem;margin-bottom:.7rem}
.ke-icon{flex-shrink:0;font-size:.9rem;margin-top:.1rem}
.ke-text{font-size:.84rem;font-weight:600;line-height:1.5;color:var(--ink)}

/* ══ SUMMARY ══════════════════════════════════════ */
.card-summary{font-size:.84rem;line-height:1.85;color:#333;margin-bottom:.6rem}

/* ══ COLLAPSIBLE SECTION ══════════════════════════ */
.sec-toggle{display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem;
  margin:.4rem 0 0;border-top:1px solid var(--border);cursor:pointer;
  font-family:'Space Mono',monospace;font-size:.66rem;letter-spacing:.04em;color:var(--accent);
  user-select:none;transition:background .15s}
.sec-toggle:hover{background:#fdf8f2}
.sec-arrow{font-size:.65rem;transition:transform .2s;display:inline-block}
.sec-body{display:none;padding:.5rem 0 .3rem .5rem}
.sec-body.open{display:block}

/* ══ BULLET LIST ══════════════════════════════════ */
.bullet-list{list-style:none;display:flex;flex-direction:column;gap:.5rem;margin:.3rem 0}
.bullet-list li{display:flex;gap:.6rem;align-items:flex-start;font-size:.82rem;color:#333;line-height:1.6}
.b-icon{flex-shrink:0;font-size:.82rem;margin-top:.1rem}
.risk-tag{font-family:'Space Mono',monospace;font-size:.55rem;padding:.1rem .45rem;
  border-radius:2px;flex-shrink:0;margin-top:.25rem;font-weight:700;white-space:nowrap}

/* ══ HORIZON TAG ══════════════════════════════════ */
.horizon-tag{font-family:'Space Mono',monospace;font-size:.55rem;padding:.1rem .45rem;
  border-radius:2px;flex-shrink:0;margin-top:.25rem;font-weight:600;white-space:nowrap}
.outlook-li{flex-wrap:wrap;gap:.35rem}
.outlook-li > span:last-child{flex:1;min-width:0}

/* ══ SOURCES ══════════════════════════════════════ */
.card-src{margin-top:.9rem;padding-top:.6rem;border-top:1px solid var(--border);
  font-family:'Space Mono',monospace;font-size:.56rem;color:#aaa;letter-spacing:.03em}

/* ══ FOOTER ═══════════════════════════════════════ */
footer{background:var(--ink);color:#555;padding:1.5rem 2rem;
  font-family:'Space Mono',monospace;font-size:.58rem;text-align:center;line-height:2.2}
footer a{color:#777}

@media(max-width:600px){
  .site-header{padding:2rem 1rem 1.8rem}
  .stats-bar{grid-template-columns:repeat(3,1fr)}
  .stat-item:nth-child(3){border-right:none}
  .hormuz-bar{flex-direction:column;align-items:flex-start;gap:.4rem}
  .hz-detail{text-align:left}
  main{padding:1.5rem 1rem 3rem}
  .metric-chips{gap:.35rem}
  .chip{min-width:80px}
}
</style>
</head>
<body>

<!-- ═══ SITE HEADER ═══ -->
<header class="site-header">
  <div class="hd-byline">生産性カウンセラー® 前川 勇</div>
  <div class="hd-label">エネルギー情勢分析レポート / Independent Research by 前川勇</div>
  <h1 class="hd-title">中東危機 エネルギー情勢モニター<br><span style="font-size:.62rem; color:#aaa; letter-spacing:.1em; font-family:'Space Mono',monospace;">by 前川勇 / AIによる自動分析</span></h1>
  <div class="hd-meta">
    生成日: ${dateStr} ${timeStr} JST<br>
    ベースデータ: IEA Oil Market Report May 2026 · Gas Market Report Q2-2026
  </div>
  ${data.global_alert ? `<button class="hd-alert-btn"><span>▲</span> UNPRECEDENTED SUPPLY DISRUPTION</button>` : ''}
</header>

<div style="background:#fff3cd; color:#856404; padding:0.8rem 1.5rem; text-align:center; font-size:0.82rem; line-height:1.7; border-bottom:2px solid #ffc107;">
⚠️ 本サイトはAI（Claude）が公開情報を自動収集・分析した情報サイトです。<br>
内容の正確性・完全性を保証するものではありません。投資・政策判断の根拠としての使用はお控えください。<br>
情報は毎朝更新されますが、速報性・網羅性に限界があります。重要な判断は必ず一次情報をご確認ください。
</div>

<!-- ═══ STATS BAR ═══ -->
<div class="stats-bar">
${STATS.map(s => `  <div class="stat-item">
    <span class="stat-val">${esc(s.val)}</span>
    <span class="stat-lbl">${esc(s.lbl)}</span>
  </div>`).join('\n')}
</div>

<!-- ═══ HORMUZ BAR ═══ -->
<div class="hormuz-bar">
  <span class="hz-label">🚢 ホルムズ海峡ステータス</span>
  <span class="hz-status">${esc(hormuzStatus)}</span>
  ${hormuzDetail ? `<span class="hz-detail">${esc(hormuzDetail)}</span>` : ''}
  <div class="hz-flow-wrap">
    通過流量 ${hormuzFlow}%
    <div class="hz-bar"><div class="hz-bar-fill"></div></div>
  </div>
</div>

<!-- ═══ RISK SUMMARY BAR ═══ -->
<div class="risk-bar">
  <span class="rbar-label">国別危険度:</span>
  ${riskCounts['最高'] ? `<span class="rbar-chip"><span class="rbar-dot" style="background:#c0392b"></span>最高: ${riskCounts['最高']}カ国</span>` : ''}
  ${riskCounts['高']   ? `<span class="rbar-chip"><span class="rbar-dot" style="background:#e67e22"></span>高: ${riskCounts['高']}カ国</span>` : ''}
  ${riskCounts['中']   ? `<span class="rbar-chip"><span class="rbar-dot" style="background:#2980b9"></span>中: ${riskCounts['中']}カ国</span>` : ''}
  ${riskCounts['低']   ? `<span class="rbar-chip"><span class="rbar-dot" style="background:#27ae60"></span>低: ${riskCounts['低']}カ国</span>` : ''}
  ${data.risk_summary?.iea_strategic_release ? `<span class="rbar-label" style="margin-left:12px">IEA協調放出:</span><span class="rbar-chip">${esc(data.risk_summary.iea_strategic_release)}</span>` : ''}
  <span class="rbar-label" style="margin-left:auto">グローバルリスク指数 <strong style="color:var(--accent);font-size:.8rem">${globalRisk}</strong></span>
</div>

<!-- ═══ REGION NAV ═══ -->
<nav class="region-nav" id="regionNav">
${REGIONS.map((r, i) => `  <button class="nav-btn${i===0?' active':''}" onclick="goRegion('reg-${r.id}',this)">${r.icon} ${r.title}</button>`).join('\n')}
</nav>

<!-- ═══ MAIN CONTENT ═══ -->
<main>
${REGIONS.map(r => regionSection(r)).join('\n')}
</main>

<footer>
  中東危機 エネルギー情勢モニター ／ 生産性カウンセラー® 前川 勇<br>
  本サイトはAI（Claude / Anthropic）が以下の公開情報をもとに自動生成しています<br>
  データ出典: IEA（国際エネルギー機関）・EIA（米エネルギー情報局）・各国政府公表資料・主要報道機関<br>
  © のコンテンツは各発行機関に帰属します。本サイトは非商用の情報提供を目的としています。<br>
  内容の正確性を保証するものではありません。投資・売買・政策判断の根拠としての利用はご遠慮ください。<br>
  お問い合わせ: productivity.counselors.369@gmail.com
</footer>

<script>
function toggleCard(id) {
  const card = document.getElementById(id);
  const opening = !card.classList.contains('open');
  card.classList.toggle('open');
  if (opening) {
    card.querySelectorAll('.sec-body').forEach(b => b.classList.add('open'));
    card.querySelectorAll('.sec-arrow').forEach(a => a.style.transform = 'rotate(90deg)');
  }
}
function toggleSec(id) {
  const body  = document.getElementById('sec-' + id);
  const arrow = document.getElementById('arr-' + id);
  const open  = body.classList.toggle('open');
  arrow.style.transform = open ? 'rotate(90deg)' : '';
}
function goRegion(id, btn) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}
window.addEventListener('scroll', () => {
  const ids  = [${REGIONS.map(r=>`'reg-${r.id}'`).join(',')}];
  const tabs = document.querySelectorAll('.nav-btn');
  let cur = 0;
  ids.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 52) cur = i;
  });
  tabs.forEach((t, i) => t.classList.toggle('active', i === cur));
});
</script>
</body>
</html>`;

const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`✅ index.html 生成完了 (${dateStr} ${timeStr})`);
console.log(`   ホルムズ: ${hormuzStatus} (${hormuzFlow}%)`);
console.log(`   Brent: $${data.market?.brent||'—'} | TTF: ${data.market?.ttf||'—'}€ | JKM: $${data.market?.jkm||'—'}`);
console.log(`   国別リスク: 最高=${riskCounts['最高']||0} 高=${riskCounts['高']||0} 中=${riskCounts['中']||0} 低=${riskCounts['低']||0}`);
