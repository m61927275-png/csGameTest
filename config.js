// ============================================
// CS2 Web Game - Configuration
// ============================================

export const CONFIG = {
    // Rendering
    RENDER: {
        WIDTH: window.innerWidth,
        HEIGHT: window.innerHeight,
        FOV: 90,
        NEAR: 0.1,
        FAR: 1000,
        SHADOW_MAP_SIZE: 1024,
        ANTIALIAS: true
    },

    // Physics
    PHYSICS: {
        GRAVITY: -20,
        GROUND_LEVEL: 0,
        PLAYER_HEIGHT: 1.7,
        PLAYER_RADIUS: 0.4,
        CROUCH_HEIGHT: 1.0,
        JUMP_FORCE: 8,
        STEP_HEIGHT: 0.5,
        FRICTION: 0.85,
        AIR_FRICTION: 0.97
    },

    // Movement speeds (units per second)
    MOVEMENT: {
        WALK_SPEED: 5.0,
        RUN_SPEED: 7.5,
        CROUCH_SPEED: 3.0,
        ACCELERATION: 50,
        DECELERATION: 40,
        AIR_ACCELERATION: 10,
        MOUSE_SENSITIVITY: 0.002
    },

    // Game rules
    GAME: {
        MAX_PLAYERS_PER_TEAM: 5,
        ROUND_TIME: 115,           // seconds
        BUY_TIME: 20,              // seconds
        FREEZE_TIME: 5,            // seconds
        BOMB_TIMER: 40,            // seconds
        MAX_ROUNDS: 24,            // MR12
        ROUNDS_TO_WIN: 13,
        START_MONEY: 800,
        MAX_MONEY: 16000,
        KILL_REWARD_DEFAULT: 300,
        ROUND_WIN_REWARD: 3250,
        ROUND_LOSS_BASE: 1400,
        ROUND_LOSS_INCREMENT: 500,
        MAX_LOSS_BONUS: 3400,
        PLANT_REWARD: 300,
        DEFUSE_REWARD: 300,
        HEADSHOT_MULTIPLIER: 4.0
    },

    // Teams
    TEAMS: {
        T: 'terrorist',
        CT: 'counter-terrorist',
        SPEC: 'spectator'
    },

    // Game modes
    MODES: {
        COMPETITIVE: 'competitive',
        DEATHMATCH: 'deathmatch',
        CASUAL: 'casual'
    },

    // Bot difficulty
    BOT_DIFFICULTY: {
        EASY: { reactionTime: 800, accuracy: 0.3, aimSpeed: 0.02 },
        NORMAL: { reactionTime: 500, accuracy: 0.5, aimSpeed: 0.04 },
        HARD: { reactionTime: 300, accuracy: 0.7, aimSpeed: 0.07 },
        EXPERT: { reactionTime: 150, accuracy: 0.85, aimSpeed: 0.1 }
    },

    // Colors
    COLORS: {
        T_COLOR: 0xD4A843,
        CT_COLOR: 0x4A7AB5,
        T_COLOR_HEX: '#D4A843',
        CT_COLOR_HEX: '#4A7AB5',
        CROSSHAIR: '#00FF00',
        HEALTH: '#4CAF50',
        ARMOR: '#2196F3',
        MONEY: '#FFD700',
        DAMAGE: '#FF4444',
        HEADSHOT: '#FFD700',
        SKY: 0x87CEEB,
        GROUND: 0x8B7355,
        WALL: 0xC4A882,
        WALL_DARK: 0x8B7355,
        CRATE: 0x6B4226,
        METAL: 0x888888,
        CONCRETE: 0x999999
    },

    // Map scale
    MAP_SCALE: 1.0,
    UNIT: 1.0  // 1 unit = 1 meter
};

