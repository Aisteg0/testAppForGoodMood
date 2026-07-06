const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || '#12121a';
}

// Background particles
const bg = document.getElementById('bgParticles');
const icons = ['😔', '👟', '✨', '💫'];
for (let i = 0; i < 10; i++) {
  const el = document.createElement('span');
  el.className = 'particle';
  el.textContent = icons[Math.floor(Math.random() * icons.length)];
  el.style.left = `${Math.random() * 100}%`;
  el.style.animationDuration = `${10 + Math.random() * 10}s`;
  el.style.animationDelay = `${Math.random() * 8}s`;
  bg.appendChild(el);
}

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const final = document.getElementById('final');
const modal = document.getElementById('modal');
const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const btnOk = document.getElementById('btnOk');
const hint = document.getElementById('hint');

const ESCAPE_RADIUS = 120;
const MOVE_SPEED = 1.4;

let pointerX = 0;
let pointerY = 0;
let noX = 0;
let noY = 0;
let animationId = null;
let escapeActive = false;

function showScreen(screen) {
  [step1, step2, final].forEach((s) => s.classList.remove('active'));
  screen.classList.add('active');
}

function haptic(type) {
  if (!tg?.HapticFeedback) return;
  if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
  else tg.HapticFeedback.impactOccurred('light');
}

// Step 1
step1.querySelectorAll('[data-answer]').forEach((btn) => {
  btn.addEventListener('click', () => {
    haptic('light');
    showScreen(step2);
    startEscape();
  });
});

// Escaping "Нет" button
function getButtonSize() {
  const rect = btnNo.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function placeNoButton(x, y) {
  const { width, height } = getButtonSize();
  const maxX = window.innerWidth - width - 16;
  const maxY = window.innerHeight - height - 16;
  noX = Math.max(16, Math.min(x, maxX));
  noY = Math.max(16, Math.min(y, maxY));
  btnNo.style.left = `${noX}px`;
  btnNo.style.top = `${noY}px`;
}

function initNoButton() {
  const { width, height } = getButtonSize();
  placeNoButton(
    window.innerWidth / 2 - width / 2,
    window.innerHeight * 0.68
  );
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function escapeFromPointer() {
  if (!escapeActive) return;
  const { width, height } = getButtonSize();
  const cx = noX + width / 2;
  const cy = noY + height / 2;
  const dist = distance(pointerX, pointerY, cx, cy);

  if (dist < ESCAPE_RADIUS) {
    const angle = Math.atan2(cy - pointerY, cx - pointerX);
    const force = (ESCAPE_RADIUS - dist) / ESCAPE_RADIUS;
    placeNoButton(
      noX + Math.cos(angle) * force * MOVE_SPEED * 18,
      noY + Math.sin(angle) * force * MOVE_SPEED * 18
    );
  }
}

function gameLoop() {
  escapeFromPointer();
  animationId = requestAnimationFrame(gameLoop);
}

function startEscape() {
  escapeActive = true;
  initNoButton();
  if (!animationId) animationId = requestAnimationFrame(gameLoop);
}

function stopEscape() {
  escapeActive = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function updatePointer(e) {
  pointerX = e.clientX ?? e.touches?.[0]?.clientX ?? pointerX;
  pointerY = e.clientY ?? e.touches?.[0]?.clientY ?? pointerY;
}

document.addEventListener('mousemove', updatePointer);
document.addEventListener('touchmove', updatePointer, { passive: true });
document.addEventListener('touchstart', updatePointer, { passive: true });
window.addEventListener('resize', () => { if (escapeActive) initNoButton(); });

btnNo.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  haptic('light');
});

btnNo.addEventListener('mousedown', (e) => e.preventDefault());
btnNo.addEventListener('touchstart', (e) => e.preventDefault());

const taunts = [
  'Не-а 😏',
  'Упс, мимо!',
  'Нет не поймаешь',
  'Только «Да» работает',
];

let tauntTimer = null;
document.addEventListener('mousemove', () => {
  if (!escapeActive) return;
  const { width, height } = getButtonSize();
  const dist = distance(pointerX, pointerY, noX + width / 2, noY + height / 2);
  if (dist < ESCAPE_RADIUS && !tauntTimer) {
    tauntTimer = setTimeout(() => {
      hint.textContent = taunts[Math.floor(Math.random() * taunts.length)];
      tauntTimer = null;
    }, 600);
  }
});

// Step 2 — Да
btnYes.addEventListener('click', () => {
  haptic('light');
  stopEscape();
  modal.classList.remove('hidden');
});

// Modal — Окей
btnOk.addEventListener('click', () => {
  haptic('success');
  modal.classList.add('hidden');
  showScreen(final);
});
