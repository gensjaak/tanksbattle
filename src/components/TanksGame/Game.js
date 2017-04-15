/* eslint-disable no-new */
/* eslint-disable no-unused-vars */
/* eslint-disable no-extra-bind */

import Functions from './Functions'
import BaseConfig from './BaseConfig'
import Player from './Player'
import Spirit from './Spirit'
import LEVELS from './LevelsConfig'

let _players = []
let _spirits = []
let playerMovesAndProtector = 0
let finishedAt = null
let fixMainPlayer = false
let TimeRecords = []
let tmpTime
let isPaused = false
let dashboard
let Colors = [BaseConfig.COLORS.RED, BaseConfig.COLORS.GREEN, BaseConfig.COLORS.YELLOW, BaseConfig.COLORS.PURPLE]

export default class Game {
  constructor (configP, GStorage, GrizzlyInstanceP) {
    this.config = configP

    this.config.el = document.getElementById(this.config.el.toString().trim())
    this.config.el.style.width = BaseConfig.DIMENS.WIDTH + 'px'
    this.config.el.style.height = BaseConfig.DIMENS.HEIGHT + 'px'

    this.MainPlayerConfig = {}
    this.MainPlayerConfig.color = BaseConfig.COLORS.PLAYER_COLOR
    this.MainPlayerConfig.pseudo = this.config.pseudo

    this.spiritTTL = null

    if (this.config.online) {
      this.GrizzlyInstance = GrizzlyInstanceP
      this._showGetReadyGang({
        pseudo: this.config.pseudo,
        color: this.config.player.color,
        resistance: this.config.player.resistance
      }, () => {
        this._getOnlinePlayers((response) => {
          this.OnlinePlayers = response
        })
      })
    } else {
      this.Storage = GStorage

      this._restoreGameDataFor(this.MainPlayerConfig.pseudo)

      switch (this.config.mode) {
        case BaseConfig.GAME_MODES[0]: // Arcade
          this._startLevel(this.MainPlayerConfig.level)
          break
        case BaseConfig.GAME_MODES[1]: // Survival
          this.MainPlayerConfig.level = BaseConfig.GAME_MODES_KEYS.SURVIVAL.KEY
          this._startSurvival()
          break
        case BaseConfig.GAME_MODES[2]: // Masochisme
          this.MainPlayerConfig.level = BaseConfig.GAME_MODES_KEYS.MASOCHISME.KEY
          this._startMasochism()
          break
      }
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

    document.onkeydown = (event) => {
      if (event.isTrusted && event.keyCode === BaseConfig.KEYS.BLANKSPACE) {
        this.resume()
      }
    }

    this._showStatus('Paused', 'Your score is up to ' + this.MainPlayerInstance.score, 'Your resistance is up to ' + this.MainPlayerConfig.resistance, () => {
      document.onkeydown = null
      this._restart()
    })
  }

  resume () {
    this._unfreezeMainPlayer()
    _players.forEach((player, index) => {
      player.unfreeze()
    })

    dashboard.remove()

    this._checkGameIntegrity()
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

    // All players are searching for spirits
    this._watchForSpirits()

    // Others behaviours
    // Run away if detect MainPlayer near
    // this._botsCapability1()

    // reShoot if one of my bullets is digested by MainPlayer
    // this._botsCapability2()

    return this
  }

  _getOnlinePlayers (callback) {
    this.GrizzlyInstance.send('players', {
      room: this.config.room
    }, (response) => {
      console.log(response)
      callback(response)
    })
  }

  _launchSpiritPower (spiritKey, caller) {
    this._showSpiritEffects(spiritKey, caller)
    switch (spiritKey) {
      case BaseConfig.SPIRITS.FREEZER:
        _players.forEach((player, index) => {
          if (player !== caller) {
            player.forceFreeze()
          }
        })
        this.spiritTTL = setTimeout(() => {
          _players.forEach((player, index) => {
            if (player !== caller) {
              player.unForceFreeze()
            }
          })
        }, BaseConfig.SPIRITS_CONFIG[spiritKey].ttl)
        break
    }
  }

  _watchForSpirits () {
    _players.forEach((player, index) => {
      player.spiritResearch = player.onMove((pos) => {
        let __spiritsPositions = new Array(_spirits.length).fill('').map((spiritPosition, i) => {
          return _spirits[i].x + ':' + _spirits[i].y
        })
        let index = __spiritsPositions.indexOf(pos.x + ':' + pos.y)
        if (index > -1) {
          let SpiritInstance = _spirits[index]

          this._gainSpirit(player, SpiritInstance)

          SpiritInstance.leaveUs()
        }
      })
    })
  }

  _gainSpirit (PlayerInstance, SpiritInstance) {
    PlayerInstance.spirits.push(SpiritInstance.key)

    let spiritPower = document.createElement('div')
    spiritPower.style.position = 'absolute'
    spiritPower.style.zIndex = '98'
    spiritPower.style.left = Functions.pxToNumber(PlayerInstance.el.style.left) - PlayerInstance.fW + 'px'
    spiritPower.style.top = Functions.pxToNumber(PlayerInstance.el.style.top) - PlayerInstance.fH + 'px'
    spiritPower.style.borderRadius = '50%'
    spiritPower.style.border = 'none'
    spiritPower.style.boxSizing = 'border-box'
    spiritPower.style.width = (PlayerInstance.fW * 3) + 'px'
    spiritPower.style.height = (PlayerInstance.fH * 3) + 'px'
    spiritPower.style.backgroundColor = SpiritInstance.color
    spiritPower.style.transform = 'scale(0)'
    spiritPower.style.opacity = '.5'
    spiritPower.style.transition = 'all .5s ease-out 0s'

    this.config.el.appendChild(spiritPower)
    this._connectMoves(PlayerInstance, spiritPower)

    let i = 0
    let scaleMax = 1
    let spiritoutousEffects = setInterval(() => {
      if (i >= scaleMax) {
        clearInterval(spiritoutousEffects)
        spiritoutousEffects = setTimeout(() => {
          let spiritoutousEffects2 = setInterval(() => {
            if (i <= 0) {
              spiritPower.remove()
              clearInterval(spiritoutousEffects)
              clearInterval(spiritoutousEffects2)
              this._deconnectMoves(PlayerInstance, spiritPower)
            } else {
              spiritPower.style.transform = 'scale(' + i + ')'
              i -= 0.1
            }
          }, 30)
        }, 500)
      } else {
        spiritPower.style.transform = 'scale(' + i + ')'
        i += 0.1
      }
    }, 5)

    document.onkeypress = (event) => {
      if (event.isTrusted && (event.keyCode === BaseConfig.KEYS.SPIRIT_LAUNCHER || event.charCode === BaseConfig.KEYS.SPIRIT_LAUNCHER)) {
        this._launchSpiritPower(SpiritInstance.key, PlayerInstance)
        PlayerInstance.spirits = Functions.removeAt(PlayerInstance.spirits, PlayerInstance.spirits.indexOf(SpiritInstance.key))
        document.onkeypress = null
      }
    }
  }

  _drawSpiritoutous (PlayerInstance) {
    let spiritoutous = document.createElement('div')
    spiritoutous.style.position = 'absolute'
    spiritoutous.style.zIndex = '98'
    spiritoutous.style.left = Functions.pxToNumber(PlayerInstance.el.style.left) - PlayerInstance.fW + 'px'
    spiritoutous.style.top = Functions.pxToNumber(PlayerInstance.el.style.top) - PlayerInstance.fH + 'px'
    spiritoutous.style.borderRadius = '50%'
    spiritoutous.style.border = 'none'
    spiritoutous.style.boxSizing = 'border-box'
    spiritoutous.style.width = (PlayerInstance.fW * 3) + 'px'
    spiritoutous.style.height = (PlayerInstance.fH * 3) + 'px'
    spiritoutous.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
    spiritoutous.style.transform = 'scale(0)'
    spiritoutous.style.transition = 'all .5s ease-out 0s'

    this.config.el.appendChild(spiritoutous)

    return spiritoutous
  }

  _showSpiritEffects (spiritKey, PlayerInstance) {
    let SpiritoutousElement = this._drawSpiritoutous(PlayerInstance)
    let i = 0
    let scaleMax = parseInt(BaseConfig.DIMENS.HEIGHT / BaseConfig.DIMENS.SQUARE)
    let spiritoutousEffects = setInterval(() => {
      if (i >= scaleMax) {
        clearInterval(spiritoutousEffects)
        let opacity = 1
        spiritoutousEffects = setInterval(() => {
          SpiritoutousElement.style.opacity = opacity
          opacity -= 0.1
          if (opacity <= 0) {
            SpiritoutousElement.remove()
            clearInterval(spiritoutousEffects)
          }
        }, (BaseConfig.SPIRITS_CONFIG[spiritKey].ttl / 10))
      } else {
        SpiritoutousElement.style.transform = 'scale(' + i + ')'
        i++
      }
    }, 5)
  }

  _writeToStorage (pseudoP, gameModeP, scoreP, levelP, resistanceP) {
    this.Storage.set(pseudoP + '.' + gameModeP + '.' + BaseConfig.PLAYER_SCORE_KEY, scoreP)
    this.Storage.set(pseudoP + '.' + gameModeP + '.' + BaseConfig.PLAYER_EVO_KEY, levelP)
    this.Storage.set(pseudoP + '.' + gameModeP + '.' + BaseConfig.PLAYER_RESISTANCE_KEY, resistanceP)
  }

  _checkGameIntegrity () {
    if (this._mainPlayerDied()) {
      this._gameOver()
    }

    if (this._someOneWon()) {
      finishedAt = new Date() - tmpTime
      let survival = _players[0]

      if (!survival.isBot) { // He won
        this._playerWon()
      }
    }
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
    clearTimeout(this.spiritTTL)
    this.config.teams = LEVELS[lvlKey].config.teams
    this._showLevelInfos((parseInt(this.MainPlayerConfig.level) + 1), LEVELS[this.MainPlayerConfig.level].name, LEVELS[this.MainPlayerConfig.level].config.player.resistance, () => {
      tmpTime = new Date()
      this.start().inflateBehaviours()
    })
  }

  _startMasochism () {
    let startWith = 3

    this.MainPlayerConfig.pseudo = this.config.pseudo
    this.MainPlayerConfig.color = BaseConfig.COLORS.PLAYER_COLOR
    this.MainPlayerConfig.resistance = BaseConfig.GAME_MODES_KEYS.MASOCHISME.PLAYER_RESISTANCE

    this.MainPlayerInstance = new Player(this, this.MainPlayerConfig.pseudo, this.MainPlayerConfig, this.config.el, false)
    this.MainPlayerInstance.resistance = this.MainPlayerConfig.resistance
    this.MainPlayerInstance.score = this.MainPlayerConfig.score = 0

    _players.push(this.MainPlayerInstance)

    this._protectPlayer(this.MainPlayerInstance)

    this._addStrongBots(startWith)

    this._showLevelInfos('', 'Masochist mode', BaseConfig.GAME_MODES_KEYS.MASOCHISME.PLAYER_RESISTANCE, () => {
      this.inflateBehaviours()
    })
  }

  _addBots (nb) {
    nb = nb || Functions.rand(1, 2)

    if (_players.length >= 8) {
      nb = 1
    }

    for (let i = 0; i < nb; i++) {
      let randomConfig = {
        botId: 'TANK_' + (i + 1),
        team: {
          resistance: Functions.rand(1, 6),
          color: Colors[Functions.rand(0, (Colors.length - 1))],
          gain: Functions.randInArray([10, 20, 30])
        }
      }
      _players.push(new Player(this, randomConfig.botId, randomConfig.team, this.config.el, true))
    }

    let addSpiritKeeper = Functions.rand(0, 1)
    if (addSpiritKeeper === 1) {
      let randomConfig = {
        botId: 'TANK_' + (_players.length),
        team: {
          haveSpirit: true,
          resistance: Functions.rand(6, 10),
          color: BaseConfig.COLORS.FREEZER,
          gain: {
            pts: Functions.randInArray([10, 20, 30]),
            spiritKey: BaseConfig.SPIRITS.FREEZER
          }
        }
      }
      _players.push(new Player(this, randomConfig.botId, randomConfig.team, this.config.el, true))
    }
  }

  _addStrongBots (nb) {
    nb = nb || Functions.rand(1, 2)

    if (_players.length >= 8) {
      nb = 1
    }

    for (let i = 0; i < nb; i++) {
      let randomConfig = {
        botId: 'TANK_' + (i + 1),
        team: {
          resistance: Functions.rand(10, 15),
          color: Colors[Functions.rand(0, (Colors.length - 1))],
          gain: Functions.randInArray([50, 60, 70])
        }
      }
      _players.push(new Player(this, randomConfig.botId, randomConfig.team, this.config.el, true))
    }

    let addSpiritKeeper = Functions.rand(0, 1)
    if (addSpiritKeeper === 1) {
      let randomConfig = {
        botId: 'TANK_' + (_players.length),
        team: {
          haveSpirit: true,
          resistance: Functions.rand(8, 10),
          color: BaseConfig.COLORS.FREEZER,
          gain: {
            pts: Functions.randInArray([10, 20, 30]),
            spiritKey: BaseConfig.SPIRITS.FREEZER
          }
        }
      }
      _players.push(new Player(this, randomConfig.botId, randomConfig.team, this.config.el, true))
    }
  }

  _startSurvival () {
    let startWith = 5

    this.MainPlayerConfig.pseudo = this.config.pseudo
    this.MainPlayerConfig.color = BaseConfig.COLORS.PLAYER_COLOR
    this.MainPlayerConfig.resistance = BaseConfig.GAME_MODES_KEYS.SURVIVAL.PLAYER_RESISTANCE

    this.MainPlayerInstance = new Player(this, this.MainPlayerConfig.pseudo, this.MainPlayerConfig, this.config.el, false)
    this.MainPlayerInstance.resistance = this.MainPlayerConfig.resistance
    this.MainPlayerInstance.score = this.MainPlayerConfig.score = 0

    _players.push(this.MainPlayerInstance)

    this._protectPlayer(this.MainPlayerInstance)

    this._addBots(startWith)

    this._showLevelInfos('', 'Survival mode', BaseConfig.GAME_MODES_KEYS.SURVIVAL.PLAYER_RESISTANCE, () => {
      this.inflateBehaviours()
    })
  }

  _showGetReadyGang (args, callback) {
    this._createDashBoard('#FFF')

    dashboard.style.display = 'flex'
    dashboard.style.justifyContent = 'center'

    let lvlIndex = document.createElement('span')
    lvlIndex.style.display = 'block'
    lvlIndex.style.width = '100%'
    lvlIndex.style.textAlign = 'center'
    lvlIndex.style.fontSize = '3em'
    lvlIndex.style.fontFamily = 'fantasy'
    lvlIndex.style.margin = '10% 0'
    lvlIndex.style.color = '#607D8B'
    lvlIndex.style.marginBottom = '0'
    lvlIndex.style.lineHeight = '1'
    lvlIndex.innerText = args.pseudo

    let playerlogo = document.createElement('canvas')
    let w = 100
    let h = 100
    let crop = (w * 30) / 100
    playerlogo.width = w
    playerlogo.height = h
    playerlogo.style.borderRadius = '0'
    playerlogo.style.alignSelf = 'center'
    playerlogo.style.boxShadow = args.color + ' 0px 10px 20px -5px'
    playerlogo.style.position = 'absolute'
    playerlogo.style.overflow = 'visible'
    playerlogo.style.border = '5px solid #FFF'
    playerlogo.style.borderTop = 'none'
    let ctx = playerlogo.getContext('2d')
    ctx.fillStyle = args.color
    ctx.fillRect(0, 0, w, h)
    ctx.clearRect(0, 0, crop, crop)
    ctx.clearRect(w - crop, 0, crop, crop)

    let lvlPlayerResistance = document.createElement('span')
    lvlPlayerResistance.innerText = 'Your resistance is up to ' + args.resistance
    lvlPlayerResistance.style.display = 'block'
    lvlPlayerResistance.style.width = '100%'
    lvlPlayerResistance.style.textAlign = 'center'
    lvlPlayerResistance.style.fontSize = '1.5em'
    lvlPlayerResistance.style.fontFamily = 'sans-serif'
    lvlPlayerResistance.style.margin = '0'
    lvlPlayerResistance.style.color = '#F44336'
    lvlPlayerResistance.style.position = 'absolute'
    lvlPlayerResistance.style.bottom = '30%'
    lvlPlayerResistance.style.fontWeight = 'bold'

    let nextBtn = document.createElement('button')
    nextBtn.innerText = 'ready to go'
    nextBtn.style.display = 'inline-block'
    nextBtn.style.width = '80%'
    nextBtn.style.textAlign = 'center'
    nextBtn.style.fontSize = '1em'
    nextBtn.style.fontFamily = 'sans-serif'
    nextBtn.style.margin = '0 10%'
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

    dashboard.appendChild(lvlIndex)
    dashboard.appendChild(playerlogo)
    dashboard.appendChild(lvlPlayerResistance)
    dashboard.appendChild(nextBtn)

    nextBtn.addEventListener('click', () => {
      dashboard.remove()
      callback()
    })

    this.config.el.appendChild(dashboard)
  }

  _showLevelInfos (txt1, txt2, txt3, callback) {
    this._createDashBoard('#FFF')

    let lvlIndex = document.createElement('span')
    lvlIndex.style.display = 'block'
    lvlIndex.style.width = '100%'
    lvlIndex.style.textAlign = 'center'
    lvlIndex.style.fontSize = '10em'
    lvlIndex.style.fontFamily = 'fantasy'
    lvlIndex.style.margin = '20% 0'
    lvlIndex.style.color = '#607D8B'
    lvlIndex.style.marginBottom = '0'
    lvlIndex.style.lineHeight = '1'
    if (txt1.toString() !== '') {
      lvlIndex.innerText = Functions.twoDigits(txt1)
    }

    let lvlName = document.createElement('span')
    lvlName.innerText = txt2
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
    lvlPlayerResistance.innerText = 'Your resistance is up to ' + txt3
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

    dashboard.appendChild(lvlIndex)
    dashboard.appendChild(lvlName)
    dashboard.appendChild(lvlPlayerResistance)

    this.config.el.appendChild(dashboard)

    setTimeout(() => {
      dashboard.remove()
      callback()
    }, BaseConfig.TIME_TO_LEAVE_LEVELSHOWER)
  }

  _showLevelEnd (det, statusP, callback) {
    this._createDashBoard('#FFF')

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

    dashboard.appendChild(recordTime)
    dashboard.appendChild(status)
    dashboard.appendChild(replayBtn)
    if (nextBtn) {
      dashboard.appendChild(nextBtn)
    }

    setTimeout(() => {
      this.config.el.appendChild(dashboard)
    }, 500)

    let __destroy = () => {
      dashboard.remove()
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

  _createDashBoard (bgColor) {
    if (dashboard && dashboard.remove) {
      dashboard.remove()
    }
    dashboard = document.createElement('div')
    dashboard.style.position = 'absolute'
    dashboard.style.top = '0'
    dashboard.style.right = '0'
    dashboard.style.bottom = '0'
    dashboard.style.left = '0'
    dashboard.style.zIndex = '99'
    dashboard.style.backgroundColor = bgColor || 'rgba(0, 0, 0, 0.8)'
    dashboard.style.cursor = 'default'
  }

  _showStatus (txt1, txt2, txt3, callback) {
    this._createDashBoard()

    let el1 = document.createElement('span')
    el1.innerText = txt1
    el1.style.display = 'block'
    el1.style.width = '100%'
    el1.style.textAlign = 'center'
    el1.style.fontSize = '10em'
    el1.style.fontFamily = 'fantasy'
    el1.style.margin = '20% 0'
    el1.style.color = '#FAFAFA'
    el1.style.marginBottom = '0'
    el1.style.lineHeight = '1'

    let el2 = document.createElement('span')
    el2.innerText = txt2
    el2.style.display = 'block'
    el2.style.width = 'initial'
    el2.style.textAlign = 'center'
    el2.style.fontSize = '3em'
    el2.style.fontFamily = 'fantasy'
    el2.style.margin = '0'
    el2.style.color = '#00BCD4'
    el2.style.padding = '0 5%'
    el2.style.lineHeight = '1.2'
    el2.style.marginTop = '0'

    let el3 = document.createElement('span')
    el3.innerText = txt3
    el3.style.display = 'block'
    el3.style.width = '100%'
    el3.style.textAlign = 'center'
    el3.style.fontSize = '1.5em'
    el3.style.fontFamily = 'sans-serif'
    el3.style.margin = '0'
    el3.style.color = '#FAFAFA'
    el3.style.position = 'absolute'
    el3.style.bottom = '10%'
    el3.style.fontWeight = 'bold'

    let btn = document.createElement('button')
    btn.innerText = 'restart this level'
    btn.style.display = 'inline-block'
    btn.style.width = '40%'
    btn.style.textAlign = 'center'
    btn.style.fontSize = '1em'
    btn.style.fontFamily = 'sans-serif'
    btn.style.margin = '0 30%'
    btn.style.color = '#FFF'
    btn.style.position = 'absolute'
    btn.style.bottom = '20%'
    btn.style.right = '0'
    btn.style.fontWeight = 'bold'
    btn.style.height = '70px'
    btn.style.border = 'none'
    btn.style.background = '#EF9A9A'
    btn.style.textTransform = 'lowercase'
    btn.style.fontVariant = 'small-caps'
    btn.style.borderRadius = '50px'
    btn.style.outline = 'none'
    btn.style.boxShadow = 'none'
    btn.style.cursor = 'pointer'

    Functions.empty(dashboard)

    dashboard.appendChild(el1)
    dashboard.appendChild(el2)
    dashboard.appendChild(el3)
    dashboard.appendChild(btn)

    this.config.el.appendChild(dashboard)

    btn.addEventListener('click', (event) => {
      dashboard.remove()
      callback()
    })
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
        case BaseConfig.KEYS.BLANKSPACE:
          isPaused = true
          this.pause()
          break
      }
    }
  }

  _restart () {
    this._destroyAll()
    switch (this.config.mode) {
      case BaseConfig.GAME_MODES[0]: // Arcade
        this._startLevel(this.MainPlayerConfig.level)
        break
      case BaseConfig.GAME_MODES[1]: // Survival
        this._startSurvival()
        break
      case BaseConfig.GAME_MODES[2]: // Masochist
        this._startMasochism()
        break
    }
  }

  _destroyAll () {
    fixMainPlayer = false
    _players.forEach((player) => {
      player.destroy()
    })
    _players = []
  }

  _destroyBots () {
    _players.forEach((player) => {
      if (player.isBot) {
        player.destroy()
      }
    })
    _players = this._getMainPlayers()
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

      this._destroyBots()
      this._writeToStorage(this.MainPlayerConfig.pseudo, this.MainPlayerConfig.gameMode, this.MainPlayerConfig.score, this.MainPlayerConfig.level, this.MainPlayerConfig.resistance)
      this._startLevel(this.MainPlayerConfig.level)
    })
  }

  _gameOver () {
    this._showLevelEnd(BaseConfig.GAMEOVER, 'You failed with ' + this.MainPlayerConfig.score + ' pts !', (playerDecision) => {
      this._writeToStorage(this.MainPlayerConfig.pseudo, this.MainPlayerConfig.gameMode, this.MainPlayerConfig.score, this.MainPlayerConfig.level, this.MainPlayerConfig.resistance)
      this._restart()
    })
  }

  _mainPlayerDied () {
    return (_players.indexOf(this.MainPlayerInstance) === -1)
  }

  _punch (BulletInstance, DeadPlayerInstance) {
    if (BulletInstance.shooter && (BulletInstance.shooter.isBot !== DeadPlayerInstance.isBot)) {
      if (DeadPlayerInstance.getPunched(BulletInstance)) {
        _players = Functions.removeAt(_players, _players.indexOf(DeadPlayerInstance))

        if (!BulletInstance.shooter.isBot) {
          if (DeadPlayerInstance.team.haveSpirit) {
            BulletInstance.shooter.updateScore(DeadPlayerInstance.team.gain.pts)

            let SpiritInstance = DeadPlayerInstance.unleashSpirit()
            _spirits.push(SpiritInstance)

            if (SpiritInstance) {
              setTimeout(() => {
                _spirits = Functions.removeAt(_spirits, _spirits.indexOf(SpiritInstance))
                SpiritInstance.leaveUs()
              }, BaseConfig.TIME_FOR_SPIRIT_TO_LEAVE)
            }
          } else {
            BulletInstance.shooter.updateScore(DeadPlayerInstance.team.gain)
          }
          this.MainPlayerConfig.score = this.MainPlayerInstance.score
        }

        if (this._mainPlayerDied()) {
          finishedAt = new Date() - tmpTime
          this._freezeMainPlayer()
          this._gameOver()
        } else {
          switch (this.config.mode) {
            case BaseConfig.GAME_MODES[0]: // Arcade
              if (this._someOneWon()) {
                finishedAt = new Date() - tmpTime
                let survival = _players[0]

                if (!survival.isBot) { // He won
                  this._playerWon()
                }
              }
              break
            case BaseConfig.GAME_MODES[1]: // Survival
              this._addBots()
              break
            case BaseConfig.GAME_MODES[2]: // Masochist
              this._addStrongBots()
              break
          }
        }
      }
    }
  }

  _freezeMainPlayer () {
    document.onkeydown = null
    this.MainPlayerInstance.freeze()
  }

  _unfreezeMainPlayer () {
    this.MainPlayerInstance.unfreeze()
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
