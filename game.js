// game.js
// =============================================
// Game State Management - Enhanced Tools Version
// =============================================

const gameState = {
  // Player State
  player: {
    role: null,
    position: { x: 0, y: 0 },
    stats: {
      cloaking: 1,
      speed: 1,
      stealth: 1
    },
    inventory: [],
    ownedTools: {},
    activeEffects: [],
    coins: 0,
    lives: 3,
    score: 0
  },

  // Level State
  level: {
    current: 1,
    mapSize: 6,
    goalPosition: { x: 2, y: 2 },
    specialTiles: {
      firewalls: [],
      dataNodes: [],
      teleports: [],
      portals: []
    },
    detectionRisk: 0,
    decoys: []
  },

  // Game State
  session: {
    gameActive: false,
    isPaused: false,
    lastStepTime: 0,
    aiMoveInterval: null,
    timers: {},
    touchStart: null
  },

  // AI State
  ai: {
    seekers: [],
    speed: 3000,
    intelligence: 1,
    detectionRange: 3,
    confused: false
  },

  // Settings State
  settings: {
    musicEnabled: true,
    fxEnabled: true
  }
};

// =============================================
// Audio Elements
// =============================================

const sounds = {
  move: document.getElementById("moveSound"),
  coin: document.getElementById("coinSound"),
  win: document.getElementById("winSound"),
  lose: document.getElementById("loseSound"),
  powerup: document.getElementById("powerupSound"),
  teleport: document.getElementById("teleportSound"),
  click: document.getElementById("clickSound"),
  cloak: document.getElementById("cloakSound"),
  decoy: document.getElementById("decoySound"),
  footstep1: document.getElementById("footstep1Sound"),
  footstep2: document.getElementById("footstep2Sound"),
  background: document.getElementById("backgroundMusic")
};

// =============================================
// Enhanced Tool Stats
// =============================================

const toolStats = {
  cloaking: { 
    name: "Cloaking", 
    icon: "🕶️", 
    desc: "Phase through enemies without getting caught", 
    level: 1, 
    duration: 8, 
    costBase: 15, 
    costInc: 8,
    cooldown: 25,
    owned: false,
    power: "Phase through enemies"
  },
  decoy: { 
    name: "Decoy", 
    icon: "👤", 
    desc: "Plant fake hiders to confuse enemies", 
    level: 1, 
    duration: 12, 
    costBase: 15, 
    costInc: 8,
    cooldown: 30,
    owned: false,
    power: "Creates 1 fake hider",
    decoyCount: 1
  },
  torTrail: { 
    name: "Tor Trail", 
    icon: "🌀", 
    desc: "Allows diagonal movement for a short time", 
    level: 1, 
    moves: 1, 
    costBase: 20, 
    costInc: 10,
    duration: 8,
    cooldown: 35,
    owned: false,
    power: "Diagonal moves"
  },
  vpn: { 
    name: "VPN", 
    icon: "🛡️", 
    desc: "Jump over multiple tiles", 
    level: 1, 
    jumpDistance: 1, 
    costBase: 12, 
    costInc: 6,
    duration: 8,
    cooldown: 20,
    owned: false,
    power: "Jump 1 tile"
  },
  ccCleaner: { 
    name: "CC Cleaner", 
    icon: "🧯", 
    desc: "Teleport all enemies to random locations", 
    level: 1, 
    power: 1, 
    costBase: 25, 
    costInc: 12,
    cooldown: 25,
    owned: false,
    power: "Teleport enemies"
  },
  usb: {
    name: "Bootable USB",
    icon: "🔌",
    desc: "Instantly teleport to a safe location",
    costBase: 15,
    costInc: 5,
    cooldown: 30,
    owned: false,
    power: "Teleport 1 tile",
    teleportDistance: 1
  }
};

// =============================================
// Enemies and Detection Methods
// =============================================

const enemyList = [
  "Chainalys", "Elliptic", "Cypher Trace", "Nansen", "Arkam Intelligence",
  "AnchainAI", "BlockSeer", "Blockchair", "Breadcrumbs", "Whale Alert",
  "PeckShield", "The Graph", "Dune Analytics", "Glassnode"
];

const detectionMethods = [
  "Cluster Analysis – Links addresses to real identities.",
  "Transaction Graph Tracking – Follows funds across wallets.",
  "Heuristics – Identifies mixers and darknet activity.",
  "Exchange & KYC Leaks – Correlates leaks with blockchain."
];

// =============================================
// DOM Elements
// =============================================

const mapContainer = document.getElementById("map-container");
const logBox = document.getElementById("log");

// =============================================
// Event System
// =============================================

const events = {
  listeners: {},
  
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
};

// =============================================
// Core Game Functions
// =============================================

function initGame() {
  // Load saved settings
  const savedSettings = localStorage.getItem('gameSettings');
  if (savedSettings) {
    gameState.settings = JSON.parse(savedSettings);
  }
  
  initEventListeners();
  
  // Initialize displays
  updateScoreDisplay(0);
  updateLevelDisplay(1);
  updateCoinsDisplay(0);
  updateLivesDisplay(3);
  
  // Add keyboard event listeners
  document.addEventListener('keydown', handleKeyPress);
  
  // Add click sound to all buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => playSound('click'));
  });

  // Initialize music toggle
  document.getElementById("musicToggle").addEventListener('click', toggleMusic);
  
  // Initialize settings toggles
  document.getElementById("musicToggleSetting").addEventListener('change', function() {
    gameState.settings.musicEnabled = this.checked;
    toggleMusic();
  });
  
  document.getElementById("fxToggleSetting").addEventListener('change', function() {
    gameState.settings.fxEnabled = this.checked;
    updateSettingsStatus();
  });
  
  if (gameState.settings.musicEnabled) {
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
    sounds.background.play();
  }
  
  // Add detection meter to UI
  const gameUI = document.getElementById("game-ui");
  if (gameUI) {
    const meter = document.createElement('div');
    meter.className = 'detection-meter';
    meter.innerHTML = '<div class="detection-level"></div>';
    gameUI.appendChild(meter);
  }

  // Improved touch event handling
  document.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });
}

function handleTouchStart(e) {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;
  
  // Prevent default to stop page scrolling/reloading
  e.preventDefault();
  
  const touch = e.touches[0];
  gameState.session.touchStart = {
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  };
}

function handleTouchMove(e) {
  if (!gameState.session.touchStart) return;
  e.preventDefault(); // Prevent page scrolling
}

function handleTouchEnd(e) {
  if (!gameState.session.gameActive || gameState.session.isPaused || !gameState.session.touchStart) return;
  
  e.preventDefault();
  
  const touch = e.changedTouches[0];
  const endX = touch.clientX;
  const endY = touch.clientY;
  const startX = gameState.session.touchStart.x;
  const startY = gameState.session.touchStart.y;
  
  const dx = endX - startX;
  const dy = endY - startY;
  
  // Only register swipe if movement is significant and fast enough
  const dist = Math.sqrt(dx * dx + dy * dy);
  const time = Date.now() - gameState.session.touchStart.time;
  
  if (dist > 30 && time < 300) { // Minimum 30px movement in under 300ms
    const { x, y } = gameState.player.position;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0) {
        // Right swipe
        if (x < gameState.level.mapSize - 1) movePlayer(x + 1, y);
      } else {
        // Left swipe
        if (x > 0) movePlayer(x - 1, y);
      }
    } else {
      // Vertical swipe
      if (dy > 0) {
        // Down swipe
        if (y < gameState.level.mapSize - 1) movePlayer(x, y + 1);
      } else {
        // Up swipe
        if (y > 0) movePlayer(x, y - 1);
      }
    }
  }
  
  gameState.session.touchStart = null;
}

