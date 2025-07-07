
// game.js
// Add these new functions at the beginning of the file

// Mobile detection
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Mobile input handling
let mobileInput = null;

function handleMobileInput(direction) {
  mobileInput = direction;
  const { x, y } = gameState.hiderPosition;
  
  switch(direction) {
    case 'up':
      if (y > 0) movePlayer(x, y - 1);
      break;
    case 'down':
      if (y < gameState.mapSize - 1) movePlayer(x, y + 1);
      break;
    case 'left':
      if (x > 0) movePlayer(x - 1, y);
      break;
    case 'right':
      if (x < gameState.mapSize - 1) movePlayer(x + 1, y);
      break;
    case 'jump':
      useCloaking();
      break;
    case 'run':
      plantDecoyData();
      break;
  }
}

function clearMobileInput() {
  mobileInput = null;
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('show');
}

// Update initGame function to handle mobile UI
function initGame() {
  updateScoreDisplay(0);
  updateLevelDisplay(1);
  updateCoinsDisplay(0);
  updateLivesDisplay(3);
  initShop();
  
  // Add keyboard event listeners for desktop
  if (!isMobileDevice()) {
    document.addEventListener('keydown', handleKeyPress);
  } else {
    // Show mobile controls
    document.getElementById('mobile-controls').style.display = 'flex';
  }
  
  // Add click sound to all buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => playSound('click'));
  });

  // Initialize music toggle
  document.getElementById("musicToggle").addEventListener('click', toggleMusic);
  if (gameState.musicEnabled) {
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
    sounds.background.play();
  }
}


// Game State Management
const gameState = {
  currentRole: null,
  mapSize: 5, // Starting size (will increase with levels)
  hiderPosition: { x: 0, y: 0 },
  seekerPositions: [],
  goalPosition: { x: 2, y: 2 },
  score: 0,
  level: 1,
  coins: 0,
  lives: 3,
  inventory: [],
  activeEffects: [],
  cloakingAvailable: true,
  decoyPlanted: false,
  torTrailActive: false,
  aiMoveInterval: null,
  timers: {},
  gameActive: false,
  isPaused: false,
  specialTiles: {
    firewalls: [],
    dataNodes: [],
    teleports: []
  },
  musicEnabled: true,
  lastStepTime: 0
};

// Audio Elements
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

// Tool Stats
const toolStats = {
  cloaking: { 
    name: "Cloaking", 
    icon: "🕶️", 
    desc: "Make yourself invisible to enemies.", 
    level: 1, 
    duration: 8, 
    costBase: 15, 
    costInc: 8,
    cooldown: 25
  },
  decoy: { 
    name: "Decoy", 
    icon: "🧭", 
    desc: "Plant fake data to confuse enemies.", 
    level: 1, 
    duration: 12, 
    costBase: 15, 
    costInc: 8,
    cooldown: 30
  },
  torTrail: { 
    name: "Tor Trail", 
    icon: "🌀", 
    desc: "Allows diagonal movement for a short time.", 
    level: 1, 
    moves: 1, 
    costBase: 20, 
    costInc: 10,
    duration: 8,
    cooldown: 35
  },
  vpn: { 
    name: "VPN", 
    icon: "🛡️", 
    desc: "Short-term invisibility with reduced cooldown.", 
    level: 1, 
    duration: 6, 
    costBase: 12, 
    costInc: 6,
    cooldown: 20
  },
  ccCleaner: { 
    name: "CC Cleaner", 
    icon: "🧯", 
    desc: "Randomly teleports all enemies.", 
    level: 1, 
    power: 1, 
    costBase: 25, 
    costInc: 12,
    cooldown: 25
  }
};

// Shop Items
const shopItems = [
  { 
    name: "Bootable USB", 
    icon: "🔌", 
    desc: "Reveals the goal location for 3 seconds.", 
    cost: 15, 
    action: useUSBAdapter 
  },
  { 
    name: "Tor Trail", 
    icon: "🌀", 
    desc: "Allows diagonal movement for 8 seconds.", 
    cost: 20, 
    action: useTorTrail 
  },
  { 
    name: "CC Cleaner", 
    icon: "🧯", 
    desc: "Randomly teleports all enemies.", 
    cost: 25, 
    action: useCCCleanser 
  },
  { 
    name: "VPN", 
    icon: "🛡️", 
    desc: "6 seconds of invisibility with 20s cooldown.", 
    cost: 12, 
    action: useVPN 
  },
  { 
    name: "Extra Life", 
    icon: "❤️", 
    desc: "Get an additional life.", 
    cost: 30, 
    action: addLife 
  }
];

// Enemies and detection methods
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

// DOM Elements
const mapContainer = document.getElementById("map-container");
const logBox = document.getElementById("log");

