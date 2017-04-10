<template>
  <div id="gamewrapper">
    <div id="maingame"></div>
    <section id="gameConfig" v-show="showGameConfig">
      <header>
        <img id="gamelogo" src="./../assets/imgs/logo.png">
        <div id="gamename">TanksBattle</div>
        <div id="gameversion"><sup>2.0.0</sup></div>
      </header>
      <form role="gameConfig">
        <div class="field-group">
          <center><label for="">Le jeu sauvegarde automatiquement à chaque progression en fonction du pseudo renseigné.</label></center>
        </div>

        <div class="field-group">
          <label for="pseudo">Ton pseudo</label>
          <input type="text" name="pseudo" value="" v-model="pseudo">
        </div>

        <div class="field-group">
          <label for="gameMode">Sélectionnes un niveau</label>
          <select name="gameMode" v-model="gameMode">
            <option v-for='_ in GameModes'>{{ _ }}</option>
          </select>
        </div>

        <button @click.stop.prevent="start()">go</button>
      </form>
    </section>
  </div>
</template>

<script>
  /* eslint-disable no-unused-vars */

  import Game from './TanksGame/Game'
  import BaseConfig from './TanksGame/BaseConfig'
  import GStorage from './TanksGame/GStorage'

  export default {
    name: 'TanksGame',
    components: {
    },
    data () {
      return {
        GameInstance: null,
        GameModes: BaseConfig.GAME_MODES,
        gameMode: BaseConfig.GAME_MODES[2],
        showGameConfig: false,
        pseudo: 'phareal'
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
      start () { // Démarrer un tout nouveau jeu avec la nouvelle configuration
        if (this.pseudo !== '') {
          this.showGameConfig = false
          this.GameInstance = new Game({
            el: 'maingame',
            mode: this.gameMode,
            pseudo: this.pseudo
          }, GStorage)
        }
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
    height: 90%
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

    &#continuegame,
    &#newgame
      border-radius: 50px
      display: inline-block
      float: none
      clear: both
      width: 100%
      margin: 10px 0
      font-size: 1.7em

    &#newgame
      background-color: #607D8B

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
