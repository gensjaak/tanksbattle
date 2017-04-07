export default {
  DIMENS: {
    WIDTH: 600,
    HEIGHT: 600,
    SQUARE: 50
  },
  GAME_MODES: ['Arcade', 'Survivant', 'Masochiste'],
  COLORS: {
    RED: '#F44336',
    GREEN: '#66BB6A',
    YELLOW: '#FFEB3B',
    BULLET: '#F9A825',
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
    SECONDARY_FIRE: 69
  },
  ACTIONS: {
    MOVE: 1,
    ROTATE: 2,
    SHOOT: 3
  },
  TIME_TO_REGENERATE_RESISTANCE: 500,
  TIME_FOR_PROTECT_AT_START: 500,
  IMMORTAL_PLAYER_RESISTANCE: 9999
}