// Play sound effect
function playSound(soundName, volume = 0.7) {
  if (sounds[soundName]) {
    sounds[soundName].volume = volume;
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(e => console.log("Audio play failed:", e));
  }
}

// Toggle background music
function toggleMusic() {
  gameState.musicEnabled = !gameState.musicEnabled;
  if (gameState.musicEnabled) {
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
    sounds.background.play();
    document.getElementById("musicToggle").innerHTML = '<span class="glow-text">🔊 AUDIO: ACTIVE</span>';
  } else {
    sounds.background.pause();
    document.getElementById("musicToggle").innerHTML = '<span class="glow-text">🔇 AUDIO: MUTED</span>';
  }
}

// Initialize the game
function initGame() {
  updateScoreDisplay(0);
  updateLevelDisplay(1);
  updateCoinsDisplay(0);
  updateLivesDisplay(3);
  initShop();
  
  // Add keyboard event listeners
  document.addEventListener('keydown', handleKeyPress);
  
  // Add click sound to all buttons
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => playSound('click'));
  });

  // Initialize music toggle
  document.getElementById("musicToggle").addEventListener('click', toggleMusic);
  if (gameState.musicEnabled) {
    sounds.background.loop = true;
    sounds.background.volume = 0.3;
    sounds.background.play();
  }
}

// Generate special tiles for the map
function generateSpecialTiles() {
  gameState.specialTiles = {
    firewalls: [],
    dataNodes: [],
    teleports: []
  };

  const mapArea = gameState.mapSize * gameState.mapSize;
  
  // Generate firewalls (10-20% of map)
  const firewallCount = Math.floor(mapArea * (0.1 + Math.random() * 0.1));
  for (let i = 0; i < firewallCount; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * gameState.mapSize);
      y = Math.floor(Math.random() * gameState.mapSize);
    } while (
      (x === gameState.hiderPosition.x && y === gameState.hiderPosition.y) ||
      (x === gameState.goalPosition.x && y === gameState.goalPosition.y) ||
      gameState.specialTiles.firewalls.some(t => t.x === x && t.y === y)
    );
    gameState.specialTiles.firewalls.push({ x, y });
  }

  // Generate data nodes (5-10% of map)
  const dataNodeCount = Math.floor(mapArea * (0.05 + Math.random() * 0.05));
  for (let i = 0; i < dataNodeCount; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * gameState.mapSize);
      y = Math.floor(Math.random() * gameState.mapSize);
    } while (
      (x === gameState.hiderPosition.x && y === gameState.hiderPosition.y) ||
      (x === gameState.goalPosition.x && y === gameState.goalPosition.y) ||
      gameState.specialTiles.dataNodes.some(t => t.x === x && t.y === y) ||
      gameState.specialTiles.firewalls.some(t => t.x === x && t.y === y)
    );
    gameState.specialTiles.dataNodes.push({ x, y });
  }

  // Generate teleport pairs (1-3 pairs)
  const teleportPairCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < teleportPairCount; i++) {
    // First teleport pad
    let x1, y1;
    do {
      x1 = Math.floor(Math.random() * gameState.mapSize);
      y1 = Math.floor(Math.random() * gameState.mapSize);
    } while (
      (x1 === gameState.hiderPosition.x && y1 === gameState.hiderPosition.y) ||
      (x1 === gameState.goalPosition.x && y1 === gameState.goalPosition.y) ||
      gameState.specialTiles.teleports.some(t => t.x === x1 && t.y === y1) ||
      gameState.specialTiles.firewalls.some(t => t.x === x1 && t.y === y1)
    );

    // Second teleport pad
    let x2, y2;
    do {
      x2 = Math.floor(Math.random() * gameState.mapSize);
      y2 = Math.floor(Math.random() * gameState.mapSize);
    } while (
      (x2 === gameState.hiderPosition.x && y2 === gameState.hiderPosition.y) ||
      (x2 === gameState.goalPosition.x && y2 === gameState.goalPosition.y) ||
      (x2 === x1 && y2 === y1) ||
      gameState.specialTiles.teleports.some(t => t.x === x2 && t.y === y2) ||
      gameState.specialTiles.firewalls.some(t => t.x === x2 && t.y === y2)
    );

    gameState.specialTiles.teleports.push(
      { x: x1, y: y1, pair: i },
      { x: x2, y: y2, pair: i }
    );
  }
}

