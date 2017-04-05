/* eslint-disable no-new */
/* eslint-disable no-unused-vars */

import Functions from './Functions.js'
import BaseConfig from './BaseConfig.js'

import Player from './Player'

let _players = []

export default class Game {
  constructor (configP) {
    this.config = configP
    this.config.el = document.getElementById(this.config.el.toString().trim())
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

  _unfreezeMainPlayer (PlayerInstance) {
    document.onkeydown = (event) => {
      this._playerMobility(event, PlayerInstance)
    }
  }

  start () {
    if (this.config.el) {
      this.config.teams.forEach((team, key) => {
        for (let i = 1; i <= team.nbPlayers; i++) {
          _players.push(new Player(this, 'TANK_' + (i + key), team, this.config.el, true))
        }
      })

      return _players[_players.push(new Player(this, 'PLAYER', this.config.player, this.config.el, false)) - 1]
    }
  }

  pause () {
    this._freezeMainPlayer()
    _players.forEach((player, index) => {
      player.freeze()
    })
  }

  resume () {
    _players.forEach((player, index) => {
      player.unfreeze()
    })
    this._unfreezeMainPlayer(this.MainPlayer)
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

  mapWithKeyboard (playerInstance) {
    if (playerInstance) {
      this.MainPlayer = playerInstance
      this._freezeMainPlayer()
      this._unfreezeMainPlayer(this.MainPlayer)
    }
  }
}
