<template>
  <div id="gamewrapper">
    <div id="maingame"></div>
    <section id="gameConfig" v-show="showGameConfig">
      <header>
        <img id="gamelogo" src="./../assets/imgs/logo.png" v-show="!playOnline">
        <div id="gamename">TanksBattle</div>
        <div id="gameversion"><sup>{{ version }}</sup></div>
      </header>
      <form role="gameConfig">
        <div class="field-group" v-show="!playOnline">
          <center><label for="">Le jeu sauvegarde automatiquement à chaque progression en fonction du pseudo renseigné.</label></center>
        </div>

        <div class="field-group" v-show="playOnline">
          <label for="serverIP">Adresse IP du serveur <span v-show="!serverFound">(Recherche de serveurs...)</span></label>
          <input type="text" name="serverIP" value="" v-model.trim="serverIP" @keyup.stop.prevent.enter="searchservers()">
        </div>

        <div class="field-group">
          <label for="pseudo">Ton pseudo</label>
          <input type="text" name="pseudo" value="" v-model="pseudo">
        </div>

        <div class="field-group" v-show="playOnline && serverFound">
          <label for="gameRoom">Parties sur le serveur</label>
          <select name="gameRoom" v-model="gameRoom">
            <option v-for='_ in GameRooms'>{{ _ }}</option>
          </select>
        </div>

        <div class="field-group" v-show="playOnline && gameRoom === newRoomStr && serverFound">
          <label for="gameMode">Sélectionnes un niveau pour la nouvelle partie</label>
          <select name="gameMode" v-model="gameMode">
            <option v-for='_ in GameModes'>{{ _ }}</option>
          </select>
        </div>

        <div class="field-group" v-show="playOnline && gameMode === 'Arcade'">
          <center><label for="">En mode arcade, tu seras en équipe avec 3autres bots avec qui t'affronteras les autres joueurs en ligne.</label></center>
        </div>

        <div class="field-group" v-show="!playOnline">
          <label for="gameMode">Sélectionnes un niveau</label>
          <select name="gameMode" v-model="gameMode">
            <option v-for='_ in GameModes'>{{ _ }}</option>
          </select>
        </div>

        <button type="button" @click.stop.prevent="configLocal()" id="playLocal" v-show="playOnline">local</button>
        <button type="button" @click.stop.prevent="startLocal()" v-show="!playOnline">go</button>
        
        <button type="button" disabled @click.stop.prevent="configOnline()" id="playOnline" v-show="!playOnline">online</button>
        <button type="button" disabled @click.stop.prevent="startOnline()" v-show="playOnline && serverFound">go</button>
      </form>
    </section>
  </div>
</template>

<script>
  /* eslint-disable no-unused-vars */

  import Game from './TanksGame/Game'
  import BaseConfig from './TanksGame/BaseConfig'
  import GStorage from './TanksGame/GStorage'
  import Grizzly from './TanksGame/Grizzly'

  export default {
    name: 'TanksGame',
    components: {
    },
    data () {
      return {
        version: '2.2.0',
        GameInstance: null,
        GameModes: BaseConfig.GAME_MODES,
        GameRooms: [],
        gameMode: BaseConfig.GAME_MODES[0],
        gameRoom: '',
        showGameConfig: false,
        showGameReady: false,
        playOnline: false,
        serverFound: false,
        pseudo: 'phareal',
        serverIP: '127.0.0.1:70',
        newRoomStr: 'Nouvelle partie',
        serverLooker: null,
        GrizzlyInstance: null
      }
    },
    mounted () {
      // GStorage.clear()
      this._checkStorage()
    },
    methods: {
      _checkStorage () {
        if (GStorage.isEmpty() === 1) { // Pas de sauvegardes précédentes, lancer un nouveau jeu après la configuration
          this.showBackupFoundWrapper = false
          this.showGameConfig = true
        } else { // Une sauvegarde a été trouvée. Vérifier son intégrité
          this.showBackupFoundWrapper = true
          this.showGameConfig = true
        }
      },
      searchservers () {
        let serverIPElt = document.getElementsByName('serverIP')
        let __openField = () => {
          clearInterval()
          setInterval(() => {
            serverIPElt[0].removeAttribute('disabled')
          }, 700)
        }
        let __closeField = () => {
          clearInterval()
          serverIPElt[0].setAttribute('disabled', 'disabled')
        }
        let __getRooms = (callback) => {
          this.GrizzlyInstance.on('getRooms', (response) => {
            callback(response)
          })
        }

        __closeField()
        this.GrizzlyInstance = new Grizzly(this.serverIP)
        this.serverFound = false

        // Connexion établie
        this.GrizzlyInstance.on('connect', () => {
          __openField()
        })

        // Get rooms
        this.GrizzlyInstance.on('getRooms', (response) => {
          if (Object.prototype.toString.call(response) === '[object Array]') {
            response.push(this.newRoomStr)
            this.GameRooms = response
            this.gameRoom = this.GameRooms[0]
            this.serverFound = true
          }
        })

        // Erreur de connexion
        this.GrizzlyInstance.on('connect_error', () => {
          __openField()
        })

        // Temps d'attente écoulé
        this.GrizzlyInstance.on('connect_timeout', () => {
          __openField()
        })
      },
      startLocal () { // Démarrer un tout nouveau jeu avec la nouvelle configuration
        if (this.pseudo !== '') {
          this.showGameConfig = false
          this.GameInstance = new Game({
            el: 'maingame',
            mode: this.gameMode,
            pseudo: this.pseudo
          }, GStorage)
        }
      },
      startOnline () {
        let __startGameOnline = (args) => {
          if (this.pseudo !== '') {
            this.showGameConfig = false
            this.GameInstance = new Game({
              el: 'maingame',
              mode: this.gameMode,
              pseudo: this.pseudo,
              room: this.gameRoom,
              online: true,
              player: {
                color: args.color,
                score: args.score,
                resistance: args.resistance
              }
            }, GStorage, this.GrizzlyInstance)
          }
        }

        this.GrizzlyInstance.send('game', {
          pseudo: this.pseudo,
          room: this.gameRoom,
          gameMode: this.gameMode
        }, (response) => {
          __startGameOnline(response)
        })
      },
      configOnline () {
        this.playOnline = true
      },
      configLocal () {
        this.playOnline = false
      }
    }
  }
