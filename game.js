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
  }
};

// Audio Elements
const sounds = {
  move: document.getElementById("moveSound"),
  coin: document.getElementById("coinSound"),
  win: document.getElementById("winSound"),
  lose: document.getElementById("loseSound"),
  powerup: document.getElementById("powerupSound"),
  teleport: document.getElementById("teleportSound"),
  click: document.getElementById("clickSound")
};

// Tool Stats
const toolStats = {
  cloaking: { 
    name: "Cloaking", 
    icon: "🕶️", 
    desc: "Make yourself invisible to enemies.", 
    level: 1, 
    duration: 10, 
    costBase: 10, 
    costInc: 5,
    cooldown: 20
  },
  decoy: { 
    name: "Decoy", 
    icon: "🧭", 
    desc: "Plant fake data to confuse enemies.", 
    level: 1, 
    duration: 15, 
    costBase: 10, 
    costInc: 5,
    cooldown: 25
  },
  torTrail: { 
    name: "Tor Trail", 
    icon: "🌀", 
    desc: "Allows diagonal movement for a short time.", 
    level: 1, 
    moves: 1, 
    costBase: 10, 
    costInc: 5,
    duration: 10,
    cooldown: 30
  },
  vpn: { 
    name: "VPN", 
    icon: "🛡️", 
    desc: "Short-term invisibility with reduced cooldown.", 
    level: 1, 
    duration: 5, 
    costBase: 10, 
    costInc: 5,
    cooldown: 15
  },
  ccCleaner: { 
    name: "CC Cleaner", 
    icon: "🧯", 
    desc: "Randomly teleports all enemies.", 
    level: 1, 
    power: 1, 
    costBase: 10, 
    costInc: 5,
    cooldown: 20
  }
};

// Shop Items
const shopItems = [
  { 
    name: "Bootable USB", 
    icon: "🔌", 
    desc: "Reveals the goal location for 3 seconds.", 
    cost: 10, 
    action: useUSBAdapter 
  },
  { 
    name: "Tor Trail", 
    icon: "🌀", 
    desc: "Allows diagonal movement for 10 seconds.", 
    cost: 10, 
    action: useTorTrail 
  },
  { 
    name: "CC Cleaner", 
    icon: "🧯", 
    desc: "Randomly teleports all enemies.", 
    cost: 10, 
    action: useCCCleanser 
  },
  { 
    name: "VPN", 
    icon: "🛡️", 
    desc: "5 seconds of invisibility with 15s cooldown.", 
    cost: 10, 
    action: useVPN 
  },
  { 
    name: "Extra Life", 
    icon: "❤️", 
    desc: "Get an additional life.", 
    cost: 20, 
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
function playSound(soundName) {
  if (sounds[soundName]) {
    sounds[soundName].currentTime = 0;
    sounds[soundName].play().catch(e => console.log("Audio play failed:", e));
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
  } else {
    // Restart AI movement with current speed
    const baseSpeed = 1000;
    const speedReduction = Math.min(gameState.level * 50, 600);
    const aiSpeed = Math.max(400, baseSpeed - speedReduction);
    gameState.aiMoveInterval = setInterval(moveSeekerAI, aiSpeed);
    document.getElementById("pauseModal").style.display = "none";
    logAction("▶️ Game resumed");
  }
}

// Return to main menu
function returnToMainMenu() {
  closeModals();
  gameState.gameActive = false;
  clearInterval(gameState.aiMoveInterval);
  document.getElementById("game-ui").style.display = "none";
  document.getElementById("main-menu").style.display = "flex";
  gameState.isPaused = false;
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
}

// Buy life in game over modal
function buyLifeInGameOver() {
  const cost = 20;
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

  initToolBar();
  resetGame();
  initInventory();
}

// Initialize the toolbar with stats
function initToolBar() {
  const container = document.getElementById("tool-bar");
  container.innerHTML = '';

  const items = [
    { icon: "🎯 Score: 0", tooltip: "Your current score", id: "scoreDisplay" },
    { icon: "🔓 Lv: 1", tooltip: "Current game level", id: "levelDisplay" },
    { icon: "🪙 Coins: 0", tooltip: "Coins you've earned", id: "coinDisplay" },
    { icon: "❤️ Lives: 3", tooltip: "Remaining lives", id: "livesDisplay" }
  ];

  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "stat-item";
    div.innerHTML = item.icon + `<span class="tooltip">${item.tooltip}</span>`;
    if (item.id) div.id = item.id;
    container.appendChild(div);
  });
}

