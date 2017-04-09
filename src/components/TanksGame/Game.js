/* eslint-disable no-new */
/* eslint-disable no-unused-vars */

import Functions from './Functions.js'
import BaseConfig from './BaseConfig.js'
import Player from './Player'
import LEVELS from './LevelsConfig'

let _players = []
let playerMovesAndProtector = 0
let finishedAt = null
let fixMainPlayer = false
let TimeRecords = []
let tmpTime

export default class Game {
  constructor (configP, GStorage) {
    this.config = configP

    this.config.el = document.getElementById(this.config.el.toString().trim())
    this.config.el.style.width = BaseConfig.DIMENS.WIDTH + 'px'
    this.config.el.style.height = BaseConfig.DIMENS.HEIGHT + 'px'

    this.MainPlayerConfig = {}
    this.MainPlayerConfig.color = BaseConfig.COLORS.PLAYER_COLOR
    this.MainPlayerConfig.pseudo = this.config.pseudo

    this.Storage = GStorage

    this._restoreGameDataFor(this.MainPlayerConfig.pseudo)

    switch (this.config.mode) {
      case BaseConfig.GAME_MODES[0]: // Arcade
        this._startLevel(this.MainPlayerConfig.level)
        break
      case BaseConfig.GAME_MODES[1]: // Survival
        this.MainPlayerConfig.level = -1
        this._startLevel(this.MainPlayerConfig.level)
        break
      case BaseConfig.GAME_MODES[2]: // Masochisme
        this.MainPlayerConfig.level = -99
        this._startLevel(this.MainPlayerConfig.level)
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
      if (!fixMainPlayer) {
        this.MainPlayerInstance = new Player(this, this.MainPlayerConfig.pseudo, this.MainPlayerConfig, this.config.el, false)
        this.MainPlayerInstance.score = parseInt(this.MainPlayerConfig.score)
        fixMainPlayer = true

        _players.push(this._protectPlayer(this.MainPlayerInstance))
      } else {
        this._protectPlayer(this.MainPlayerInstance)
      }

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
    if (this.MainPlayerInstance) {
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

  _writeToStorage (pseudoP, gameModeP, scoreP, levelP, resistanceP) {
    this.Storage.set(pseudoP + '.' + gameModeP + '.' + BaseConfig.PLAYER_SCORE_KEY, scoreP)
    this.Storage.set(pseudoP + '.' + gameModeP + '.' + BaseConfig.PLAYER_EVO_KEY, levelP)
    this.Storage.set(pseudoP + '.' + gameModeP + '.' + BaseConfig.PLAYER_RESISTANCE_KEY, resistanceP)
  }

  _restoreGameDataFor (pseudoP) {
    // Restaurer les données de jeu au pseudo pseudoP, les charger dans la configuration générale
    // Si aucune donnée de jeu n'a été trouvée pour ce pseudoP, en créer et les charger dans la configuration générale. Ensuite, ajouter ce pseudo aux pseudos enrégistrés dans le cache

    // Vérifier si le pseudo pseudoP a été déjà utilisé
    let Pseudos = JSON.parse(this.Storage.get(BaseConfig.PLAYERS_PSEUDOS_KEY)) || []

    let pseudoPIndex = Pseudos.indexOf(pseudoP)

    if (pseudoPIndex > -1) {
      // Ce pseudoP a déjà été utilisé
      // Charger ses données de jeu en fonction du mode de jeu choisi
      this.MainPlayerConfig.pseudo = pseudoP
      this.MainPlayerConfig.gameMode = this.config.mode

      // Charger les autres données en fonction du mode de jeu choisi
      this.MainPlayerConfig.score = this.Storage.get(this.MainPlayerConfig.pseudo + '.' + this.MainPlayerConfig.gameMode + '.' + BaseConfig.PLAYER_SCORE_KEY)
      this.MainPlayerConfig.level = this.Storage.get(this.MainPlayerConfig.pseudo + '.' + this.MainPlayerConfig.gameMode + '.' + BaseConfig.PLAYER_EVO_KEY)
      this.MainPlayerConfig.resistance = this.Storage.get(this.MainPlayerConfig.pseudo + '.' + this.MainPlayerConfig.gameMode + '.' + BaseConfig.PLAYER_RESISTANCE_KEY)
    } else {
      // Ce pseudoP n'a jamais été utilisé
      // Créer un utilisateur avec des données de jeu de base
      this.MainPlayerConfig.pseudo = pseudoP
      this.MainPlayerConfig.gameMode = this.config.mode
      this.MainPlayerConfig.score = 0
      this.MainPlayerConfig.level = 0
      this.MainPlayerConfig.resistance = LEVELS[this.MainPlayerConfig.level].config.player.resistance

      // Ensuite demander de sauvegarde ces nouvelles données
      this._addNewUserToStorage()
    }
  }

  _addNewUserToStorage () {
    let Pseudos = JSON.parse(this.Storage.get(BaseConfig.PLAYERS_PSEUDOS_KEY)) || []
    Pseudos.push(this.MainPlayerConfig.pseudo)

    this.Storage.set(BaseConfig.PLAYERS_PSEUDOS_KEY, JSON.stringify(Pseudos))

    this._writeToStorage(this.MainPlayerConfig.pseudo, this.MainPlayerConfig.gameMode, this.MainPlayerConfig.score, this.MainPlayerConfig.level, this.MainPlayerConfig.resistance)
  }

  _newUser () {}

  _backup () {}

  _startLevel (lvlKey) {
    this.config.teams = LEVELS[lvlKey].config.teams
    this._showLevelInfos(() => {
      tmpTime = new Date()
      this.start().inflateBehaviours()
    })
  }

  _showLevelInfos (callback) {
    let levelShower = document.createElement('div')
    levelShower.style.position = 'absolute'
    levelShower.style.top = '0'
    levelShower.style.right = '0'
    levelShower.style.bottom = '0'
    levelShower.style.left = '0'
    levelShower.style.zIndex = '99'
    levelShower.style.backgroundColor = '#FFF'
    levelShower.style.cursor = 'default'

    let lvlIndex = document.createElement('span')
    lvlIndex.innerText = (parseInt(this.MainPlayerConfig.level) + 1)
    lvlIndex.style.display = 'block'
    lvlIndex.style.width = '100%'
    lvlIndex.style.textAlign = 'center'
    lvlIndex.style.fontSize = '10em'
    lvlIndex.style.fontFamily = 'fantasy'
    lvlIndex.style.margin = '20% 0'
    lvlIndex.style.color = '#607D8B'
    lvlIndex.style.marginBottom = '0'
    lvlIndex.style.lineHeight = '1'

    let lvlName = document.createElement('span')
    lvlName.innerText = LEVELS[this.MainPlayerConfig.level].name
    lvlName.style.display = 'block'
    lvlName.style.width = 'initial'
    lvlName.style.textAlign = 'center'
    lvlName.style.fontSize = '3em'
    lvlName.style.fontFamily = 'fantasy'
    lvlName.style.margin = '0'
    lvlName.style.color = '#41B883'
    lvlName.style.padding = '0 5%'
    lvlName.style.lineHeight = '1.2'
    lvlName.style.marginTop = '0'

    let lvlPlayerResistance = document.createElement('span')
    lvlPlayerResistance.innerText = 'Your resistance is up to ' + LEVELS[this.MainPlayerConfig.level].config.player.resistance
    lvlPlayerResistance.style.display = 'block'
    lvlPlayerResistance.style.width = '100%'
    lvlPlayerResistance.style.textAlign = 'center'
    lvlPlayerResistance.style.fontSize = '1.5em'
    lvlPlayerResistance.style.fontFamily = 'sans-serif'
    lvlPlayerResistance.style.margin = '0'
    lvlPlayerResistance.style.color = '#F44336'
    lvlPlayerResistance.style.position = 'absolute'
    lvlPlayerResistance.style.bottom = '10%'
    lvlPlayerResistance.style.fontWeight = 'bold'

    levelShower.appendChild(lvlIndex)
    levelShower.appendChild(lvlName)
    levelShower.appendChild(lvlPlayerResistance)

    this.config.el.appendChild(levelShower)

    setTimeout(() => {
      levelShower.remove()
      callback()
    }, BaseConfig.TIME_TO_LEAVE_LEVELSHOWER)
  }

  _showLevelEnd (det, statusP, callback) {
    let shower = document.createElement('div')
    shower.style.position = 'absolute'
    shower.style.top = '0'
    shower.style.right = '0'
    shower.style.bottom = '0'
    shower.style.left = '0'
    shower.style.zIndex = '99'
    shower.style.backgroundColor = '#FFF'
    shower.style.cursor = 'default'

    let recordTime = document.createElement('span')
    recordTime.innerText = det
    recordTime.style.display = 'block'
    recordTime.style.width = '100%'
    recordTime.style.textAlign = 'center'
    recordTime.style.fontSize = '7em'
    recordTime.style.fontFamily = 'fantasy'
    recordTime.style.margin = '20% 0'
    recordTime.style.color = '#41B883'
    recordTime.style.marginBottom = '0'
    recordTime.style.lineHeight = '1.5'

    if (det === BaseConfig.GAMEOVER) {
      recordTime.style.color = '#F44336'
    }

    let status = document.createElement('span')
    status.innerText = statusP
    status.style.display = 'block'
    status.style.width = 'initial'
    status.style.textAlign = 'center'
    status.style.fontSize = '2em'
    status.style.fontFamily = 'fantasy'
    status.style.margin = '0'
    status.style.color = '#03A9F4'
    status.style.padding = '0 5%'
    status.style.lineHeight = '1.2'
    status.style.marginTop = '0'

    let nextBtn
    if (det !== BaseConfig.GAMEOVER) {
      nextBtn = document.createElement('button')
      nextBtn.innerText = 'show me next level'
      nextBtn.style.display = 'inline-block'
      nextBtn.style.width = '40%'
      nextBtn.style.textAlign = 'center'
      nextBtn.style.fontSize = '1em'
      nextBtn.style.fontFamily = 'sans-serif'
      nextBtn.style.margin = '0 5%'
      nextBtn.style.color = '#FFF'
      nextBtn.style.position = 'absolute'
      nextBtn.style.bottom = '10%'
      nextBtn.style.right = '0'
      nextBtn.style.fontWeight = 'bold'
      nextBtn.style.height = '70px'
      nextBtn.style.border = 'none'
      nextBtn.style.background = '#41B883'
      nextBtn.style.textTransform = 'lowercase'
      nextBtn.style.fontVariant = 'small-caps'
      nextBtn.style.borderRadius = '50px'
      nextBtn.style.outline = 'none'
      nextBtn.style.boxShadow = 'none'
      nextBtn.style.cursor = 'pointer'
    }

    let replayBtn = document.createElement('button')
    replayBtn.innerText = 'replay this level'
    replayBtn.style.display = 'inline-block'
    replayBtn.style.width = '40%'
    replayBtn.style.textAlign = 'center'
    replayBtn.style.fontSize = '1em'
    replayBtn.style.fontFamily = 'sans-serif'
    replayBtn.style.margin = '0 5%'
    replayBtn.style.color = '#FFF'
    replayBtn.style.position = 'absolute'
    replayBtn.style.bottom = '10%'
    replayBtn.style.left = '0'
    replayBtn.style.fontWeight = 'bold'
    replayBtn.style.height = '70px'
    replayBtn.style.border = 'none'
    replayBtn.style.background = '#F44336'
    replayBtn.style.textTransform = 'lowercase'
    replayBtn.style.fontVariant = 'small-caps'
    replayBtn.style.borderRadius = '50px'
    replayBtn.style.outline = 'none'
    replayBtn.style.boxShadow = 'none'
    replayBtn.style.cursor = 'pointer'

    shower.appendChild(recordTime)
    shower.appendChild(status)
    shower.appendChild(replayBtn)
    if (nextBtn) {
      shower.appendChild(nextBtn)
    }

    setTimeout(() => {
      this.config.el.appendChild(shower)
    }, 500)

    let __destroy = () => {
      shower.remove()
    }

    let __nextLevelFn = () => {
      __destroy()
      callback(true)
    }

    let __replayLevelFn = () => {
      __destroy()
      callback(false)
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', __nextLevelFn, false)
    }
    replayBtn.addEventListener('click', __replayLevelFn, false)
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

  _someOneWon () {
    return (_players.length === 1)
  }

  _playerWon () {
    TimeRecords[this.MainPlayerConfig.level] = finishedAt
    this._showLevelEnd(TimeRecords[this.MainPlayerConfig.level] + ' ms', 'You passed this level with ' + this.MainPlayerConfig.score + ' pts !', (playerDecision) => {
      fixMainPlayer = true
      if (playerDecision) {
        this.MainPlayerConfig.level++
      }

      this.MainPlayerConfig.score = this.MainPlayerConfig.score
      this.MainPlayerConfig.resistance = this.MainPlayerConfig.resistance

      this._writeToStorage(this.MainPlayerConfig.pseudo, this.MainPlayerConfig.gameMode, this.MainPlayerConfig.score, this.MainPlayerConfig.level, this.MainPlayerConfig.resistance)
      this._startLevel(this.MainPlayerConfig.level)
    })
  }

  _gameOver () {
    this._showLevelEnd(BaseConfig.GAMEOVER, 'You failed with ' + this.MainPlayerConfig.score + ' pts !', (playerDecision) => {
      fixMainPlayer = false
      _players.forEach((player) => {
        player.destroy()
      })
      _players = []
      this._writeToStorage(this.MainPlayerConfig.pseudo, this.MainPlayerConfig.gameMode, this.MainPlayerConfig.score, this.MainPlayerConfig.level, this.MainPlayerConfig.resistance)
      this._startLevel(this.MainPlayerConfig.level)
    })
  }

  _mainPlayerDied () {
    return (_players.indexOf(this.MainPlayerInstance) === -1)
  }

  _punch (BulletInstance, PlayerInstance) {
    if (BulletInstance.shooter.isBot !== PlayerInstance.isBot) {
      if (PlayerInstance.getPunched(BulletInstance)) {
        _players = Functions.removeAt(_players, _players.indexOf(PlayerInstance))

        if (!BulletInstance.shooter.isBot) {
          BulletInstance.shooter.updateScore(PlayerInstance.team.winPts)
          this.MainPlayerConfig.score = this.MainPlayerInstance.score
        }

        if (this._someOneWon() || this._mainPlayerDied()) {
          finishedAt = new Date() - tmpTime
          let survival = _players[0]

          if (survival.isBot) { // Game over
            this._gameOver()
          } else { // He won
            this._playerWon()
          }
        }
      }
    }
  }

  _freezeMainPlayer () {
    document.onkeydown = null
  }

  _unfreezeMainPlayer () {
    document.onkeydown = (event) => {
      this._playerMobility(event, this.MainPlayerInstance)
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
            //     // MainPlayer est devant moi en x
            //     player.moveTo(player.getPosition().x + 1, player.getPosition().y)
            //   }
            //   if (dy > 0) {
            //     // MainPlayer est devant moi en y
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