function initEventListeners() {
  events.on('player-moved', (position) => {
    updateDetectionMeter();
    checkTileEffects(position.x, position.y);
  });

  events.on('ai-move', () => {
    updateDetectionMeter();
    checkCaught();
    updatePortals();
  });

  events.on('cloak-used', () => {
    createParticles(gameState.player.position, 15, 'var(--primary)');
    gameState.level.detectionRisk = 0;
    updateDetectionMeter();
  });

  events.on('decoy-used', () => {
    createParticles(gameState.player.position, 25, 'var(--secondary)');
  });
}

function playSound(soundName, volume = 0.7) {
  if (!gameState.settings.fxEnabled && soundName !== 'background') return;
  if (sounds[soundName]) {
    sounds[soundName].volume = volume;
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(e => console.log("Audio play failed:", e));
  }
}

function toggleMusic() {
  gameState.settings.musicEnabled = !gameState.settings.musicEnabled;
  if (gameState.settings.musicEnabled) {
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
    sounds.background.play();
    document.getElementById("musicToggle").innerHTML = '<span class="glow-text">🔊 AUDIO: ACTIVE</span>';
  } else {
    sounds.background.pause();
    document.getElementById("musicToggle").innerHTML = '<span class="glow-text">🔇 AUDIO: MUTED</span>';
  }
  updateSettingsStatus();
}

function saveSettings() {
  localStorage.setItem('gameSettings', JSON.stringify(gameState.settings));
}

function showSettingsModal() {
  document.getElementById("settingsModal").style.display = "flex";
  document.getElementById("musicToggleSetting").checked = gameState.settings.musicEnabled;
  document.getElementById("fxToggleSetting").checked = gameState.settings.fxEnabled;
  updateSettingsStatus();
  playSound('click');
}

function closeSettingsModal() {
  saveSettings();
  document.getElementById("settingsModal").style.display = "none";
  playSound('click');
}

function updateSettingsStatus() {
  document.getElementById("musicStatus").textContent = gameState.settings.musicEnabled ? "ON" : "OFF";
  document.getElementById("fxStatus").textContent = gameState.settings.fxEnabled ? "ON" : "OFF";
}

function showAboutModal() {
  document.getElementById("aboutModal").style.display = "flex";
  playSound('click');
}

function closeAboutModal() {
  document.getElementById("aboutModal").style.display = "none";
  playSound('click');
}

// =============================================
// Game Logic Functions
// =============================================

function handleKeyPress(e) {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;
  
  const { x, y } = gameState.player.position;
  
  switch(e.key) {
    case 'ArrowUp':
      if (y > 0) movePlayer(x, y - 1);
      break;
    case 'ArrowDown':
      if (y < gameState.level.mapSize - 1) movePlayer(x, y + 1);
      break;
    case 'ArrowLeft':
      if (x > 0) movePlayer(x - 1, y);
      break;
    case 'ArrowRight':
      if (x < gameState.level.mapSize - 1) movePlayer(x + 1, y);
      break;
    case ' ':
      if (gameState.player.ownedTools.cloaking) useCloaking();
      break;
    case 'd':
      if (gameState.player.ownedTools.decoy) plantDecoyData();
      break;
    case 'j': // Added jump key binding
      if (gameState.player.ownedTools.vpn) useVPN();
      break;
    case 'm':
      openPrivacyToolsMarket();
      break;
    case 'p':
      togglePause();
      break;
    case 'Escape':
      togglePause();
      break;
  }
}

function togglePause() {
  gameState.session.isPaused = !gameState.session.isPaused;
  
  if (gameState.session.isPaused) {
    clearInterval(gameState.session.aiMoveInterval);
    document.getElementById("pauseModal").style.display = "flex";
    logAction("⏸️ Game paused");
    sounds.background.pause();
  } else {
    gameState.session.aiMoveInterval = setInterval(moveSeekerAI, gameState.ai.speed);
    document.getElementById("pauseModal").style.display = "none";
    logAction("▶️ Game resumed");
    if (gameState.settings.musicEnabled) sounds.background.play();
  }
}

function returnToMainMenu() {
  closeModals();
  gameState.session.gameActive = false;
  clearInterval(gameState.session.aiMoveInterval);
  document.getElementById("game-ui").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
  gameState.session.isPaused = false;
  sounds.background.pause();
}

function newGame() {
  // Reset all game state
  gameState.player = {
    role: 'hider',
    position: { x: 0, y: 0 },
    stats: { cloaking: 1, speed: 1, stealth: 1 },
    inventory: [],
    ownedTools: {},
    activeEffects: [],
    coins: 0,
    lives: 3,
    score: 0
  };
  
  gameState.level = {
    current: 1,
    mapSize: 6,
    goalPosition: { x: 2, y: 2 },
    specialTiles: { firewalls: [], dataNodes: [], teleports: [], portals: [] },
    detectionRisk: 0,
    decoys: []
  };
  
  // Reset tool ownership
  Object.keys(toolStats).forEach(tool => {
    toolStats[tool].owned = false;
  });
  
  // Update displays
  updateScoreDisplay(0);
  updateLevelDisplay(1);
  updateCoinsDisplay(0);
  updateLivesDisplay(3);
  
  // Clear inventory
  document.getElementById("inventory").innerHTML = '';
  document.getElementById("desktop-inventory").innerHTML = '';
  
  // Close modals and start fresh
  closeModals();
  resetGame();
  if (gameState.settings.musicEnabled) sounds.background.play();
}

function buyLifeInGameOver() {
  const cost = 30;
  if (gameState.player.coins >= cost) {
    gameState.player.coins -= cost;
    gameState.player.lives++;
    updateCoinsDisplay(gameState.player.coins);
    updateLivesDisplay(gameState.player.lives);
    logAction("❤️ Bought extra life!");
    playSound('powerup');
    closeModals();
    resetGame();
  } else {
    logAction("🪙 Not enough coins to buy extra life!");
    playSound('click');
  }
}

function addLife() {
  gameState.player.lives++;
  updateLivesDisplay(gameState.player.lives);
  logAction("❤️ Gained an extra life!");
  playSound('powerup');
}

function startGame(role) {
  gameState.player.role = role;
  gameState.session.gameActive = true;
  gameState.player.lives = 3;
  gameState.level.current = 1;
  gameState.level.mapSize = 6;
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-ui").style.display = "flex";

  resetGame();
  initInventory();
  if (gameState.settings.musicEnabled) sounds.background.play();
}

// =============================================
// Display Update Functions
// =============================================

