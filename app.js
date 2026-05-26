// IEA World Monitor — UI interactions
// External script (no inline JS needed)

function toggleCard(id) {
  const card = document.getElementById(id);
  if (!card) return;
  const opening = !card.classList.contains('open');
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

window.addEventListener('scroll', function() {
  var sections = document.querySelectorAll('.region-sec');
  var tabs     = document.querySelectorAll('.nav-btn');
  var cur = 0;
  sections.forEach(function(el, i) {
    if (el.getBoundingClientRect().top <= 52) cur = i;
  });
  tabs.forEach(function(t, i) { t.classList.toggle('active', i === cur); });
});
