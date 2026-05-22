/* ═══════════════════════════════════════════
   VOIDEX — ARTIST WEBSITE · JAVASCRIPT
   ═══════════════════════════════════════════ */

'use strict';

// ── CUSTOM CURSOR ──────────────────────────────
const cursor      = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');

let mouseX = 0, mouseY = 0;
let trailX = 0, trailY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

(function animateTrail() {
  trailX += (mouseX - trailX) * 0.12;
  trailY += (mouseY - trailY) * 0.12;
  cursorTrail.style.left = trailX + 'px';
  cursorTrail.style.top  = trailY + 'px';
  requestAnimationFrame(animateTrail);
})();

// ── NOISE CANVAS ───────────────────────────────
(function initNoise() {
  const canvas = document.getElementById('noiseCanvas');
  const ctx    = canvas.getContext('2d');
  let animId;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawNoise() {
    const w = canvas.width, h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data      = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      data[i] = data[i+1] = data[i+2] = v;
      data[i+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    animId = requestAnimationFrame(drawNoise);
  }
  drawNoise();
})();

// ── NAVBAR SCROLL ──────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── NAV MOBILE TOGGLE ──────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ── INTERSECTION OBSERVER (reveal) ────────────
const revealEls = document.querySelectorAll('.reveal-up');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ── COUNTER ANIMATION ──────────────────────────
function animateCounter(el, target, decimals = 0) {
  const duration = 2000;
  const start    = performance.now();

  function update(now) {
    const t       = Math.min((now - start) / duration, 1);
    const ease    = 1 - Math.pow(1 - t, 3);
    const current = (target * ease).toFixed(decimals);
    el.textContent = current;
    if (t < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statNums = document.querySelectorAll('.stat-num');
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const target   = parseFloat(e.target.dataset.target);
      const decimals = target % 1 !== 0 ? 1 : 0;
      animateCounter(e.target, target, decimals);
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(el => statsObserver.observe(el));

// ── WAVEFORM BARS ─────────────────────────────
function buildWaveform(containerId, count = 30) {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    const h = 6 + Math.random() * 20;
    bar.style.height = h + 'px';
    container.appendChild(bar);
  }
}
buildWaveform('wave0', 30);
buildWaveform('wave1', 30);
buildWaveform('wave2', 30);
buildWaveform('wave3', 30);

// ── MUSIC PLAYER ──────────────────────────────
const tracks = [
  { title: 'Eclipse Protocol', artist: 'VOIDEX', duration: 272 },
  { title: 'Obsidian Drift',   artist: 'VOIDEX', duration: 378 },
  { title: 'Signal Void',      artist: 'VOIDEX', duration: 347 },
  { title: 'Phantom Frequency', artist: 'VOIDEX', duration: 422 },
];

let currentTrack  = -1;
let isPlaying     = false;
let playProgress  = 0;
let progressTimer = null;

const miniPlayer    = document.getElementById('miniPlayer');
const playerTitle   = document.getElementById('playerTitle');
const playerArtist  = document.getElementById('playerArtist');
const playPauseBtn  = document.getElementById('playPauseBtn');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const progressFill  = document.getElementById('progressFill');
const playerTime    = document.getElementById('playerTime');

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function setPlaying(trackIndex) {
  // Remove playing class from all cards
  document.querySelectorAll('.track-card').forEach(c => {
    c.classList.remove('playing');
    c.querySelectorAll('.bar').forEach(b => b.classList.remove('active-bar'));
  });

  currentTrack = trackIndex;
  isPlaying    = true;
  playProgress = 0;

  const track = tracks[trackIndex];
  playerTitle.textContent  = track.title;
  playerArtist.textContent = track.artist;

  // Activate card
  const card = document.querySelector(`[data-track="${trackIndex}"]`);
  if (card) {
    card.classList.add('playing');
    card.querySelectorAll('.bar').forEach((b, i) => {
      b.classList.add('active-bar');
      b.style.animationDelay = (i * 0.03) + 's';
    });
  }

  miniPlayer.classList.add('visible');
  playPauseBtn.textContent = '⏸';
  startProgress();
}

function startProgress() {
  clearInterval(progressTimer);
  const duration = tracks[currentTrack].duration;
  progressTimer = setInterval(() => {
    if (!isPlaying) return;
    playProgress = Math.min(playProgress + 1, duration);
    const pct = (playProgress / duration) * 100;
    progressFill.style.width = pct + '%';
    playerTime.textContent   = formatTime(playProgress);
    if (playProgress >= duration) {
      nextTrack();
    }
  }, 1000);
}

function togglePlay() {
  if (currentTrack === -1) { setPlaying(0); return; }
  isPlaying = !isPlaying;
  playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
  if (isPlaying) startProgress();
  else clearInterval(progressTimer);
}

function nextTrack() {
  const next = (currentTrack + 1) % tracks.length;
  setPlaying(next);
}
function prevTrack() {
  const prev = (currentTrack - 1 + tracks.length) % tracks.length;
  setPlaying(prev);
}

playPauseBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextTrack);
prevBtn.addEventListener('click', prevTrack);

// Play buttons on cards
document.querySelectorAll('.play-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const card  = btn.closest('.track-card');
    const index = parseInt(card.dataset.track, 10);
    if (currentTrack === index && isPlaying) {
      togglePlay();
    } else {
      setPlaying(index);
    }
  });
});