function updateScoreDisplay(newScore) {
  gameState.player.score = newScore;
  const scoreValue = document.getElementById("scoreValue");
  if (scoreValue) scoreValue.textContent = newScore;
}

function updateLevelDisplay(newLevel) {
  gameState.level.current = newLevel;
  const levelValue = document.getElementById("levelValue");
  if (levelValue) levelValue.textContent = newLevel;
}

function updateCoinsDisplay(amount) {
  gameState.player.coins = amount;
  const coinValue = document.getElementById("coinValue");
  if (coinValue) coinValue.textContent = amount;
}

function updateLivesDisplay(lives) {
  gameState.player.lives = lives;
  const livesValue = document.getElementById("livesValue");
  if (livesValue) livesValue.textContent = lives;
}

// =============================================
// Enhanced Movement System
// =============================================

function movePlayer(x, y) {
  if (gameState.player.role !== "hider" || !gameState.session.gameActive || gameState.session.isPaused) return;

  // Check if target position is a firewall
  const isFirewall = gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y);
  if (isFirewall) {
    logAction("🚧 Firewall blocked your path!");
    playSound('click');
    return;
  }

  const dx = Math.abs(x - gameState.player.position.x);
  const dy = Math.abs(y - gameState.player.position.y);

  // Check movement rules based on active effects
  const canMoveDiagonally = gameState.player.activeEffects.some(effect => effect.name === '🌀 Tor Trail');
  const vpnEffect = gameState.player.activeEffects.find(effect => effect.name === '🛡️ VPN');
  const isVPNJump = vpnEffect && (dx === vpnEffect.jumpDistance || dy === vpnEffect.jumpDistance);

  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1) || 
      (canMoveDiagonally && dx === 1 && dy === 1) ||
      isVPNJump) {
    
    // Check if moving through enemy with cloak
    const seekerAtTarget = gameState.ai.seekers.some(s => s.x === x && s.y === y);
    if (seekerAtTarget && !gameState.player.activeEffects.some(effect => effect.name === '🕶️ Cloaking')) {
      logAction("⚠️ Can't move through enemies without cloak!");
      playSound('click');
      return;
    }

    // Play movement sound
    playSound(Math.random() > 0.5 ? 'footstep1' : 'footstep2', 0.3);
    gameState.session.lastStepTime = Date.now();

    // Animate movement
    animateMovement(x, y);
  } else {
    logAction("⚠️ Can't move there.");
    playSound('click');
  }
}

function animateMovement(x, y) {
  const oldTile = document.querySelector(`.tile[data-x="${gameState.player.position.x}"][data-y="${gameState.player.position.y}"]`);
  const newTile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
  
  if (oldTile && newTile) {
    oldTile.classList.remove("hider");
    oldTile.classList.add("move-from");
    newTile.classList.add("move-to");
    
    setTimeout(() => {
      oldTile.classList.remove("move-from");
      newTile.classList.remove("move-to");
      gameState.player.position = { x, y };
      events.emit('player-moved', { x, y });
      createMap();
    }, 150);
  } else {
    gameState.player.position = { x, y };
    events.emit('player-moved', { x, y });
    createMap();
  }
}

// =============================================
// Map and Tile Functions
// =============================================

function generateSpecialTiles() {
  gameState.level.specialTiles = {
    firewalls: [],
    dataNodes: [],
    teleports: [],
    portals: []
  };

  const mapArea = gameState.level.mapSize * gameState.level.mapSize;
  
  // Generate firewalls (10-15% of map)
  const firewallCount = Math.min(5, Math.floor(mapArea * (0.1 + Math.random() * 0.05)));
  for (let i = 0; i < firewallCount; i++) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      x = Math.floor(Math.random() * gameState.level.mapSize);
      y = Math.floor(Math.random() * gameState.level.mapSize);
      attempts++;
      
      if (attempts >= maxAttempts) break;
    } while (
      (x === gameState.player.position.x && y === gameState.player.position.y) ||
      (x === gameState.level.goalPosition.x && y === gameState.level.goalPosition.y) ||
      gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y) ||
      gameState.ai.seekers.some(s => s.x === x && s.y === y)
    );
    
    if (attempts < maxAttempts) {
      gameState.level.specialTiles.firewalls.push({ x, y });
    }
  }

  // Generate data nodes (5-8% of map)
  const dataNodeCount = Math.min(3, Math.floor(mapArea * (0.05 + Math.random() * 0.03)));
  for (let i = 0; i < dataNodeCount; i++) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      x = Math.floor(Math.random() * gameState.level.mapSize);
      y = Math.floor(Math.random() * gameState.level.mapSize);
      attempts++;
      
      if (attempts >= maxAttempts) break;
    } while (
      (x === gameState.player.position.x && y === gameState.player.position.y) ||
      (x === gameState.level.goalPosition.x && y === gameState.level.goalPosition.y) ||
      gameState.level.specialTiles.dataNodes.some(t => t.x === x && t.y === y) ||
      gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y) ||
      gameState.ai.seekers.some(s => s.x === x && s.y === y)
    );
    
    if (attempts < maxAttempts) {
      gameState.level.specialTiles.dataNodes.push({ x, y });
    }
  }

  // Generate teleport pairs (1-2 pairs)
  const teleportPairCount = 1 + Math.floor(Math.random() * 1);
  for (let i = 0; i < teleportPairCount; i++) {
    // First teleport pad
    let x1, y1;
    let attempts1 = 0;
    const maxAttempts = 50;
    
    do {
      x1 = Math.floor(Math.random() * gameState.level.mapSize);
      y1 = Math.floor(Math.random() * gameState.level.mapSize);
      attempts1++;
      
      if (attempts1 >= maxAttempts) break;
    } while (
      (x1 === gameState.player.position.x && y1 === gameState.player.position.y) ||
      (x1 === gameState.level.goalPosition.x && y1 === gameState.level.goalPosition.y) ||
      gameState.level.specialTiles.teleports.some(t => t.x === x1 && t.y === y1) ||
      gameState.level.specialTiles.firewalls.some(t => t.x === x1 && t.y === y1) ||
      gameState.level.specialTiles.dataNodes.some(t => t.x === x1 && t.y === y1) ||
      gameState.ai.seekers.some(s => s.x === x1 && s.y === y1)
    );

    // Second teleport pad
    let x2, y2;
    let attempts2 = 0;
    
    do {
      x2 = Math.floor(Math.random() * gameState.level.mapSize);
      y2 = Math.floor(Math.random() * gameState.level.mapSize);
      attempts2++;
      
      if (attempts2 >= maxAttempts) break;
    } while (
      (x2 === gameState.player.position.x && y2 === gameState.player.position.y) ||
      (x2 === gameState.level.goalPosition.x && y2 === gameState.level.goalPosition.y) ||
      (x2 === x1 && y2 === y1) ||
      gameState.level.specialTiles.teleports.some(t => t.x === x2 && t.y === y2) ||
      gameState.level.specialTiles.firewalls.some(t => t.x === x2 && t.y === y2) ||
      gameState.level.specialTiles.dataNodes.some(t => t.x === x2 && t.y === y2) ||
      gameState.ai.seekers.some(s => s.x === x2 && s.y === y2) ||
      calculateDistance({x: x1, y: y1}, {x: x2, y: y2}) < 3
    );

    if (attempts1 < maxAttempts && attempts2 < maxAttempts) {
      gameState.level.specialTiles.teleports.push(
        { x: x1, y: y1, pair: i },
        { x: x2, y: y2, pair: i }
      );
    }
  }
}

