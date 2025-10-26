// === ЭЛЕМЕНТЫ ===
const gameArea = document.getElementById("gameArea");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const levelEl = document.getElementById("level");
const startBtn = document.getElementById("startBtn");
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");
const hitSound = document.getElementById("hitSound");
const overlay = document.getElementById("overlay");

let score = 0, time = 30, level = 1;
let interval, timer, gameRunning = false;
let playerName = '';
let musicEnabled = false;
let scores = JSON.parse(localStorage.getItem('monsterGameScores')) || [];

// === СТРАШНЫЕ МОНСТРЫ (ПОЛНЫЙ МАССИВ!) ===
const monsters = [
  // ЗОМБИ
  {svg: `<svg viewBox="0 0 100 100"><path d="M15 25 Q50 10 85 25 Q95 45 85 65 Q50 80 15 65 Q5 45 15 25 Z" fill="#4A4A4A"/><circle cx="38" cy="35" r="8" fill="#8B0000"/><circle cx="62" cy="35" r="8" fill="#8B0000"/><circle cx="38" cy="35" r="4" fill="#FF0000"/><circle cx="62" cy="35" r="4" fill="#FF0000"/><path d="M35 55 Q50 65 65 55" stroke="#000" stroke-width="4" fill="none"/><path d="M25 70 L30 80 M35 75 L40 85 M45 80 L50 75 M55 85 L60 80 M65 75 L70 85" stroke="#8B4513" stroke-width="3"/><rect x="20" y="82" rx="5" width="20" height="15" fill="#654321"/><rect x="60" y="82" rx="5" width="20" height="15" fill="#654321"/></svg>`, points:1},
  
  // ДЕМОН
  {svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="35" ry="25" fill="#8B0000"/><circle cx="50" cy="35" r="25" fill="#A52A2A"/><circle cx="38" cy="30" r="7" fill="#FF4500"/><circle cx="62" cy="30" r="7" fill="#FF4500"/><circle cx="38" cy="30" r="3" fill="#000"/><circle cx="62" cy="30" r="3" fill="#000"/><path d="M30 45 L40 55 L50 45 M50 55 L60 45 M70 45" stroke="#FFF" stroke-width="3" fill="none"/><path d="M25 15 Q35 5 45 15" fill="#330000" stroke="#000" stroke-width="2"/><path d="M65 15 Q55 5 45 15" fill="#330000" stroke="#000" stroke-width="2"/><path d="M35 50 Q50 60 65 50" stroke="#000" stroke-width="4" fill="none"/></svg>`, points:1},
  
  // ПРИЗРАК
  {svg: `<svg viewBox="0 0 100 100"><path d="M20 30 Q50 15 80 30 Q90 50 80 70 Q50 85 20 70 Q10 50 20 30 Z" fill="#4169E1"/><circle cx="40" cy="40" r="6" fill="#FF0000"/><circle cx="60" cy="40" r="6" fill="#FF0000"/><circle cx="40" cy="40" r="3" fill="#FFF"/><circle cx="60" cy="40" r="3" fill="#FFF"/><path d="M35 55 Q50 60 65 55" stroke="#FFF" stroke-width="3" fill="none"/><path d="M25 65 L35 75 M45 75 L55 65 M65 75 L75 65" stroke="#FFF" stroke-width="2"/></svg>`, points:1},
  
  // БОНУС
  {svg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="35" ry="25" fill="#FFD700"/><circle cx="50" cy="35" r="25" fill="#FFA500"/><circle cx="38" cy="30" r="7" fill="#FF4500"/><circle cx="62" cy="30" r="7" fill="#FF4500"/><path d="M25 15 Q35 5 45 15" fill="#FF8C00" stroke="#000"/><path d="M65 15 Q55 5 45 15" fill="#FF8C00" stroke="#000"/><text x="50" y="85" font-size="20" text-anchor="middle" fill="#FF0000">STAR</text></svg>`, points:3, bonus:true}
];

// ГИГАНТСКИЙ БОСС
const boss = {
  svg: `<svg viewBox="0 0 160 160"><ellipse cx="80" cy="105" rx="55" ry="40" fill="#2F0000"/><circle cx="80" cy="55" r="40" fill="#660000"/><circle cx="65" cy="48" r="12" fill="#FF0000"/><circle cx="95" cy="48" r="12" fill="#FF0000"/><circle cx="65" cy="48" r="6" fill="#000"/><circle cx="95" cy="48" r="6" fill="#000"/><path d="M55 75 Q80 95 105 75" stroke="#FFF" stroke-width="6" fill="none"/><path d="M60 70 L70 90 L80 70 M90 90 L100 70 M110 90 L120 70" stroke="#FFF" stroke-width="5"/><path d="M50 35 Q60 20 70 35" fill="#1A0000" stroke="#000" stroke-width="3"/><path d="M110 35 Q100 20 90 35" fill="#1A0000" stroke="#000" stroke-width="3"/><rect x="45" y="130" rx="10" width="30" height="25" fill="#8B4513"/><rect x="85" y="130" rx="10" width="30" height="25" fill="#8B4513"/></svg>`,
  points:15
};

// === ФУНКЦИИ ===
function showSection(id) {
  ['menu', 'game', 'scores'].forEach(s => document.getElementById(s).style.display = 'none');
  document.getElementById(id).style.display = 'block';
  if (id === 'scores') renderScores();
}