// Track card click (not on button)
document.querySelectorAll('.track-card').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('.play-btn')) return;
    const index = parseInt(card.dataset.track, 10);
    if (currentTrack === index && isPlaying) {
      togglePlay();
    } else {
      setPlaying(index);
    }
  });
});

// ── VINYL INTERACTION ─────────────────────────
const vinyl = document.getElementById('vinyl');
vinyl.addEventListener('click', () => {
  if (isPlaying) {
    vinyl.style.animationPlayState = 'paused';
    togglePlay();
  } else {
    vinyl.style.animationPlayState = 'running';
    if (currentTrack === -1) setPlaying(0);
    else togglePlay();
  }
});

// ── CONTACT FORM ──────────────────────────────
const contactForm = document.getElementById('contactForm');
const submitText  = document.getElementById('submitText');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name    = contactForm.querySelector('#name').value.trim();
  const email   = contactForm.querySelector('#email').value.trim();
  const message = contactForm.querySelector('#message').value.trim();

  if (!name || !email || !message) {
    // Shake invalid fields
    [contactForm.querySelector('#name'), contactForm.querySelector('#email'), contactForm.querySelector('#message')]
      .forEach(el => {
        if (!el.value.trim()) {
          el.style.borderColor = '#ff4466';
          el.addEventListener('input', () => el.style.borderColor = '', { once: true });
        }
      });
    return;
  }

  submitText.textContent = 'Sending…';
  const btn = contactForm.querySelector('.form-submit');
  btn.style.pointerEvents = 'none';

  setTimeout(() => {
    submitText.textContent = '✓ Sent!';
    formSuccess.classList.add('show');
    contactForm.reset();
    setTimeout(() => {
      submitText.textContent = 'Send Message ◈';
      btn.style.pointerEvents = '';
      formSuccess.classList.remove('show');
    }, 5000);
  }, 1200);
});

// ── SMOOTH PARALLAX (hero orbs) ───────────────
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      document.querySelector('.orb1').style.transform = `translateY(${y * 0.15}px) scale(1)`;
      document.querySelector('.orb2').style.transform = `translateY(${-y * 0.1}px) scale(1)`;
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

// ── ACTIVE NAV LINK HIGHLIGHT ─────────────────
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinksAll.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + e.target.id
          ? 'var(--neon)'
          : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ── GALLERY PARALLAX ─────────────────────────
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('mousemove', e => {
    const rect = item.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
    item.querySelector('.gallery-placeholder').style.transform =
      `scale(1.05) translate(${x * 0.4}px, ${y * 0.4}px)`;
  });
  item.addEventListener('mouseleave', () => {
    item.querySelector('.gallery-placeholder').style.transform = '';
  });
});

// ── LETTER SCRAMBLE ON LOGO HOVER ────────────
const logo = document.querySelector('.nav-logo');
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#@!%&';
let scrambleId;

logo.addEventListener('mouseenter', () => {
  let iter = 0;
  const original = 'VOIDEX';
  clearInterval(scrambleId);
  scrambleId = setInterval(() => {
    logo.textContent = original.split('').map((ch, i) => {
      if (i < iter) return original[i];
      return letters[Math.floor(Math.random() * letters.length)];
    }).join('');
    if (iter >= original.length) clearInterval(scrambleId);
    iter += 0.5;
  }, 50);
});

// ── INIT MESSAGE ─────────────────────────────
console.log(
  '%cVOIDEX%c\nSound beyond the void.\n%cBuilt with craft.',
  'font-size:2rem;font-weight:bold;color:#b84fff;',
  'font-size:0.85rem;color:#7a2db5;',
  'font-size:0.75rem;color:#555;'
);