function updatePortals() {
  // Clear existing portals
  gameState.level.specialTiles.portals = [];
  
  // Add portals near seekers (25% chance per seeker)
  gameState.ai.seekers.forEach(seeker => {
    if (Math.random() < 0.25) {
      const directions = [
        {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}
      ];
      
      const validDirections = directions.filter(dir => {
        const x = seeker.x + dir.x;
        const y = seeker.y + dir.y;
        return x >= 0 && x < gameState.level.mapSize && 
               y >= 0 && y < gameState.level.mapSize &&
               !gameState.level.specialTiles.firewalls.some(f => f.x === x && f.y === y) &&
               !gameState.level.specialTiles.teleports.some(t => t.x === x && t.y === y) &&
               !gameState.level.specialTiles.dataNodes.some(d => d.x === x && d.y === y) &&
               !(gameState.player.position.x === x && gameState.player.position.y === y) &&
               !(gameState.level.goalPosition.x === x && gameState.level.goalPosition.y === y) &&
               !gameState.ai.seekers.some(s => s.x === x && s.y === y) &&
               !gameState.level.specialTiles.portals.some(p => p.x === x && p.y === y)
      });
      
      if (validDirections.length > 0) {
        const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
        const x = seeker.x + dir.x;
        const y = seeker.y + dir.y;
        
        gameState.level.specialTiles.portals.push({
          x, y,
          expires: Date.now() + 5000
        });
      }
    }
  });
  
  // Remove expired portals
  const now = Date.now();
  gameState.level.specialTiles.portals = gameState.level.specialTiles.portals.filter(
    portal => portal.expires > now
  );
}

function checkTileEffects(x, y) {
  // Check for data node collection
  const dataNodeIndex = gameState.level.specialTiles.dataNodes.findIndex(t => t.x === x && t.y === y);
  if (dataNodeIndex !== -1) {
    gameState.player.coins += 5;
    updateCoinsDisplay(gameState.player.coins);
    gameState.level.specialTiles.dataNodes.splice(dataNodeIndex, 1);
    logAction("💾 Collected data node (+5 coins)");
    playSound('coin');
    
    // Add collection effect
    createParticles({x, y}, 10, 'var(--accent-purple)');
  }
  
  // Check for teleport pad
  const teleport = gameState.level.specialTiles.teleports.find(t => t.x === x && t.y === y);
  if (teleport) {
    const destination = gameState.level.specialTiles.teleports.find(
      t => t.pair === teleport.pair && (t.x !== x || t.y !== y)
    );
    if (destination) {
      // Add teleport effect
      createParticles({x, y}, 15, 'var(--secondary)');
      
      gameState.player.position = { x: destination.x, y: destination.y };
      logAction("🌀 Teleported to another pad!");
      playSound('teleport');
      
      // Add arrival effect
      setTimeout(() => {
        createParticles(destination, 15, 'var(--primary)');
      }, 150);
    }
  }
  
  // Check for portal
  const portal = gameState.level.specialTiles.portals.find(t => t.x === x && t.y === y);
  if (portal) {
    // Teleport to random position
    let newX, newY;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      newX = Math.floor(Math.random() * gameState.level.mapSize);
      newY = Math.floor(Math.random() * gameState.level.mapSize);
      attempts++;
      
      if (attempts >= maxAttempts) break;
    } while (
      (newX === x && newY === y) ||
      (newX === gameState.level.goalPosition.x && newY === gameState.level.goalPosition.y) ||
      gameState.level.specialTiles.firewalls.some(t => t.x === newX && t.y === newY) ||
      gameState.ai.seekers.some(s => s.x === newX && s.y === newY)
    );
    
    if (attempts < maxAttempts) {
      // Add teleport effect
      createParticles({x, y}, 15, 'var(--accent-blue)');
      
      gameState.player.position = { x: newX, y: newY };
      logAction("🌀 Portal teleported you!");
      playSound('teleport');
      
      // Add arrival effect
      setTimeout(() => {
        createParticles({x: newX, y: newY}, 15, 'var(--primary)');
      }, 150);
      
      // Remove the portal
      gameState.level.specialTiles.portals = gameState.level.specialTiles.portals.filter(
        p => !(p.x === x && p.y === y)
      );
    }
  }
  
  checkWin();
}

// =============================================
// AI Functions
// =============================================

function moveSeekerAI() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;

  gameState.ai.seekers.forEach(seeker => {
    const dx = seeker.x - gameState.player.position.x;
    const dy = seeker.y - gameState.player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Adjust behavior based on intelligence level
    const intelligenceFactor = gameState.ai.intelligence / 10;
    const makeSmartMove = Math.random() < (0.3 + intelligenceFactor * 0.7);

    if (distance > 0 && makeSmartMove) {
      const possibleMoves = [];
      
      // Check all 4 directions
      if (seeker.x > 0) possibleMoves.push({ x: seeker.x - 1, y: seeker.y });
      if (seeker.x < gameState.level.mapSize - 1) possibleMoves.push({ x: seeker.x + 1, y: seeker.y });
      if (seeker.y > 0) possibleMoves.push({ x: seeker.x, y: seeker.y - 1 });
      if (seeker.y < gameState.level.mapSize - 1) possibleMoves.push({ x: seeker.x, y: seeker.y + 1 });

      // Filter out invalid moves
      const validMoves = possibleMoves.filter(move => 
        !gameState.level.specialTiles.firewalls.some(fw => fw.x === move.x && fw.y === move.y) &&
        !gameState.level.specialTiles.dataNodes.some(dn => dn.x === move.x && dn.y === move.y) &&
        !gameState.level.specialTiles.teleports.some(tp => tp.x === move.x && tp.y === move.y) &&
        !gameState.level.specialTiles.portals.some(p => p.x === move.x && p.y === move.y)
      );

      if (validMoves.length > 0) {
        // When confused, sometimes target decoys
        if (gameState.ai.confused && gameState.level.decoys.length > 0 && Math.random() < 0.5) {
          const decoy = gameState.level.decoys[Math.floor(Math.random() * gameState.level.decoys.length)];
          const decoyDx = decoy.x - seeker.x;
          const decoyDy = decoy.y - seeker.y;
          
          // Find move that gets closest to decoy
          let bestMove = validMoves[0];
          let bestDistance = calculateDistance(bestMove, decoy);

          validMoves.forEach(move => {
            const currentDistance = calculateDistance(move, decoy);
            if (currentDistance < bestDistance) {
              bestMove = move;
              bestDistance = currentDistance;
            }
          });

          seeker.x = bestMove.x;
          seeker.y = bestMove.y;
        } 
        // Otherwise track player
        else {
          // Find move that gets closest to player
          let bestMove = validMoves[0];
          let bestDistance = calculateDistance(bestMove, gameState.player.position);

          validMoves.forEach(move => {
            const currentDistance = calculateDistance(move, gameState.player.position);
            if (currentDistance < bestDistance) {
              bestMove = move;
              bestDistance = currentDistance;
            }
          });

          // Sometimes make a suboptimal move based on intelligence
          if (Math.random() > intelligenceFactor) {
            seeker.x = validMoves[Math.floor(Math.random() * validMoves.length)].x;
            seeker.y = validMoves[Math.floor(Math.random() * validMoves.length)].y;
          } else {
            seeker.x = bestMove.x;
            seeker.y = bestMove.y;
          }
        }
      }
    } else if (distance > 0) {
      // Random move when not making smart move
      const possibleMoves = [];
      if (seeker.x > 0) possibleMoves.push({ x: seeker.x - 1, y: seeker.y });
      if (seeker.x < gameState.level.mapSize - 1) possibleMoves.push({ x: seeker.x + 1, y: seeker.y });
      if (seeker.y > 0) possibleMoves.push({ x: seeker.x, y: seeker.y - 1 });
      if (seeker.y < gameState.level.mapSize - 1) possibleMoves.push({ x: seeker.x, y: seeker.y + 1 });

      // Filter out invalid moves
      const validMoves = possibleMoves.filter(move => 
        !gameState.level.specialTiles.firewalls.some(fw => fw.x === move.x && fw.y === move.y) &&
        !gameState.level.specialTiles.dataNodes.some(dn => dn.x === move.x && dn.y === move.y) &&
        !gameState.level.specialTiles.teleports.some(tp => tp.x === move.x && tp.y === move.y) &&
        !gameState.level.specialTiles.portals.some(p => p.x === move.x && p.y === move.y)
      );

      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        seeker.x = randomMove.x;
        seeker.y = randomMove.y;
      }
    }
  });

  events.emit('ai-move');
  createMap();
}