// Handle keyboard input
function handleKeyPress(e) {
  if (!gameState.gameActive || gameState.isPaused) return;
  
  const { x, y } = gameState.hiderPosition;
  
  switch(e.key) {
    case 'ArrowUp':
      if (y > 0) movePlayer(x, y - 1);
      break;
    case 'ArrowDown':
      if (y < gameState.mapSize - 1) movePlayer(x, y + 1);
      break;
    case 'ArrowLeft':
      if (x > 0) movePlayer(x - 1, y);
      break;
    case 'ArrowRight':
      if (x < gameState.mapSize - 1) movePlayer(x + 1, y);
      break;
    case ' ':
      useCloaking();
      break;
    case 'd':
      plantDecoyData();
      break;
    case 'm':
      enterDarkWebMarket();
      break;
    case 'u':
      openUpgradeMenu();
      break;
    case 'p':
      togglePause();
      break;
    case 'Escape':
      togglePause();
      break;
  }
}

// Toggle pause state
function togglePause() {
  gameState.isPaused = !gameState.isPaused;
  
  if (gameState.isPaused) {
    clearInterval(gameState.aiMoveInterval);
    document.getElementById("pauseModal").style.display = "flex";
    logAction("⏸️ Game paused");
    sounds.background.pause();
  } else {
    // Restart AI movement with current speed
    const aiSpeed = getSeekerSpeed();
    gameState.aiMoveInterval = setInterval(moveSeekerAI, aiSpeed);
    document.getElementById("pauseModal").style.display = "none";
    logAction("▶️ Game resumed");
    if (gameState.musicEnabled) sounds.background.play();
  }
}

// Get seeker speed based on level
function getSeekerSpeed() {
  if (gameState.level <= 9) return 3000; // 3 seconds
  if (gameState.level <= 30) return 2000; // 2 seconds
  return 1000; // 1 second for levels 30+
}

// Return to main menu
function returnToMainMenu() {
  closeModals();
  gameState.gameActive = false;
  clearInterval(gameState.aiMoveInterval);
  document.getElementById("game-ui").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
  gameState.isPaused = false;
  sounds.background.pause();
}

// Start a completely new game
function newGame() {
  // Reset all game state
  gameState.currentRole = 'hider';
  gameState.score = 0;
  gameState.level = 1;
  gameState.coins = 0;
  gameState.lives = 3;
  gameState.inventory = [];
  gameState.activeEffects = [];
  
  // Update displays
  updateScoreDisplay(0);
  updateLevelDisplay(1);
  updateCoinsDisplay(0);
  updateLivesDisplay(3);
  
  // Clear inventory
  document.getElementById("inventory").innerHTML = '';
  
  // Close modals and start fresh
  closeModals();
  resetGame();
  if (gameState.musicEnabled) sounds.background.play();
}

// Buy life in game over modal
function buyLifeInGameOver() {
  const cost = 30;
  if (gameState.coins >= cost) {
    gameState.coins -= cost;
    gameState.lives++;
    updateCoinsDisplay(gameState.coins);
    updateLivesDisplay(gameState.lives);
    logAction("❤️ Bought extra life!");
    playSound('powerup');
    closeModals();
    resetGame();
  } else {
    logAction("🪙 Not enough coins to buy extra life!");
    playSound('click');
  }
}

// Add extra life
function addLife() {
  gameState.lives++;
  updateLivesDisplay(gameState.lives);
  logAction("❤️ Gained an extra life!");
  playSound('powerup');
}

// Start the game with selected role
function startGame(role) {
  gameState.currentRole = role;
  gameState.gameActive = true;
  gameState.lives = 3;
  gameState.level = 1;
  gameState.mapSize = 5; // Reset to starting size
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("game-ui").style.display = "flex";

  resetGame();
  initInventory();
  if (gameState.musicEnabled) sounds.background.play();
}

// Update score display
function updateScoreDisplay(newScore) {
  gameState.score = newScore;
  const scoreValue = document.getElementById("scoreValue");
  if (scoreValue) {
    scoreValue.textContent = newScore;
  }
}

// Update level display
function updateLevelDisplay(newLevel) {
  gameState.level = newLevel;
  const levelValue = document.getElementById("levelValue");
  if (levelValue) {
    levelValue.textContent = newLevel;
  }
}

// Update coins display
function updateCoinsDisplay(amount) {
  gameState.coins = amount;
  const coinValue = document.getElementById("coinValue");
  if (coinValue) {
    coinValue.textContent = amount;
  }
}

// Update lives display
function updateLivesDisplay(lives) {
  gameState.lives = lives;
  const livesValue = document.getElementById("livesValue");
  if (livesValue) {
    livesValue.textContent = lives;
  }
}

// Open upgrade menu
function openUpgradeMenu() {
  if (gameState.isPaused) return;
  const modal = document.getElementById("upgradeModal");
  modal.style.display = "flex";
  const list = document.getElementById("upgrade-list");
  list.innerHTML = '';

  Object.values(toolStats).forEach(tool => {
    const div = document.createElement("div");
    div.className = "upgrade-item";
    div.innerHTML = `
      <strong>${tool.icon} ${tool.name} (Lvl ${tool.level})</strong>
      <span>${tool.desc}</span>
      <button class="cyber-button" onclick="upgradeTool('${tool.name}')">
        <span class="glow-text">Upgrade</span>
        <span>${getUpgradeCost(tool)} CREDITS</span>
      </button>
    `;
    list.appendChild(div);
  });
}