// Update score display
function updateScoreDisplay(newScore) {
  gameState.score = newScore;
  const scoreDisplay = document.getElementById("scoreDisplay");
  if (scoreDisplay) {
    scoreDisplay.innerHTML = `🎯 Score: ${newScore}<span class="tooltip">Your current score</span>`;
  }
}

// Update level display
function updateLevelDisplay(newLevel) {
  gameState.level = newLevel;
  const levelDisplay = document.getElementById("levelDisplay");
  if (levelDisplay) {
    levelDisplay.innerHTML = `🔓 Lv: ${newLevel}<span class="tooltip">Current game level</span>`;
  }
}

// Update coins display
function updateCoinsDisplay(amount) {
  gameState.coins = amount;
  const coinDisplay = document.getElementById("coinDisplay");
  if (coinDisplay) {
    coinDisplay.innerHTML = `🪙 Coins: ${amount}<span class="tooltip">Coins you've earned</span>`;
  }
}

// Update lives display
function updateLivesDisplay(lives) {
  gameState.lives = lives;
  const livesDisplay = document.getElementById("livesDisplay");
  if (livesDisplay) {
    let hearts = '';
    for (let i = 0; i < lives; i++) {
      hearts += '❤️';
    }
    livesDisplay.innerHTML = `❤️ Lives: ${hearts}<span class="tooltip">Remaining lives</span>`;
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
      <button onclick="upgradeTool('${tool.name}')">
        <span>Upgrade</span>
        <span>${getUpgradeCost(tool)}🪙</span>
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
      <div>${item.cost}🪙</div>
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
  playSound('powerup');
  const goalTile = document.querySelector(".goal");
  if (goalTile) goalTile.classList.add("goal-revealed");
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
  playSound('powerup');
  gameState.torTrailActive = true;
  startCooldown('torTrail', toolStats.torTrail.cooldown);
  addActiveEffect('🌀 Tor Trail', toolStats.torTrail.duration);

  setTimeout(() => {
    gameState.torTrailActive = false;
    logAction("🌀 Tor Trail expired.");
  }, toolStats.torTrail.duration * 1000);
}

// Use CC Cleaner
function useCCCleanser() {
  if (gameState.isPaused) return;
  logAction("🧯 CC Cleaner used! Seekers confused.");
  playSound('powerup');
  const newX = Math.floor(Math.random() * gameState.mapSize);
  const newY = Math.floor(Math.random() * gameState.mapSize);
  gameState.seekerPositions = [{ x: newX, y: newY }];
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
  playSound('powerup');
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
  playSound('powerup');
  const items = [
    { name: "Corruption Evidence", icon: "📄", action: useUSBAdapter },
    { name: "Security Bypass Key", icon: "🔑", action: useTorTrail },
    { name: "Anonymous Identity", icon: "👤", action: useCCCleanser }
  ];
  const choice = items[Math.floor(Math.random() * items.length)];
  logAction(`🎁 Obtained: ${choice.name}`);
  addToInventory(choice.name, "One-time use item", choice.action, choice.icon);
}

// Move player to new position
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
    gameState.hiderPosition = { x, y };
    playSound('move');
    
    // Check for data node collection
    const dataNodeIndex = gameState.specialTiles.dataNodes.findIndex(t => t.x === x && t.y === y);
    if (dataNodeIndex !== -1) {
      gameState.coins += 5;
      updateCoinsDisplay(gameState.coins);
      gameState.specialTiles.dataNodes.splice(dataNodeIndex, 1);
      logAction("💾 Collected data node (+5 coins)");
      playSound('coin');
    }
    
    // Check for teleport pad
    const teleport = gameState.specialTiles.teleports.find(t => t.x === x && t.y === y);
    if (teleport) {
      const destination = gameState.specialTiles.teleports.find(
        t => t.pair === teleport.pair && (t.x !== x || t.y !== y)
      );
      if (destination) {
        gameState.hiderPosition = { x: destination.x, y: destination.y };
        logAction("🌀 Teleported to another pad!");
        playSound('teleport');
      }
    }
    
    checkWin();
    createMap();
  } else {
    logAction("⚠️ Can't move there.");
    playSound('click');
  }
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