function toggleMusic() {
  if (!musicEnabled) {
    bgMusic.play().then(() => {
      musicEnabled = true;
      musicBtn.textContent = 'ВЫКЛ МУЗЫКУ';
      musicBtn.classList.replace('btn-warning', 'btn-secondary');
    });
  } else {
    bgMusic.pause();
    musicEnabled = false;
    musicBtn.textContent = 'ВКЛ МУЗЫКУ';
    musicBtn.classList.replace('btn-secondary', 'btn-warning');
  }
}

function createExplosion(x, y) {
  const exp = document.createElement('div');
  exp.className = 'explosion';
  exp.style.left = (x - 60) + 'px';
  exp.style.top = (y - 60) + 'px';
  gameArea.appendChild(exp);
  hitSound.currentTime = 0;
  hitSound.play();
  setTimeout(() => exp.remove(), 800);
}

function showMessage(text) {
  overlay.textContent = text;
  overlay.classList.add('show');
  setTimeout(() => overlay.classList.remove('show'), 2500);
}

function spawnMonster() {
  const monster = document.createElement("div");
  monster.className = "monster";

  // ВЫБОР МОНСТРА
  let m;
  if (level >= 5 && Math.random() < 0.3 && !document.querySelector(".boss")) {
    m = boss;
    monster.classList.add("boss");
  } else {
    m = monsters[Math.floor(Math.random() * monsters.length)];
    if (m.bonus) monster.classList.add("bonus");
  }

  monster.innerHTML = m.svg;
  monster.dataset.points = m.points;

  const size = m === boss ? 160 : 80;
  const maxX = gameArea.clientWidth - size;
  const maxY = gameArea.clientHeight - size;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  monster.style.left = x + "px";
  monster.style.top = y + "px";

  monster.onclick = (e) => {
    score += Number(m.points);
    scoreEl.textContent = score;
    createExplosion(e.clientX - gameArea.offsetLeft, e.clientY - gameArea.offsetTop);
    if (m === boss) showMessage('ПОБЕДИТЕЛЬ МОНСТРОВ!');
    monster.remove();
    checkLevelUp();
  };

  gameArea.appendChild(monster);
  setTimeout(() => monster.remove(), m === boss ? 4000 : 2000 + Math.random() * 1500);
}

function checkLevelUp() {
  const thresholds = {1:8, 2:20, 3:35, 4:55, 5:80};
  if (thresholds[level] && score >= thresholds[level]) {
    level++;
    levelEl.textContent = level;
    showMessage(`УРОВЕНЬ ${level}!`);
    clearInterval(interval);
    interval = setInterval(spawnMonster, Math.max(300, 950 - level * 130));
  }
}

function startGame() {
  if (gameRunning) return;
  playerName = prompt("Имя:", "Герой") || "Герой";
  score = 0; level = 1; time = 30;
  scoreEl.textContent = score; levelEl.textContent = level; timeEl.textContent = time;
  gameArea.innerHTML = '<div id="overlay" class="overlay"></div>';

  gameRunning = true;
  if (musicEnabled) bgMusic.play();
  interval = setInterval(spawnMonster, 950);
  timer = setInterval(() => {
    time--; timeEl.textContent = time;
    if (time <= 0) endGame();
  }, 1000);
}

function endGame() {
  clearInterval(interval); clearInterval(timer); gameRunning = false;
  bgMusic.pause();
  const result = { id: Date.now(), name: playerName, score, level, date: new Date().toLocaleDateString('ru-RU') };
  scores.push(result);
  localStorage.setItem('monsterGameScores', JSON.stringify(scores));
  showMessage(`ИГРА ОКОНЧЕНА!\n${score} ОЧКОВ!`);
  setTimeout(() => showSection('menu'), 3000);
}

// === CRUD ===
function renderScores() {
  const tbody = document.getElementById('scores-body');
  tbody.innerHTML = '';
  scores.sort((a, b) => b.score - a.score).forEach((s, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${s.name}</td><td><strong class="text-warning">${s.score}</strong></td><td>${s.level}</td><td>${s.date}</td>
      <td><button class="btn btn-sm btn-warning" onclick="editScore(${s.id})">Ред</button>
          <button class="btn btn-sm btn-danger" onclick="deleteScore(${s.id})">Удл</button></td>`;
    tbody.appendChild(tr);
  });
}

function editScore(id) {
  const s = scores.find(x => x.id === id);
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-name').value = s.name;
  document.getElementById('edit-score').value = s.score;
  document.getElementById('edit-level').value = s.level;
  new bootstrap.Modal(document.getElementById('editModal')).show();
}

function saveEdit() {
  const id = parseInt(document.getElementById('edit-id').value);
  const s = scores.find(x => x.id === id);
  s.name = document.getElementById('edit-name').value;
  s.score = parseInt(document.getElementById('edit-score').value);
  s.level = parseInt(document.getElementById('edit-level').value);
  localStorage.setItem('monsterGameScores', JSON.stringify(scores));
  renderScores();
  bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
}

function deleteScore(id) {
  if (confirm('Удалить?')) {
    scores = scores.filter(x => x.id !== id);
    localStorage.setItem('monsterGameScores', JSON.stringify(scores));
    renderScores();
  }
}

// === КНОПКИ ===
musicBtn.onclick = toggleMusic;
startBtn.onclick = startGame;"// 3. ���: �������, ᯠ��, �஢��, ����" 
"// 4. ��䥪��: ��몠, ��㪨, ᮮ�饭��" 