// Calculate upgrade cost
function getUpgradeCost(tool) {
  return tool.costBase + (tool.level - 1) * tool.costInc;
}

// Upgrade a tool
function upgradeTool(toolName) {
  const tool = Object.values(toolStats).find(t => t.name === toolName);
  const cost = getUpgradeCost(tool);

  if (gameState.coins >= cost) {
    gameState.coins -= cost;
    tool.level++;
    if (tool.duration) tool.duration += 2;
    if (tool.moves) tool.moves += 1;
    updateCoinsDisplay(gameState.coins);
    logAction(`📈 Upgraded ${tool.name} to Lvl ${tool.level}`);
    playSound('powerup');
    openUpgradeMenu(); // Refresh modal
  } else {
    logAction(`🪙 Need ${cost} coins to upgrade ${tool.name}.`);
    playSound('click');
  }
}

// Close upgrade menu
function closeUpgradeMenu() {
  document.getElementById("upgradeModal").style.display = "none";
  playSound('click');
}

// Initialize inventory
function initInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = '';
}

// Add item to inventory
function addToInventory(itemName, description, useFunction, icon = "❓") {
  const inv = document.getElementById("inventory");
  const item = document.createElement("div");
  item.className = "inventory-item";
  item.innerHTML = `
    <div class="inventory-icon">${icon}</div>
    <div>${itemName}</div>
    <span class="tooltip-inv">${description}</span>
  `;
  item.onclick = useFunction;
  inv.appendChild(item);
  gameState.inventory.push({ name: itemName, description, useFunction, icon });
}

// Initialize shop
function initShop() {
  const shop = document.getElementById("shop");
  shop.innerHTML = "";

  shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";
    div.innerHTML = `
      <div class="shop-icon">${item.icon}</div>
      <div>${item.name}</div>
      <div>${item.cost} CREDITS</div>
      <span class="tooltip-inv">${item.desc}</span>
    `;
    div.onclick = () => buyItem(item);
    shop.appendChild(div);
  });
}

// Buy item from shop
function buyItem(item) {
  if (gameState.coins < item.cost) {
    logAction(`🪙 Not enough coins to buy ${item.name}`);
    playSound('click');
    return;
  }

  gameState.coins -= item.cost;
  updateCoinsDisplay(gameState.coins);
  if (item.action) {
    addToInventory(item.name, item.desc, item.action, item.icon);
  } else {
    // Directly apply effect if no action specified (like extra life)
    item.action();
  }
  logAction(`🛍️ Bought: ${item.name}`);
  playSound('coin');
}

// Use USB adapter
function useUSBAdapter() {
  if (gameState.isPaused) return;
  logAction("🔌 Bootable USB used! Goal revealed.");
  playSound('powerup', 0.5);
  const goalTile = document.querySelector(".goal");
  if (goalTile) {
    goalTile.classList.add("goal-revealed");
    // Add particle effect
    const particles = document.createElement("div");
    particles.className = "particles";
    goalTile.appendChild(particles);
    setTimeout(() => {
      particles.remove();
    }, 3000);
  }
  setTimeout(() => {
    const goalTile = document.querySelector(".goal");
    if (goalTile) goalTile.classList.remove("goal-revealed");
  }, 3000);
}

// Use Tor Trail
function useTorTrail() {
  if (gameState.isPaused) return;
  if (gameState.torTrailActive) {
    logAction("⚠️ Tor Trail is already active.");
    playSound('click');
    return;
  }

  logAction("🌀 Tor Trail active! Diagonal move unlocked.");
  playSound('powerup', 0.6);
  gameState.torTrailActive = true;
  startCooldown('torTrail', toolStats.torTrail.cooldown);
  addActiveEffect('🌀 Tor Trail', toolStats.torTrail.duration);

  // Add visual effect to player
  const playerTile = document.querySelector(".hider");
  if (playerTile) {
    playerTile.classList.add("tor-trail-active");
    setTimeout(() => {
      playerTile.classList.remove("tor-trail-active");
    }, toolStats.torTrail.duration * 1000);
  }

  setTimeout(() => {
    gameState.torTrailActive = false;
    logAction("🌀 Tor Trail expired.");
  }, toolStats.torTrail.duration * 1000);
}

