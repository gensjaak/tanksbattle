/* eslint-disable no-new */
/* eslint-disable no-unused-vars */

import Functions from './Functions.js'
import GStorage from './GStorage.js'
import BaseConfig from './BaseConfig.js'

import Player from './Player'

let _players = []
let playerMovesAndProtector = 0

const PLAYER_PSEUDO_KEY = 'pps'
const PLAYER_SCORE_KEY = 'psc'
const PLAYER_EVO_KEY = 'pev'
const PLAYER_MODE_KEY = 'pmo'

export default class Game {
  constructor (configP) {
    this.config = configP
    this.config.el = document.getElementById(this.config.el.toString().trim())

    this.config.el.style.width = BaseConfig.DIMENS.WIDTH + 'px'
    this.config.el.style.height = BaseConfig.DIMENS.HEIGHT + 'px'

    if (this.config.backup) {
      // GStorage.clear()

      // GStorage.set(PLAYER_PSEUDO_KEY, this.config.player.pseudo)
      // GStorage.set(PLAYER_SCORE_KEY, 0)
      // GStorage.set(PLAYER_EVO_KEY, 0)
      // GStorage.set(PLAYER_MODE_KEY, this.config.mode)
    }

    switch (this.config.mode) {
      case BaseConfig.GAME_MODES[0]: // Arcade
        this._adopt(this._getPlayerLastLevel(this._getPlayerLevels()))
        break
      case BaseConfig.GAME_MODES[1]: // Survival
        this._adopt(-1)
        break
      case BaseConfig.GAME_MODES[2]: // Masochisme
        this._adopt(-99)
        break
    }
  }

  start () {
    if (this.config.el) {
      this.config.teams.forEach((team, key) => {
        for (let i = 1; i <= team.nbPlayers; i++) {
          _players.push(new Player(this, 'TANK_' + (i + key), team, this.config.el, true))
        }
      })

      // Not supporting multiplayer in this version of the game so have to return the first main player founded
      this.MainPlayer = new Player(this, 'PLAYER', this.config.player, this.config.el, false)

      _players.push(this._protectPlayer(this.MainPlayer))

      return this
    }
  }

  pause () {
    this._freezeMainPlayer()
    _players.forEach((player, index) => {
      player.freeze()
    })
  }

  resume () {
    this._unfreezeMainPlayer()
    _players.forEach((player, index) => {
      player.unfreeze()
    })
  }

  punchPlayersWith (BulletInstance, laserJet) {
    let shouldBePunched = _players.filter((player, index) => {
      if (laserJet[0] === (player.getPosition().x + ':' + player.getPosition().y)) {
        return player
      }
    })
    if (!BulletInstance.shooter.isBot) {
      shouldBePunched = shouldBePunched.filter((player, index) => {
        if (player !== BulletInstance.shooter) {
          return player
        }
      })
    }

    shouldBePunched.forEach((player, index) => {
      this._punch(BulletInstance, player)
    })
  }

  inflateBehaviours () {
    if (this.MainPlayer) {
      this._freezeMainPlayer()
      this._unfreezeMainPlayer()
    }

    // Others behaviours
    // Run away if detect MainPlayer near
    this._botsCapability1()

    // reShoot if one of my bullets is digested by MainPlayer
    // this._botsCapability2()

    return this
  }

  _adopt (Level) {
    this.level = Level
  }

  _getPlayerLevels () {
    return GStorage.get(PLAYER_EVO_KEY) || [0]
  }

  _getPlayerLastLevel (levels) {
    return levels[levels.length - 1]
  }

  _getMainPlayers () {
    return _players.filter((player, index) => {
      return !player.isBot
    })
  }

  _playerMobility (e, Player) {
    if (e.isTrusted) {
      switch (e.keyCode) {
        case BaseConfig.KEYS.UP:
          Player.moveTo(Player.getPosition().x, (Player.getPosition().y - 1))
          Player.rotate(BaseConfig.DIRECTIONS.TOP)
          break
        case BaseConfig.KEYS.RIGHT:
          Player.moveTo((Player.getPosition().x + 1), Player.getPosition().y)
          Player.rotate(BaseConfig.DIRECTIONS.RIGHT)
          break
        case BaseConfig.KEYS.DOWN:
          Player.moveTo(Player.getPosition().x, (Player.getPosition().y + 1))
          Player.rotate(BaseConfig.DIRECTIONS.BOTTOM)
          break
        case BaseConfig.KEYS.LEFT:
          Player.moveTo((Player.getPosition().x - 1), Player.getPosition().y)
          Player.rotate(BaseConfig.DIRECTIONS.LEFT)
          break
        case BaseConfig.KEYS.PRIMARY_FIRE:
          Player.shootPrimary()
          break
        case BaseConfig.KEYS.SECONDARY_FIRE:
          console.log('Secondary Fire')
          break
        default:
          // Key not supported in this version of the game
          break
      }
    }
  }