function calculateDistance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

// =============================================
// Visual Feedback Functions
// =============================================

function updateDetectionMeter() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;

  let closestDistance = Infinity;
  gameState.ai.seekers.forEach(seeker => {
    const distance = calculateDistance(seeker, gameState.player.position);
    if (distance < closestDistance) closestDistance = distance;
  });

  // Calculate detection risk (0-100)
  const maxDetectionRange = gameState.ai.detectionRange;
  let detectionRisk = 0;
  
  if (closestDistance <= maxDetectionRange) {
    detectionRisk = ((maxDetectionRange - closestDistance) / maxDetectionRange) * 100;
    
    // Reduce risk if cloaked
    if (gameState.player.activeEffects.some(effect => effect.name === '🕶️ Cloaking')) {
      detectionRisk *= 0.3; // 70% reduction when cloaked
    } else {
      detectionRisk *= (1 - (gameState.player.stats.stealth * 0.1));
    }
  }

  gameState.level.detectionRisk = Math.min(100, Math.max(0, detectionRisk));
  
  // Update UI
  const meter = document.querySelector('.detection-level');
  if (meter) {
    meter.style.width = `${detectionRisk}%`;
    
    // Update player visual state
    const playerTile = document.querySelector('.hider');
    if (playerTile) {
      if (detectionRisk > 70) {
        playerTile.classList.add('high-alert');
        playerTile.classList.remove('low-profile');
      } else if (detectionRisk < 30) {
        playerTile.classList.add('low-profile');
        playerTile.classList.remove('high-alert');
      } else {
        playerTile.classList.remove('high-alert', 'low-profile');
      }
    }
  }
}

function createParticles(position, count, color) {
  const tile = document.querySelector(`.tile[data-x="${position.x}"][data-y="${position.y}"]`);
  if (!tile) return;

  const container = document.createElement('div');
  container.className = 'particle-effect';
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.background = color;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    // Random animation
    const angle = Math.random() * Math.PI * 2;
    const distance = 10 + Math.random() * 20;
    const duration = 0.5 + Math.random() * 1;
    
    particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
    particle.style.opacity = '0';
    particle.style.transition = `all ${duration}s ease-out`;
    
    container.appendChild(particle);
    
    // Trigger animation
    setTimeout(() => {
      particle.style.transform = 'translate(0, 0)';
      particle.style.opacity = '0.7';
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, duration * 1000);
  }
  
  tile.appendChild(container);
  setTimeout(() => container.remove(), 1000);
}

// =============================================
// Enhanced Map Rendering
// =============================================

function createMap() {
  mapContainer.innerHTML = '';
  mapContainer.style.gridTemplateColumns = `repeat(${gameState.level.mapSize}, 50px)`;
  
  for (let y = 0; y < gameState.level.mapSize; y++) {
    for (let x = 0; x < gameState.level.mapSize; x++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.x = x;
      tile.dataset.y = y;
      
      // Check for decoys first (so they appear under other elements)
      if (gameState.level.decoys.some(d => d.x === x && d.y === y)) {
        tile.classList.add("decoy");
        tile.textContent = "👤";
      }
      // Then check other special tiles
      else if (gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y)) {
        tile.classList.add("firewall");
        tile.textContent = "🚧";
      } else if (gameState.level.specialTiles.dataNodes.some(t => t.x === x && t.y === y)) {
        tile.classList.add("data-node");
        tile.textContent = "💾";
      } else if (gameState.level.specialTiles.teleports.some(t => t.x === x && t.y === y)) {
        tile.classList.add("teleport");
        tile.textContent = "🌀";
      } else if (gameState.level.specialTiles.portals.some(t => t.x === x && t.y === y)) {
        tile.classList.add("portal");
        tile.textContent = "🌌";
      } else if (x === gameState.player.position.x && y === gameState.player.position.y) {
        tile.classList.add("hider");
        tile.textContent = "💰";
        if (gameState.player.activeEffects.some(effect => effect.name === '🌀 Tor Trail')) {
          tile.classList.add("tor-trail-active");
        }
        if (gameState.player.activeEffects.some(effect => effect.name === '🕶️ Cloaking')) {
          tile.classList.add("cloaking-active");
        }
      } else if (x === gameState.level.goalPosition.x && y === gameState.level.goalPosition.y) {
        tile.classList.add("goal");
        tile.textContent = "🏠";
      } else {
        gameState.ai.seekers.forEach(seeker => {
          if (seeker.x === x && seeker.y === y) {
            tile.classList.add("seeker");
            tile.textContent = "🕵️"
            if (gameState.ai.confused) {
              tile.classList.add("confused");
            }
          }
        });
      }
      
      tile.addEventListener("click", () => movePlayer(x, y));
      mapContainer.appendChild(tile);
    }
  }
}

// =============================================
// Game Progress Functions
// =============================================