// Reset game state for new level
function resetGame() {
  closeModals(); // Close any open modals first
  clearInterval(gameState.aiMoveInterval);
  gameState.hiderPosition = { x: 0, y: 0 };
  gameState.gameActive = true;
  gameState.isPaused = false;
  
  // Increase map size every 3 levels (max 7x7)
  gameState.mapSize = Math.min(7, 5 + Math.floor(gameState.level / 3));
  
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
  const additionalEnemies = Math.min(Math.floor(gameState.level / 2), 3);
  const enemyCount = baseEnemyCount + additionalEnemies;
  
  gameState.seekerPositions = [];
  for (let i = 0; i < enemyCount; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * gameState.mapSize);
      y = Math.floor(Math.random() * gameState.mapSize);
    } while (
      (x === gameState.hiderPosition.x && y === gameState.hiderPosition.y) ||
      (x === gameState.goalPosition.x && y === gameState.goalPosition.y) ||
      gameState.specialTiles.firewalls.some(t => t.x === x && t.y === y)
    );
    gameState.seekerPositions.push({ x, y });
  }

  gameState.cloakingAvailable = true;
  gameState.decoyPlanted = false;
  gameState.torTrailActive = false;

  // Adjust AI speed based on level - gets faster but not too fast
  const baseSpeed = 1000;
  const speedReduction = Math.min(gameState.level * 50, 600);
  const aiSpeed = Math.max(400, baseSpeed - speedReduction);
  
  gameState.aiMoveInterval = setInterval(moveSeekerAI, aiSpeed);
  logAction(`🚀 Level ${gameState.level} (${gameState.mapSize}x${gameState.mapSize}): ${enemyCount} enemies at speed ${aiSpeed}ms`);
  createMap();
}

// Create the game map
function createMap() {
  mapContainer.innerHTML = '';
  // Update grid template based on current map size
  mapContainer.style.gridTemplateColumns = `repeat(${gameState.mapSize}, 50px)`;
  
  for (let y = 0; y < gameState.mapSize; y++) {
    for (let x = 0; x < gameState.mapSize; x++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      
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
      
      // Decrease lives
      gameState.lives--;
      updateLivesDisplay(gameState.lives);
      
      if (gameState.lives > 0) {
        // If still have lives, reset position
        logAction(`❤️ ${gameState.lives} lives remaining!`);
        gameState.hiderPosition = { x: 0, y: 0 };
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
  playSound('powerup');
  gameState.cloakingAvailable = false;
  startCooldown('cloaking', toolStats.cloaking.cooldown);
  addActiveEffect('🕶️ Cloaking', toolStats.cloaking.duration);

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
  playSound('powerup');
  gameState.decoyPlanted = true;
  startCooldown('decoy', toolStats.decoy.cooldown);
  addActiveEffect('📡 Decoy', toolStats.decoy.duration);

  // Move all seekers to random positions
  gameState.seekerPositions = gameState.seekerPositions.map(() => ({
    x: Math.floor(Math.random() * gameState.mapSize),
    y: Math.floor(Math.random() * gameState.mapSize)
  }));
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