</script>

<style lang="sass">
  html, body, #gamewrapper
    margin: 0
    padding: 0
    margin: 0
    padding: 0
    width: 100%
    height: 100%
    background-color: #F5F5F5

  [disabled]
    pointer-events: none
    opacity: .2

  #gamewrapper
    display: flex
    justify-content: center
    overflow: hidden

  #gameConfig
    align-self: center
    position: relative
    width: 400px
    height: 100%
    box-shadow: 0 0 50px 0 rgba(0, 0, 0, .15)
    border-radius: 1px
    background-color: #FFF
    margin: 0
    padding: 0
    overflow: hidden
    transition: all .3s ease-out 0s

  #gameConfig header
    height: initial
    margin: 50px 0
    overflow: hidden
    text-align: center

  #gameConfig header img#gamelogo
    display: inline-block
    height: 80px
    margin: 0
    padding: 0

  #gameConfig header div#gamename
    font-family: fantasy
    font-size: 1.5em
    color: #607D8B

  #gameConfig header div#gameversion
    font-family: fantasy
    font-size: 1.2em
    color: #B0BEC5

  #gameConfig form[role="gameConfig"]
    width: initial
    height: initial
    margin: 0
    padding: 0 50px

  #gameConfig .field-group
    margin: 10px 0
    padding: 10px 0
    overflow: hidden

  #gameConfig input,
  #gameConfig select,
  #gameConfig button,
  #gameConfig label
    font-family: sans-serif
    font-size: 1em
    font-weight: inherit
    display: block

  #gameConfig label
    color: #90A4AE
    font-size: .8em
    margin-bottom: 5px

  #gameConfig input,
  #gameConfig select
    width: 100%
    box-sizing: border-box
    height: initial
    border: 1px solid #CFD8DC
    border-radius: 0
    outline: none
    box-shadow: none
    padding: 10px
    color: #607D8B
    font-family: fantasy

  #gameConfig input[type="checkbox"]
    text-align: left
    width: initial
    display: inline

  #gameConfig button
    display: inline-block
    padding: 10px 17px 14px 17px
    border: none
    cursor: pointer
    color: #FFF
    height: 60px
    width: 60px
    border-radius: 50%
    background: #41B883
    font-size: 2em
    line-height: 1
    text-transform: lowercase
    font-variant: small-caps
    font-weight: 700
    font-family: monospace
    float: right
    box-shadow: 0 1px 5px 1px rgba(0, 0, 0, .12)
    transition: all .3s ease-out 0s

    &#playOnline,
    &#playLocal
      float: left
      width: initial
      border-radius: 30px
      background: #35495E

    &#playLocal
      background: #424242

    &:active,
    &:focus,
    &:hover
      outline: none
      box-shadow: 0 3px 8px 0px rgba(0, 0, 0, 0.3)
      transition: all .15s ease-out 0s

  #gameBackupFoundWrapper
    display: block
    text-align: center
    padding: 0 10%

    p
      font-family: sans-serif
      font-size: 1.2em
      line-height: 1.5
      color: #9E9E9E

      em
        color: #41B883
        font-weight: 600

  #maingame
    align-self: center
    position: relative
    box-shadow: 0 0 50px 0 rgba(0, 0, 0, .15)
    border-radius: 1px
    background-color: #FFF
    background-image: url('./../assets/imgs/map.png')
    background-repeat: repeat
    background-position: 0 0
    margin: 0
    padding: 0
    overflow: hidden
    transition: all .3s ease-out 0s
</style>