// Use CC Cleaner
function useCCCleanser() {
  if (gameState.isPaused) return;
  logAction("🧯 CC Cleaner used! Seekers confused.");
  playSound('powerup', 0.8);
  const newX = Math.floor(Math.random() * gameState.mapSize);
  const newY = Math.floor(Math.random() * gameState.mapSize);
  gameState.seekerPositions = [{ x: newX, y: newY }];
  
  // Add visual effect
  const seekers = document.querySelectorAll(".seeker");
  seekers.forEach(seeker => {
    const effect = document.createElement("div");
    effect.className = "teleport-effect";
    seeker.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
  });
  
  createMap();
}

// Use VPN
function useVPN() {
  if (gameState.isPaused) return;
  if (!gameState.cloakingAvailable) {
    logAction("⚠️ VPN is on cooldown.");
    playSound('click');
    return;
  }

  logAction("🛡️ VPN activated! Short-term invisibility.");
  playSound('powerup', 0.4);
  gameState.cloakingAvailable = false;
  startCooldown('vpn', toolStats.vpn.cooldown);
  addActiveEffect('🛡️ VPN', toolStats.vpn.duration);

  setTimeout(() => {
    gameState.cloakingAvailable = true;
    logAction("🛡️ VPN expired.");
  }, toolStats.vpn.duration * 1000);
}

// Enter Dark Web Market
function enterDarkWebMarket() {
  if (gameState.isPaused) return;
  logAction("🛒 Dark Web Market opened.");
  playSound('powerup', 0.3);
  const items = [
    { name: "Corruption Evidence", icon: "📄", action: useUSBAdapter },
    { name: "Security Bypass Key", icon: "🔑", action: useTorTrail },
    { name: "Anonymous Identity", icon: "👤", action: useCCCleanser }
  ];
  const choice = items[Math.floor(Math.random() * items.length)];
  logAction(`🎁 Obtained: ${choice.name}`);
  addToInventory(choice.name, "One-time use item", choice.action, choice.icon);
}

// Move player to new position with animation
function movePlayer(x, y) {
  if (gameState.currentRole !== "hider" || !gameState.gameActive || gameState.isPaused) return;

  // Check if target position is a firewall
  const isFirewall = gameState.specialTiles.firewalls.some(t => t.x === x && t.y === y);
  if (isFirewall) {
    logAction("🚧 Firewall blocked your path!");
    playSound('click');
    return;
  }

  const dx = Math.abs(x - gameState.hiderPosition.x);
  const dy = Math.abs(y - gameState.hiderPosition.y);

  if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (gameState.torTrailActive && dx === 1 && dy === 1)) {
    // Play footstep sound with alternating steps
    const now = Date.now();
    if (now - gameState.lastStepTime > 200) { // Throttle footsteps
      playSound(Math.random() > 0.5 ? 'footstep1' : 'footstep2', 0.3);
      gameState.lastStepTime = now;
    }

    // Animate movement
    const oldTile = document.querySelector(`.tile[data-x="${gameState.hiderPosition.x}"][data-y="${gameState.hiderPosition.y}"]`);
    const newTile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
    
    if (oldTile && newTile) {
      oldTile.classList.remove("hider");
      oldTile.classList.add("move-from");
      newTile.classList.add("move-to");
      
      setTimeout(() => {
        oldTile.classList.remove("move-from");
        newTile.classList.remove("move-to");
        gameState.hiderPosition = { x, y };
        checkTileEffects(x, y);
        createMap();
      }, 150);
    } else {
      gameState.hiderPosition = { x, y };
      checkTileEffects(x, y);
      createMap();
    }
  } else {
    logAction("⚠️ Can't move there.");
    playSound('click');
  }
}

// Check for tile effects after movement
function checkTileEffects(x, y) {
  // Check for data node collection
  const dataNodeIndex = gameState.specialTiles.dataNodes.findIndex(t => t.x === x && t.y === y);
  if (dataNodeIndex !== -1) {
    gameState.coins += 5;
    updateCoinsDisplay(gameState.coins);
    gameState.specialTiles.dataNodes.splice(dataNodeIndex, 1);
    logAction("💾 Collected data node (+5 coins)");
    playSound('coin');
    
    // Add collection effect
    const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
    if (tile) {
      const effect = document.createElement("div");
      effect.className = "collect-effect";
      tile.appendChild(effect);
      setTimeout(() => effect.remove(), 1000);
    }
  }
  
  // Check for teleport pad
  const teleport = gameState.specialTiles.teleports.find(t => t.x === x && t.y === y);
  if (teleport) {
    const destination = gameState.specialTiles.teleports.find(
      t => t.pair === teleport.pair && (t.x !== x || t.y !== y)
    );
    if (destination) {
      // Add teleport effect
      const tile = document.querySelector(`.tile[data-x="${x}"][data-y="${y}"]`);
      if (tile) {
        const effect = document.createElement("div");
        effect.className = "teleport-effect";
        tile.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
      }
      
      gameState.hiderPosition = { x: destination.x, y: destination.y };
      logAction("🌀 Teleported to another pad!");
      playSound('teleport');
      
      // Add arrival effect
      setTimeout(() => {
        const destTile = document.querySelector(`.tile[data-x="${destination.x}"][data-y="${destination.y}"]`);
        if (destTile) {
          const arriveEffect = document.createElement("div");
          arriveEffect.className = "teleport-arrive";
          destTile.appendChild(arriveEffect);
          setTimeout(() => arriveEffect.remove(), 1000);
        }
      }, 150);
    }
  }
  
  checkWin();
}