function resetGame() {
  closeModals();
  clearInterval(gameState.session.aiMoveInterval);
  
  // Reset player position
  gameState.player.position = { x: 0, y: 0 };
  gameState.session.gameActive = true;
  gameState.session.isPaused = false;
  
  // Fixed 6x6 grid
  gameState.level.mapSize = 6;
  
  // Generate random goal position ensuring it's at least 5 tiles away from player
  do {
    gameState.level.goalPosition = {
      x: Math.floor(Math.random() * gameState.level.mapSize),
      y: Math.floor(Math.random() * gameState.level.mapSize)
    };
  } while (
    (gameState.level.goalPosition.x === gameState.player.position.x && 
     gameState.level.goalPosition.y === gameState.player.position.y) ||
    calculateDistance(gameState.player.position, gameState.level.goalPosition) < 5
  );

  // Generate special tiles
  generateSpecialTiles();

  // Set seekers based on level - progressive difficulty
  let enemyCount;
  if (gameState.level.current < 10) {
    enemyCount = 2;
  } else if (gameState.level.current < 20) {
    enemyCount = 3;
  } else if (gameState.level.current < 30) {
    enemyCount = 4;
  } else if (gameState.level.current < 40) {
    enemyCount = 5;
  } else {
    enemyCount = 6;
  }
  
  // Progressive AI difficulty
  gameState.ai.intelligence = Math.min(10, Math.floor(gameState.level.current / 3) + 1);
  gameState.ai.speed = Math.max(1000, 3000 - (gameState.level.current * 100));
  gameState.ai.detectionRange = Math.min(5, 3 + Math.floor(gameState.level.current / 5));
  
  gameState.ai.seekers = [];
  for (let i = 0; i < enemyCount; i++) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      x = Math.floor(Math.random() * gameState.level.mapSize);
      y = Math.floor(Math.random() * gameState.level.mapSize);
      attempts++;
      
      if (attempts >= maxAttempts) break;
    } while (
      (x === gameState.player.position.x && y === gameState.player.position.y) ||
      (x === gameState.level.goalPosition.x && y === gameState.level.goalPosition.y) ||
      gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y) ||
      calculateDistance({x, y}, gameState.player.position) < 4 ||
      gameState.ai.seekers.some(s => s.x === x && s.y === y) ||
      gameState.level.specialTiles.dataNodes.some(t => t.x === x && t.y === y) ||
      gameState.level.specialTiles.teleports.some(t => t.x === x && t.y === y)
    );
    
    if (attempts < maxAttempts) {
      gameState.ai.seekers.push({ x, y });
    }
  }

  gameState.player.activeEffects = gameState.player.activeEffects.filter(
    effect => effect.permanent
  );

  // Start AI movement with adjusted speed
  gameState.session.aiMoveInterval = setInterval(moveSeekerAI, gameState.ai.speed);
  logAction(`🚀 Level ${gameState.level.current} (6x6): ${enemyCount} enemies at speed ${gameState.ai.speed}ms`);
  createMap();
}

function checkWin() {
  if (gameState.player.position.x === gameState.level.goalPosition.x && 
      gameState.player.position.y === gameState.level.goalPosition.y) {
    const coinsEarned = 10 + Math.floor(gameState.level.current / 2);
    logAction(`🔓 Goal reached! Earned ${coinsEarned} coins.`);
    playSound('win');
    gameState.player.score += 10;
    gameState.player.coins += coinsEarned;
    gameState.level.current += 1;
    
    document.getElementById("coinsEarned").textContent = `+${coinsEarned} coins earned`;
    updateScoreDisplay(gameState.player.score);
    updateLevelDisplay(gameState.level.current);
    updateCoinsDisplay(gameState.player.coins);
    showWinModal();
    
    // Add celebration effect
    createParticles(gameState.level.goalPosition, 30, 'var(--accent-green)');
    
    setTimeout(resetGame, 1000);
  }
}

function checkCaught() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;

  // Don't get caught if on goal tile
  if (gameState.player.position.x === gameState.level.goalPosition.x && 
      gameState.player.position.y === gameState.level.goalPosition.y) {
    return;
  }

  gameState.ai.seekers.forEach(seeker => {
    if (seeker.x === gameState.player.position.x && seeker.y === gameState.player.position.y) {
      // Check if cloaked (30% chance to still get caught when cloaked)
      const isCloaked = gameState.player.activeEffects.some(effect => effect.name === '🕶️ Cloaking');
      if (isCloaked && Math.random() > 0.3) {
        logAction("🕶️ Nearly detected but cloak saved you!");
        playSound('powerup', 0.3);
        return;
      }

      const caughtBy = enemyList[Math.floor(Math.random() * enemyList.length)];
      const method = detectionMethods[Math.floor(Math.random() * detectionMethods.length)];

      document.getElementById("caughtByEnemy").innerText = caughtBy;
      document.getElementById("detectionMethod").innerText = method;
      
      logAction(`🚨 Caught by ${caughtBy} using ${method}`);
      playSound('lose');
      
      // Add caught effect
      createParticles(gameState.player.position, 30, 'var(--accent-red)');
      
      // Decrease lives
      gameState.player.lives--;
      updateLivesDisplay(gameState.player.lives);
      
      if (gameState.player.lives > 0) {
        logAction(`❤️ ${gameState.player.lives} lives remaining!`);
        gameState.player.position = { x: 0, y: 0 };
        
        // Reset seekers with minimum distance
        gameState.ai.seekers = gameState.ai.seekers.map(() => {
          let x, y;
          let attempts = 0;
          const maxAttempts = 50;
          
          do {
            x = Math.floor(Math.random() * gameState.level.mapSize);
            y = Math.floor(Math.random() * gameState.level.mapSize);
            attempts++;
            
            if (attempts >= maxAttempts) break;
          } while (
            (x === gameState.player.position.x && y === gameState.player.position.y) ||
            (x === gameState.level.goalPosition.x && y === gameState.level.goalPosition.y) ||
            gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y) ||
            calculateDistance({x, y}, gameState.player.position) < 4
          );
          
          return { x, y };
        });
        
        createMap();
      } else {
        // No lives left - game over
        gameState.session.gameActive = false;
        clearInterval(gameState.session.aiMoveInterval);
        showLoseModal();
      }
    }
  });
}

// =============================================
// Enhanced Tool Functions
// =============================================

function useCloaking() {
  if (!gameState.session.gameActive || gameState.session.isPaused) {
    logAction("⚠️ Cloaking is on cooldown.");
    playSound('click');
    return;
  }
  
  if (gameState.player.activeEffects.some(effect => effect.name === '🕶️ Cloaking')) {
    logAction("⚠️ Already cloaked!");
    playSound('click');
    return;
  }

  const duration = toolStats.cloaking.duration * gameState.player.stats.cloaking;
  
  gameState.player.activeEffects.push({
    name: '🕶️ Cloaking',
    duration: duration,
    expires: Date.now() + duration * 1000,
    description: `Phase through enemies (${duration}s)`
  });
  
  logAction(`🕶️ Cloaking activated for ${duration} seconds!`);
  playSound('cloak');
  startCooldown('cloaking', toolStats.cloaking.cooldown);
  
  // Visual effect
  const playerTile = document.querySelector(".hider");
  if (playerTile) playerTile.classList.add("cloaking-active");
  
  // Remove effect after duration
  setTimeout(() => {
    gameState.player.activeEffects = gameState.player.activeEffects.filter(
      effect => effect.name !== '🕶️ Cloaking'
    );
    if (playerTile) playerTile.classList.remove("cloaking-active");
    logAction("🕶️ Cloaking expired.");
  }, duration * 1000);
}

