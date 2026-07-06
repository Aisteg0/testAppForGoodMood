const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || '#1a0a14';
}

// Floating hearts background
const heartsContainer = document.getElementById('hearts');
const heartEmojis = ['💕', '💖', '💗', '❤️', '💘'];

for (let i = 0; i < 12; i++) {
  const heart = document.createElement('span');
  heart.className = 'heart-particle';
  heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
  heart.style.left = `${Math.random() * 100}%`;
  heart.style.animationDuration = `${8 + Math.random() * 12}s`;
  heart.style.animationDelay = `${Math.random() * 10}s`;
  heartsContainer.appendChild(heart);
}

const btnYes = document.getElementById('btnYes');
const btnNo = document.getElementById('btnNo');
const btnAgain = document.getElementById('btnAgain');
const game = document.getElementById('game');
const result = document.getElementById('result');
const subtitle = document.getElementById('subtitle');

const ESCAPE_RADIUS = 120;
const MOVE_SPEED = 1.4;

let pointerX = 0;
let pointerY = 0;
let noX = 0;
let noY = 0;
let animationId = null;

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
  const centerX = window.innerWidth / 2 - width / 2;
  const centerY = window.innerHeight * 0.65;
  placeNoButton(centerX, centerY);
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function escapeFromPointer() {
  const { width, height } = getButtonSize();
  const btnCenterX = noX + width / 2;
  const btnCenterY = noY + height / 2;

  const dist = distance(pointerX, pointerY, btnCenterX, btnCenterY);

  if (dist < ESCAPE_RADIUS) {
    const angle = Math.atan2(btnCenterY - pointerY, btnCenterX - pointerX);
    const force = (ESCAPE_RADIUS - dist) / ESCAPE_RADIUS;
    const moveX = Math.cos(angle) * force * MOVE_SPEED * 18;
    const moveY = Math.sin(angle) * force * MOVE_SPEED * 18;

    placeNoButton(noX + moveX, noY + moveY);
  }
}

function gameLoop() {
  escapeFromPointer();
  animationId = requestAnimationFrame(gameLoop);
}

function updatePointer(e) {
  pointerX = e.clientX ?? e.touches?.[0]?.clientX ?? pointerX;
  pointerY = e.clientY ?? e.touches?.[0]?.clientY ?? pointerY;
}

document.addEventListener('mousemove', updatePointer);
document.addEventListener('touchmove', updatePointer, { passive: true });
document.addEventListener('touchstart', updatePointer, { passive: true });

window.addEventListener('resize', initNoButton);

// Prevent clicking No
btnNo.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (tg) tg.HapticFeedback?.impactOccurred('light');
});

btnNo.addEventListener('mousedown', (e) => e.preventDefault());
btnNo.addEventListener('touchstart', (e) => e.preventDefault());

// Taunt messages when trying to catch No
const taunts = [
  'Нет не получится! 😏',
  'Попробуй ещё...',
  'Упс, промахнулся!',
  'Кнопка «Нет» в отпуске 🏖',
  'Только «Да» работает 💕',
];

let tauntTimer = null;
document.addEventListener('mousemove', () => {
  const { width, height } = getButtonSize();
  const btnCenterX = noX + width / 2;
  const btnCenterY = noY + height / 2;
  const dist = distance(pointerX, pointerY, btnCenterX, btnCenterY);

  if (dist < ESCAPE_RADIUS && !tauntTimer) {
    tauntTimer = setTimeout(() => {
      subtitle.textContent = taunts[Math.floor(Math.random() * taunts.length)];
      tauntTimer = null;
    }, 800);
  }
});

function spawnConfetti() {
  const colors = ['#ff6b9d', '#ff4081', '#ffd700', '#ff69b4', '#fff'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = `${-10 - Math.random() * 20}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

function showResult() {
  if (tg) {
    tg.HapticFeedback?.notificationOccurred('success');
  }
  spawnConfetti();
  game.style.display = 'none';
  result.classList.remove('hidden');
  btnNo.style.display = 'none';
  cancelAnimationFrame(animationId);
}

function resetGame() {
  result.classList.add('hidden');
  game.style.display = 'flex';
  btnNo.style.display = 'block';
  subtitle.textContent = 'Выбери ответ честно!';
  initNoButton();
  animationId = requestAnimationFrame(gameLoop);
}

btnYes.addEventListener('click', showResult);
btnAgain.addEventListener('click', resetGame);

initNoButton();
animationId = requestAnimationFrame(gameLoop);