// Move AI seekers - IMPROVED CHASING LOGIC
function moveSeekerAI() {
  if (!gameState.cloakingAvailable || !gameState.gameActive || gameState.isPaused) return;

  gameState.seekerPositions.forEach(seeker => {
    // Calculate distance to hider
    const dx = seeker.x - gameState.hiderPosition.x;
    const dy = seeker.y - gameState.hiderPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only move if not already on top of hider
    if (distance > 0) {
      // Calculate possible moves
      const possibleMoves = [];
      
      // Check all 4 directions
      if (seeker.x > 0) possibleMoves.push({ x: seeker.x - 1, y: seeker.y });
      if (seeker.x < gameState.mapSize - 1) possibleMoves.push({ x: seeker.x + 1, y: seeker.y });
      if (seeker.y > 0) possibleMoves.push({ x: seeker.x, y: seeker.y - 1 });
      if (seeker.y < gameState.mapSize - 1) possibleMoves.push({ x: seeker.x, y: seeker.y + 1 });

      // Filter out moves that would hit firewalls
      const validMoves = possibleMoves.filter(move => 
        !gameState.specialTiles.firewalls.some(fw => fw.x === move.x && fw.y === move.y)
      );

      if (validMoves.length > 0) {
        // Find move that gets us closest to hider
        let bestMove = validMoves[0];
        let bestDistance = Math.sqrt(
          Math.pow(bestMove.x - gameState.hiderPosition.x, 2) + 
          Math.pow(bestMove.y - gameState.hiderPosition.y, 2)
        );

        for (let i = 1; i < validMoves.length; i++) {
          const move = validMoves[i];
          const currentDistance = Math.sqrt(
            Math.pow(move.x - gameState.hiderPosition.x, 2) + 
            Math.pow(move.y - gameState.hiderPosition.y, 2)
          );
          
          if (currentDistance < bestDistance) {
            bestMove = move;
            bestDistance = currentDistance;
          }
        }

        // 10% chance to make a random move instead (to make less predictable)
        if (Math.random() < 0.1) {
          seeker.x = validMoves[Math.floor(Math.random() * validMoves.length)].x;
          seeker.y = validMoves[Math.floor(Math.random() * validMoves.length)].y;
        } else {
          seeker.x = bestMove.x;
          seeker.y = bestMove.y;
        }
      }
    }
  });

  checkCaught();
  createMap();
}

// Calculate minimum distance between two positions
function calculateDistance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

// Reset game state for new level
function resetGame() {
  closeModals(); // Close any open modals first
  clearInterval(gameState.aiMoveInterval);
  gameState.hiderPosition = { x: 0, y: 0 };
  gameState.gameActive = true;
  gameState.isPaused = false;
  
  // Increase map size every 3 levels (max 9x9)
  gameState.mapSize = Math.min(9, 5 + Math.floor(gameState.level / 3));
  
  // Generate random goal position
  do {
    gameState.goalPosition = {
      x: Math.floor(Math.random() * gameState.mapSize),
      y: Math.floor(Math.random() * gameState.mapSize)
    };
  } while (
    (gameState.goalPosition.x === gameState.hiderPosition.x && 
     gameState.goalPosition.y === gameState.hiderPosition.y)
  );

  // Generate special tiles
  generateSpecialTiles();

  // Set seekers based on level - progressive difficulty
  const baseEnemyCount = 1;
  const additionalEnemies = Math.min(Math.floor(gameState.level / 2), 4);
  const enemyCount = baseEnemyCount + additionalEnemies;
  
  gameState.seekerPositions = [];
  for (let i = 0; i < enemyCount; i++) {
    let x, y;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      x = Math.floor(Math.random() * gameState.mapSize);
      y = Math.floor(Math.random() * gameState.mapSize);
      attempts++;
      
      // Ensure seekers don't spawn too close to hider (minimum 3 tiles away)
      const distanceToHider = calculateDistance({x, y}, gameState.hiderPosition);
      
      if (attempts >= maxAttempts) {
        // If we can't find a good position after many attempts, just place it anywhere
        break;
      }
    } while (
      (x === gameState.hiderPosition.x && y === gameState.hiderPosition.y) ||
      (x === gameState.goalPosition.x && y === gameState.goalPosition.y) ||
      gameState.specialTiles.firewalls.some(t => t.x === x && t.y === y) ||
      calculateDistance({x, y}, gameState.hiderPosition) < 3
    );
    
    gameState.seekerPositions.push({ x, y });
  }

  gameState.cloakingAvailable = true;
  gameState.decoyPlanted = false;
  gameState.torTrailActive = false;

  // Adjust AI speed based on level
  const aiSpeed = getSeekerSpeed();
  
  gameState.aiMoveInterval = setInterval(moveSeekerAI, aiSpeed);
  logAction(`🚀 Level ${gameState.level} (${gameState.mapSize}x${gameState.mapSize}): ${enemyCount} enemies at speed ${aiSpeed}ms`);
  createMap();
}