function plantDecoyData() {
  if (!gameState.session.gameActive || gameState.session.isPaused) {
    logAction("🛑 Decoy is on cooldown.");
    playSound('click');
    return;
  }

  // Clear existing decoys
  gameState.level.decoys = [];
  
  // Create decoys based on level
  const decoyCount = toolStats.decoy.decoyCount + Math.floor(toolStats.decoy.level / 2);
  const validTiles = [];
  
  // Find all valid tiles for decoys
  for (let y = 0; y < gameState.level.mapSize; y++) {
    for (let x = 0; x < gameState.level.mapSize; x++) {
      if (!(x === gameState.player.position.x && y === gameState.player.position.y) &&
          !gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y) &&
          !gameState.level.specialTiles.dataNodes.some(t => t.x === x && t.y === y) &&
          !gameState.level.specialTiles.teleports.some(t => t.x === x && t.y === y) &&
          !gameState.ai.seekers.some(s => s.x === x && s.y === y)) {
        validTiles.push({x, y});
      }
    }
  }

  // Place decoys randomly
  for (let i = 0; i < Math.min(decoyCount, validTiles.length); i++) {
    const randomIndex = Math.floor(Math.random() * validTiles.length);
    gameState.level.decoys.push(validTiles[randomIndex]);
    validTiles.splice(randomIndex, 1);
  }

  logAction(`👤 Planted ${gameState.level.decoys.length} decoys!`);
  playSound('decoy');
  
  const duration = toolStats.decoy.duration;
  
  gameState.player.activeEffects.push({
    name: '📡 Decoy',
    duration: duration,
    expires: Date.now() + duration * 1000,
    description: `${gameState.level.decoys.length} fake hiders`
  });
  
  gameState.ai.confused = true;
  startCooldown('decoy', toolStats.decoy.cooldown);
  createMap();

  // Remove decoys after duration
  setTimeout(() => {
    gameState.player.activeEffects = gameState.player.activeEffects.filter(
      effect => effect.name !== '📡 Decoy'
    );
    gameState.level.decoys = [];
    gameState.ai.confused = false;
    logAction("👤 Decoys expired.");
    createMap();
  }, duration * 1000);
}

function useTorTrail() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;
  
  if (gameState.player.activeEffects.some(effect => effect.name === '🌀 Tor Trail')) {
    logAction("⚠️ Tor Trail is already active!");
    playSound('click');
    return;
  }

  const duration = toolStats.torTrail.duration;
  
  gameState.player.activeEffects.push({
    name: '🌀 Tor Trail',
    duration: duration,
    expires: Date.now() + duration * 1000,
    description: `Diagonal moves (${duration}s)`
  });
  
  logAction(`🌀 Tor Trail activated for ${duration} seconds!`);
  playSound('powerup');
  startCooldown('torTrail', toolStats.torTrail.cooldown);

  // Visual effect
  const playerTile = document.querySelector(".hider");
  if (playerTile) playerTile.classList.add("tor-trail-active");
  
  // Remove effect after duration
  setTimeout(() => {
    gameState.player.activeEffects = gameState.player.activeEffects.filter(
      effect => effect.name !== '🌀 Tor Trail'
    );
    if (playerTile) playerTile.classList.remove("tor-trail-active");
    logAction("🌀 Tor Trail expired.");
  }, duration * 1000);
}

function useVPN() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;
  
  if (gameState.player.activeEffects.some(effect => effect.name === '🛡️ VPN')) {
    logAction("⚠️ VPN is already active!");
    playSound('click');
    return;
  }

  const jumpDistance = toolStats.vpn.jumpDistance + Math.floor(toolStats.vpn.level / 2);
  const duration = toolStats.vpn.duration;
  
  gameState.player.activeEffects.push({
    name: '🛡️ VPN',
    duration: duration,
    expires: Date.now() + duration * 1000,
    jumpDistance: jumpDistance,
    description: `Jump ${jumpDistance} tiles (${duration}s)`
  });
  
  logAction(`🛡️ VPN activated! Can jump ${jumpDistance} tiles for ${duration}s`);
  playSound('powerup');
  startCooldown('vpn', toolStats.vpn.cooldown);

  // Remove effect after duration
  setTimeout(() => {
    gameState.player.activeEffects = gameState.player.activeEffects.filter(
      effect => effect.name !== '🛡️ VPN'
    );
    logAction("🛡️ VPN expired.");
  }, duration * 1000);
}

function useUSBAdapter() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;

  const distance = toolStats.usb.teleportDistance + Math.floor(toolStats.usb.level / 2);
  const validTiles = [];
  
  // Find all valid teleport locations
  for (let y = 0; y < gameState.level.mapSize; y++) {
    for (let x = 0; x < gameState.level.mapSize; x++) {
      const tileDistance = calculateDistance(gameState.player.position, {x, y});
      if (tileDistance <= distance && 
          !(x === gameState.player.position.x && y === gameState.player.position.y) &&
          !gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y) &&
          !gameState.ai.seekers.some(s => s.x === x && s.y === y)) {
        validTiles.push({x, y});
      }
    }
  }

  if (validTiles.length > 0) {
    const destination = validTiles[Math.floor(Math.random() * validTiles.length)];
    
    // Teleport effects
    createParticles(gameState.player.position, 20, 'var(--accent-blue)');
    setTimeout(() => {
      gameState.player.position = destination;
      createParticles(destination, 20, 'var(--primary)');
      createMap();
    }, 200);
    
    logAction(`🔌 Teleported ${distance} tiles away!`);
    playSound('teleport');
    startCooldown('usb', toolStats.usb.cooldown);
  } else {
    logAction("⚠️ No safe teleport location found!");
    playSound('click');
  }
}

function useCCCleanser() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;

  // Teleport all seekers to random positions
  gameState.ai.seekers = gameState.ai.seekers.map(() => {
    let x, y;
    do {
      x = Math.floor(Math.random() * gameState.level.mapSize);
      y = Math.floor(Math.random() * gameState.level.mapSize);
    } while (gameState.level.specialTiles.firewalls.some(t => t.x === x && t.y === y));
    
    return { x, y };
  });

  logAction("🧯 CC Cleaner teleported all enemies!");
  playSound('powerup');
  startCooldown('ccCleaner', toolStats.ccCleaner.cooldown);
  createMap();
}

// =============================================
// Privacy Tools Market Functions
// =============================================