  _punch (BulletInstance, PlayerInstance) {
    if (BulletInstance.shooter.isBot !== PlayerInstance.isBot) {
      if (PlayerInstance.getPunched(BulletInstance)) {
        _players = Functions.removeAt(_players, _players.indexOf(PlayerInstance))
      }
    }

    if (!BulletInstance.shooter.isBot) {
      BulletInstance.shooter.updateScore(PlayerInstance.team.winPts)
    }
  }

  _freezeMainPlayer () {
    document.onkeydown = null
  }

  _unfreezeMainPlayer () {
    document.onkeydown = (event) => {
      this._playerMobility(event, this.MainPlayer)
    }
  }

  _makeImmortal (PlayerInstance) {
    if (PlayerInstance.team) {
      PlayerInstance.resistance = BaseConfig.IMMORTAL_PLAYER_RESISTANCE
    }
  }

  _makeMortal (PlayerInstance) {
    if (PlayerInstance.team) {
      PlayerInstance.resistance = PlayerInstance.team.resistance
    }
  }

  _destroyElement (Element) {
    if (Element.remove) {
      Element.remove()
    }
  }

  _useProtector (PlayerInstance, Element) {
    let GameInstance = this
    let opacity = 1
    let protectorTimer = setInterval(() => {
      Element.style.opacity = opacity
      opacity -= 0.1
      if (opacity <= 0) {
        clearInterval(protectorTimer)

        GameInstance._makeMortal(PlayerInstance)
        GameInstance._deconnectMoves(PlayerInstance, Element)
        GameInstance._destroyElement(Element)
      }
    }, BaseConfig.TIME_FOR_PROTECT_AT_START)
  }

  _connectMoves (PlayerInstance, Element) {
    playerMovesAndProtector = PlayerInstance.onMove((position) => {
      Element.style.top = (position.y * PlayerInstance.fH) - PlayerInstance.fH + 'px'
      Element.style.left = (position.x * PlayerInstance.fW) - PlayerInstance.fH + 'px'
    })
  }

  _deconnectMoves (PlayerInstance, Element) {
    PlayerInstance.offMove(playerMovesAndProtector)
  }

  _drawProtector (PlayerInstance) {
    let protector = document.createElement('div')
    protector.style.position = 'absolute'
    protector.style.zIndex = '99'
    protector.style.left = Functions.pxToNumber(PlayerInstance.el.style.left) - PlayerInstance.fW + 'px'
    protector.style.top = Functions.pxToNumber(PlayerInstance.el.style.top) - PlayerInstance.fH + 'px'
    protector.style.borderRadius = '50%'
    protector.style.border = '2px outset ' + PlayerInstance.team.color
    protector.style.boxSizing = 'border-box'
    protector.style.width = (PlayerInstance.fW * 3) + 'px'
    protector.style.height = (PlayerInstance.fH * 3) + 'px'
    protector.style.backgroundColor = BaseConfig.COLORS.PROTECTOR_COLOR
    protector.style.transition = 'all .2s ease-out 0s'

    this.config.el.appendChild(protector)

    return protector
  }

  _protectPlayer (PlayerInstance) {
    let myProtector = this._drawProtector(PlayerInstance)

    this._makeImmortal(PlayerInstance)
    this._connectMoves(PlayerInstance, myProtector)
    this._useProtector(PlayerInstance, myProtector)

    return PlayerInstance
  }

  _botsCapability1 () {
    let mainPlayers = this._getMainPlayers()
    let mainPlayer = mainPlayers[0]
    let squareDimToReact = -2
    let space = new Array(squareDimToReact * -2 + 1).fill(squareDimToReact).map((el, index) => {
      return (el + index)
    })

    _players.forEach((player, index) => {
      if (player.isBot) {
        player.onMove((position) => {
          let pPosition = player.getPosition()
          let mpPosition = mainPlayer.getPosition()
          let dx = pPosition.x - mpPosition.x
          let dy = pPosition.y - mpPosition.y

          if (space.indexOf(dx) > -1 && space.indexOf(dy) > -1) {
            player.freeze()
            // do {
            //   if (dx > 0) {
            //     // Mainplayer est devant moi en x
            //     player.moveTo(player.getPosition().x + 1, player.getPosition().y)
            //   }
            //   if (dy > 0) {
            //     // Mainplayer est devant moi en y
            //     player.moveTo(player.getPosition().x, player.getPosition().y + 1)
            //   }

            //   // Get new positions
            //   dx = player.getPosition().x - mainPlayer.getPosition().x
            //   dy = player.getPosition().y - mainPlayer.getPosition().y
            // } while (dx !== 0 || dy !== 0)
          }
        })
      }
    })
  }
}