// Create the game map with animations
function createMap() {
  mapContainer.innerHTML = '';
  // Update grid template based on current map size
  mapContainer.style.gridTemplateColumns = `repeat(${gameState.mapSize}, 50px)`;
  
  for (let y = 0; y < gameState.mapSize; y++) {
    for (let x = 0; x < gameState.mapSize; x++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.x = x;
      tile.dataset.y = y;
      
      // Check for special tiles first
      if (gameState.specialTiles.firewalls.some(t => t.x === x && t.y === y)) {
        tile.classList.add("firewall");
        tile.textContent = "🚧";
      } else if (gameState.specialTiles.dataNodes.some(t => t.x === x && t.y === y)) {
        tile.classList.add("data-node");
        tile.textContent = "💾";
      } else if (gameState.specialTiles.teleports.some(t => t.x === x && t.y === y)) {
        tile.classList.add("teleport");
        tile.textContent = "🌀";
      } else if (x === gameState.hiderPosition.x && y === gameState.hiderPosition.y) {
        tile.classList.add("hider");
        tile.textContent = "🧍";
        if (gameState.torTrailActive) {
          tile.classList.add("tor-trail-active");
        }
      } else if (x === gameState.goalPosition.x && y === gameState.goalPosition.y) {
        tile.classList.add("goal");
        tile.textContent = "🔓";
      } else {
        gameState.seekerPositions.forEach(seeker => {
          if (seeker.x === x && seeker.y === y) {
            tile.classList.add("seeker");
            tile.textContent = "👁️";
          }
        });
      }
      
      tile.addEventListener("click", () => movePlayer(x, y));
      mapContainer.appendChild(tile);
    }
  }
}

// Check if player reached the goal
function checkWin() {
  if (gameState.hiderPosition.x === gameState.goalPosition.x && 
      gameState.hiderPosition.y === gameState.goalPosition.y) {
    const coinsEarned = 10 + Math.floor(gameState.level / 2);
    logAction(`🔓 Goal reached! Earned ${coinsEarned} coins.`);
    playSound('win');
    gameState.score += 10;
    gameState.coins += coinsEarned;
    gameState.level += 1;
    
    document.getElementById("coinsEarned").textContent = `+${coinsEarned} coins earned`;
    updateScoreDisplay(gameState.score);
    updateLevelDisplay(gameState.level);
    updateCoinsDisplay(gameState.coins);
    showWinModal();
    
    // Add celebration effect
    const goalTile = document.querySelector(".goal");
    if (goalTile) {
      const effect = document.createElement("div");
      effect.className = "win-effect";
      goalTile.appendChild(effect);
      setTimeout(() => effect.remove(), 2000);
    }
    
    setTimeout(resetGame, 1000);
  }
}

// Check if player was caught
function checkCaught() {
  if (!gameState.cloakingAvailable || !gameState.gameActive || gameState.isPaused) return;

  gameState.seekerPositions.forEach(seeker => {
    if (seeker.x === gameState.hiderPosition.x && seeker.y === gameState.hiderPosition.y) {
      const caughtBy = enemyList[Math.floor(Math.random() * enemyList.length)];
      const method = detectionMethods[Math.floor(Math.random() * detectionMethods.length)];

      document.getElementById("caughtByEnemy").innerText = caughtBy;
      document.getElementById("detectionMethod").innerText = method;
      
      logAction(`🚨 Caught by ${caughtBy} using ${method}`);
      playSound('lose');
      
      // Add caught effect
      const playerTile = document.querySelector(".hider");
      if (playerTile) {
        const effect = document.createElement("div");
        effect.className = "caught-effect";
        playerTile.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
      }
      
      // Decrease lives
      gameState.lives--;
      updateLivesDisplay(gameState.lives);
      
      if (gameState.lives > 0) {
        // If still have lives, reset position
        logAction(`❤️ ${gameState.lives} lives remaining!`);
        gameState.hiderPosition = { x: 0, y: 0 };
        
        // Reset seekers with minimum distance
        gameState.seekerPositions = [];
        const enemyCount = gameState.seekerPositions.length;
        for (let i = 0; i < enemyCount; i++) {
          let x, y;
          let attempts = 0;
          const maxAttempts = 50;
          
          do {
            x = Math.floor(Math.random() * gameState.mapSize);
            y = Math.floor(Math.random() * gameState.mapSize);
            attempts++;
            
            if (attempts >= maxAttempts) break;
          } while (
            (x === gameState.hiderPosition.x && y === gameState.hiderPosition.y) ||
            (x === gameState.goalPosition.x && y === gameState.goalPosition.y) ||
            gameState.specialTiles.firewalls.some(t => t.x === x && t.y === y) ||
            calculateDistance({x, y}, gameState.hiderPosition) < 3
          );
          
          gameState.seekerPositions.push({ x, y });
        }
        
        createMap();
      } else {
        // No lives left - game over
        gameState.gameActive = false;
        clearInterval(gameState.aiMoveInterval);
        showLoseModal();
      }
    }
  });
}