function openPrivacyToolsMarket() {
  if (!gameState.session.gameActive || gameState.session.isPaused) return;
  
  logAction("🛒 Privacy Tools Market opened.");
  playSound('powerup', 0.3);
  
  const modal = document.getElementById("privacyToolsModal");
  const list = document.getElementById("privacy-tools-list");
  list.innerHTML = '';
  
  Object.values(toolStats).forEach(tool => {
    const div = document.createElement("div");
    div.className = "upgrade-item";
    
    if (tool.owned) {
      // Show upgrade options for owned tools
      div.innerHTML = `
        <strong>${tool.icon} ${tool.name} (Lvl ${tool.level})</strong>
        <span>${tool.desc}</span>
        <div class="upgrade-power">Current: ${tool.power}</div>
        <button class="cyber-button" onclick="upgradeTool('${tool.name}')">
          <span class="glow-text">Upgrade</span>
          <span>${getUpgradeCost(tool)} CREDITS</span>
        </button>
      `;
    } else {
      // Show purchase option for unowned tools
      div.innerHTML = `
        <strong>${tool.icon} ${tool.name}</strong>
        <span>${tool.desc}</span>
        <div class="upgrade-power">${tool.power}</div>
        <button class="cyber-button" onclick="buyTool('${tool.name}')">
          <span class="glow-text">Purchase</span>
          <span>${tool.costBase} CREDITS</span>
        </button>
      `;
    }
    
    list.appendChild(div);
  });
  
  modal.style.display = "flex";
}

function closePrivacyToolsMarket() {
  document.getElementById("privacyToolsModal").style.display = "none";
  playSound('click');
}

function buyTool(toolName) {
  const tool = Object.values(toolStats).find(t => t.name === toolName);
  
  if (gameState.player.coins >= tool.costBase) {
    gameState.player.coins -= tool.costBase;
    tool.owned = true;
    gameState.player.ownedTools[toolName.toLowerCase()] = true;
    
    // Add to inventory with power description
    addToInventory(
      tool.name, 
      tool.desc, 
      getToolUseFunction(toolName),
      tool.icon, 
      tool.power
    );
    
    updateCoinsDisplay(gameState.player.coins);
    logAction(`🛍️ Purchased ${tool.name}!`);
    playSound('coin');
    openPrivacyToolsMarket();
  } else {
    logAction(`🪙 Need ${tool.costBase} coins to buy ${tool.name}.`);
    playSound('click');
  }
}

function getToolUseFunction(toolName) {
  switch(toolName.toLowerCase()) {
    case 'cloaking': return useCloaking;
    case 'decoy': return plantDecoyData;
    case 'tor trail': return useTorTrail;
    case 'vpn': return useVPN;
    case 'cc cleaner': return useCCCleanser;
    case 'bootable usb': return useUSBAdapter;
    default: return () => {};
  }
}

function upgradeTool(toolName) {
  const tool = Object.values(toolStats).find(t => t.name === toolName);
  const cost = getUpgradeCost(tool);

  if (gameState.player.coins >= cost) {
    gameState.player.coins -= cost;
    tool.level++;
    
    // Apply upgrades based on tool type
    if (toolName === 'Cloaking') {
      tool.duration += 2;
      tool.power = `Phase through enemies (${tool.duration}s)`;
    } 
    else if (toolName === 'Decoy') {
      tool.duration += 2;
      tool.decoyCount += 1;
      tool.power = `Creates ${tool.decoyCount} fake hiders`;
    }
    else if (toolName === 'VPN') {
      tool.jumpDistance += 1;
      tool.power = `Jump ${tool.jumpDistance} tiles`;
    }
    else if (toolName === 'Bootable USB') {
      tool.teleportDistance += 1;
      tool.power = `Teleport ${tool.teleportDistance} tiles`;
    }
    else if (toolName === 'Tor Trail') {
      tool.duration += 2;
      tool.power = `Diagonal moves (${tool.duration}s)`;
    }
    
    updateCoinsDisplay(gameState.player.coins);
    logAction(`📈 Upgraded ${tool.name} to Lvl ${tool.level}`);
    playSound('powerup');
    
    // Refresh inventory to show updated powers
    refreshInventory();
    openPrivacyToolsMarket();
  } else {
    logAction(`🪙 Need ${cost} coins to upgrade ${tool.name}.`);
    playSound('click');
  }
}

function getUpgradeCost(tool) {
  return tool.costBase + (tool.level - 1) * tool.costInc;
}

// =============================================
// Enhanced Inventory System
// =============================================

function initInventory() {
  const inv = document.getElementById("inventory");
  const desktopInv = document.getElementById("desktop-inventory");
  if (inv) inv.innerHTML = '';
  if (desktopInv) desktopInv.innerHTML = '';
}

function addToInventory(itemName, description, useFunction, icon = "❓", power = "") {
  // Create inventory item element
  const itemHTML = `
    <div class="inventory-icon">${icon}</div>
    <div class="inventory-name">${itemName}</div>
    <div class="inventory-power">${power}</div>
    <span class="tooltip-inv">${description}</span>
  `;

  // Add to mobile inventory
  const inv = document.getElementById("inventory");
  if (inv) {
    const item = document.createElement("div");
    item.className = "inventory-item";
    item.innerHTML = itemHTML;
    item.onclick = useFunction;
    inv.appendChild(item);
  }

  // Add to desktop inventory
  const desktopInv = document.getElementById("desktop-inventory");
  if (desktopInv) {
    const item = document.createElement("div");
    item.className = "inventory-item";
    item.innerHTML = itemHTML;
    item.onclick = useFunction;
    desktopInv.appendChild(item);
  }

  // Add to game state
  gameState.player.inventory.push({ 
    name: itemName, 
    description, 
    useFunction, 
    icon,
    power 
  });
}

function refreshInventory() {
  initInventory();
  Object.entries(gameState.player.ownedTools).forEach(([name, owned]) => {
    if (owned) {
      const tool = Object.values(toolStats).find(t => t.name.toLowerCase() === name);
      if (tool) {
        addToInventory(
          tool.name,
          tool.desc,
          getToolUseFunction(tool.name),
          tool.icon,
          tool.power
        );
      }
    }
  });
}

// =============================================
// Utility Functions
// =============================================

function startCooldown(ability, duration) {
  const button = Array.from(document.querySelectorAll('.cyber-tool'))
    .find(btn => btn.textContent.includes(toolStats[ability].icon));
  
  if (button) {
    const cooldownElement = document.createElement('div');
    cooldownElement.className = 'cooldown';
    button.appendChild(cooldownElement);
    
    // Animate cooldown
    cooldownElement.style.transition = `transform ${duration}s linear`;
    setTimeout(() => {
      cooldownElement.style.transform = 'scaleX(1)';
    }, 10);
    
    // Remove after cooldown
    setTimeout(() => {
      if (button.contains(cooldownElement)) {
        button.removeChild(cooldownElement);
      }
    }, duration * 1000);
  }
}

function logAction(message) {
  const lines = logBox.innerText.split("\n");
  lines.unshift(message);
  if (lines.length > 2) lines.pop();
  logBox.innerText = lines.join("\n");
}

function showWinModal() {
  document.getElementById("winModal").style.display = "flex";
}

function showLoseModal() {
  document.getElementById("loseModal").style.display = "flex";
}

function closeModals() {
  document.getElementById("winModal").style.display = "none";
  document.getElementById("loseModal").style.display = "none";
  document.getElementById("privacyToolsModal").style.display = "none";
  document.getElementById("pauseModal").style.display = "none";
  document.getElementById("settingsModal").style.display = "none";
  document.getElementById("aboutModal").style.display = "none";
  playSound('click');
}

// Initialize the game when everything is loaded
document.addEventListener('DOMContentLoaded', () => {
  initGame();
});