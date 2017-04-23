export default {
  DIMENS: {
    WIDTH: 600,
    HEIGHT: 600,
    SQUARE: 50
  },
  SPIRITS: {
    FREEZER: 0
  },
  SPIRITS_CONFIG: [
    { // FREEZER
      ttl: 5000
    }
  ],
  GAME_MODES: ['Arcade', 'Survivant', 'Masochiste'],
  GAME_MODES_KEYS: {
    SURVIVAL: {
      KEY: -1,
      PLAYER_RESISTANCE: 2,
      NB_PLAYERS: 100
    },
    MASOCHISME: {
      KEY: -99,
      PLAYER_RESISTANCE: 1,
      NB_PLAYERS: 100
    }
  },
  COLORS: {
    RED: '#F44336', // Strong Team color
    GREEN: '#66BB6A', // Weak Team color
    YELLOW: '#FFEB3B', // Medium Team color
    PURPLE: '#3F51B5', // Dont disturb Team color
    FREEZER: '#B2EBF2', // Freezer spirit
    BULLET_COLOR: '#424242',
    PLAYER_COLOR: '#039BE5',
    PROTECTOR_COLOR: 'rgba(0, 0, 0, .1)'
  },
  SHOOTEFFECTS: {
    DECREASE_LIFE: 1
  },
  DIRECTIONS: {
    TOP: 0,
    RIGHT: 90,
    BOTTOM: 180,
    LEFT: -90
  },
  ROTATEMAP: [0, 90, 180, -90],
  KEYS: {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    PRIMARY_FIRE: 88,
    SECONDARY_FIRE: 69,
    BLANKSPACE: 32,
    SPIRIT_LAUNCHER: 119
  },
  ACTIONS: {
    MOVE: 1,
    ROTATE: 2,
    SHOOT: 3
  },
  TIME_TO_REGENERATE_RESISTANCE: 2000,
  TIME_TO_LEAVE_LEVELSHOWER: 2000,
  TIME_TO_REARM: 500,
  TIME_FOR_PROTECT_AT_START: 500,
  TIME_FOR_SPIRIT_TO_LEAVE: 2000,
  TIME_AFTER_RECOVERYMODE: 1000,
  IMMORTAL_PLAYER_RESISTANCE: 9999,
  GAME_INSTANCE_KEY: 'gi',
  PLAYERS_PSEUDOS_KEY: 'pps',
  PLAYER_SCORE_KEY: 'psc',
  PLAYER_EVO_KEY: 'pev',
  PLAYER_MODE_KEY: 'pmo',
  PLAYER_RESISTANCE_KEY: 'prk',
  PLAYER_TIMERECORDS_KEY: 'ptr',
  GAMEOVER: 'Game Over'
}