// Show win modal
function showWinModal() {
  document.getElementById("winModal").style.display = "flex";
}

// Show lose modal
function showLoseModal() {
  document.getElementById("loseModal").style.display = "flex";
}

// Close all modals
function closeModals() {
  document.getElementById("winModal").style.display = "none";
  document.getElementById("loseModal").style.display = "none";
  document.getElementById("upgradeModal").style.display = "none";
  document.getElementById("pauseModal").style.display = "none";
  playSound('click');
}

// Log game actions
function logAction(message) {
  const lines = logBox.innerText.split("\n");
  lines.unshift(message);
  if (lines.length > 2) lines.pop();
  logBox.innerText = lines.join("\n");
}

// Use cloaking ability
function useCloaking() {
  if (!gameState.cloakingAvailable || !gameState.gameActive || gameState.isPaused) {
    logAction("⚠️ Cloaking is on cooldown.");
    playSound('click');
    return;
  }
  logAction("🕶️ Cloaking activated!");
  playSound('cloak');
  gameState.cloakingAvailable = false;
  startCooldown('cloaking', toolStats.cloaking.cooldown);
  addActiveEffect('🕶️ Cloaking', toolStats.cloaking.duration);

  // Add visual effect
  const playerTile = document.querySelector(".hider");
  if (playerTile) {
    playerTile.classList.add("cloaking-active");
    setTimeout(() => {
      playerTile.classList.remove("cloaking-active");
    }, toolStats.cloaking.duration * 1000);
  }

  setTimeout(() => {
    gameState.cloakingAvailable = true;
    logAction("🕶️ Cloaking expired.");
  }, toolStats.cloaking.duration * 1000);
}

// Plant decoy data
function plantDecoyData() {
  if (gameState.decoyPlanted || !gameState.gameActive || gameState.isPaused) {
    logAction("🛑 Decoy is on cooldown.");
    playSound('click');
    return;
  }
  logAction("📡 Decoy planted! Confusing AI.");
  playSound('decoy');
  gameState.decoyPlanted = true;
  startCooldown('decoy', toolStats.decoy.cooldown);
  addActiveEffect('📡 Decoy', toolStats.decoy.duration);

  // Move all seekers to random positions
  gameState.seekerPositions = gameState.seekerPositions.map(() => ({
    x: Math.floor(Math.random() * gameState.mapSize),
    y: Math.floor(Math.random() * gameState.mapSize)
  }));
  
  // Add visual effect
  const seekers = document.querySelectorAll(".seeker");
  seekers.forEach(seeker => {
    const effect = document.createElement("div");
    effect.className = "decoy-effect";
    seeker.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
  });
  
  createMap();

  setTimeout(() => {
    gameState.decoyPlanted = false;
    logAction("📡 Decoy expired.");
  }, toolStats.decoy.duration * 1000);
}

// Start cooldown timer for an ability
function startCooldown(ability, duration) {
  const button = Array.from(document.querySelectorAll('.dropdown-content button'))
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

// Add active effect indicator
function addActiveEffect(name, duration) {
  const effectElement = document.createElement('div');
  effectElement.className = 'active-effect';
  effectElement.innerHTML = `${name} <span id="effect-time">${duration}s</span>`;
  document.body.appendChild(effectElement);
  
  let timeLeft = duration;
  const timer = setInterval(() => {
    timeLeft--;
    const timeElement = effectElement.querySelector('#effect-time');
    if (timeElement) timeElement.textContent = `${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (effectElement.parentNode) {
        effectElement.parentNode.removeChild(effectElement);
      }
    }
  }, 1000);
  
  setTimeout(() => {
    if (effectElement.parentNode) {
      effectElement.parentNode.removeChild(effectElement);
    }
    clearInterval(timer);
  }, duration * 1000);
}