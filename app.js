// IEA World Monitor — UI interactions
// External script — CSP compliant (no inline handlers)

function toggleCard(id) {
  var card = document.getElementById(id);
  if (!card) return;
  var opening = !card.classList.contains('open');
  card.classList.toggle('open');
  if (opening) {
    card.querySelectorAll('.sec-body').forEach(function(b) { b.classList.add('open'); });
    card.querySelectorAll('.sec-arrow').forEach(function(a) { a.style.transform = 'rotate(90deg)'; });
  }
}

function toggleSec(id) {
  var body  = document.getElementById('sec-' + id);
  var arrow = document.getElementById('arr-' + id);
  if (!body || !arrow) return;
  var open = body.classList.toggle('open');
  arrow.style.transform = open ? 'rotate(90deg)' : '';
}

function goRegion(id, btn) {
  var el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
}

// Event delegation — replaces all onclick attributes
document.addEventListener('click', function(e) {
  // Card header toggle
  var hdr = e.target.closest('[data-toggle-card]');
  if (hdr) { toggleCard(hdr.getAttribute('data-toggle-card')); return; }

  // Section toggle
  var sec = e.target.closest('[data-toggle-sec]');
  if (sec) { toggleSec(sec.getAttribute('data-toggle-sec')); return; }

  // Region nav button
  var nav = e.target.closest('[data-region]');
  if (nav) { goRegion(nav.getAttribute('data-region'), nav); return; }
});

// Scroll spy for region nav
window.addEventListener('scroll', function() {
  var sections = document.querySelectorAll('.region-sec');
  var tabs     = document.querySelectorAll('.nav-btn');
  var cur = 0;
  sections.forEach(function(el, i) {
    if (el.getBoundingClientRect().top <= 52) cur = i;
  });
  tabs.forEach(function(t, i) { t.classList.toggle('active', i === cur); });
});
