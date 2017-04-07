<template>
  <div id="gamewrapper">
    <div id="maingame"></div>
    <section id="configame" v-show="configame">
      <header>
        <img id="gamelogo" src="./../assets/imgs/logo.png">
        <div id="gamename">TanksBattle</div>
        <div id="gameversion"><sup>2.0.0</sup></div>
      </header>
      <form role="configame">
        <div class="field-group">
          <label for="pseudo">Ton pseudo</label>
          <input type="text" name="pseudo" value="" v-model="player.pseudo">
        </div>

        <div class="field-group">
          <label for="gamemode">Sélectionnes un niveau</label>
          <select name="gamemode" v-model="gamemode">
            <option v-for='_ in GameModes'>{{ _ }}</option>
          </select>
        </div>

        <div class="field-group">
          <label for="backup">Sauvegarder mon évolution</label>
          <input type="checkbox" name="backup" v-model="gamebackup">
        </div>

        <button @click.stop.prevent="start()">go</button>
      </form>
    </section>
    <!-- <section id="dashboard"></section> -->
  </div>
</template>

<script>
  /* eslint-disable no-unused-vars */

  import Game from './TanksGame/Game'
  import BaseConfig from './TanksGame/BaseConfig'

  export default {
    name: 'TanksGame',
    components: {
    },
    data () {
      return {
        GameInstance: null,
        GameModes: BaseConfig.GAME_MODES,
        gamemode: BaseConfig.GAME_MODES[0],
        gamebackup: true,
        configame: true,
        player: {
          pseudo: 'phareal',
          color: BaseConfig.COLORS.PLAYER_COLOR,
          resistance: 2
        },
        teams: [
          {
            color: BaseConfig.COLORS.GREEN,
            nbPlayers: 1,
            winPts: 10,
            resistance: 3
          }
        ]
      }
    },
    mounted () {
    },
    methods: {
      start () {
        if (this.player.pseudo !== '') {
          this.configame = false
          this.GameInstance = new Game({
            el: 'maingame',
            teams: this.teams,
            player: this.player,
            mode: this.gamemode,
            backup: this.gamebackup
          }).start().inflateBehaviours()
        }
      },
      pause () {
        this.GameInstance.pause()
      },
      resume () {
        this.GameInstance.resume()
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

  #gamewrapper
    display: flex
    justify-content: center
    overflow: hidden

  #configame
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

  #configame header
    height: initial
    margin: 40px 0
    overflow: hidden
    text-align: center

  #configame header img#gamelogo
    display: inline-block
    height: 80px
    margin: 0
    padding: 0

  #configame header div#gamename
    font-family: fantasy
    font-size: 1.5em
    color: #607D8B

  #configame header div#gameversion
    font-family: fantasy
    font-size: 1.2em
    color: #B0BEC5

  #configame form[role="configame"]
    width: initial
    height: initial
    margin: 0
    padding: 0 50px

  #configame .field-group
    margin: 10px 0
    padding: 10px 0
    overflow: hidden

  #configame input,
  #configame select,
  #configame button,
  #configame label
    font-family: sans-serif
    font-size: 1em
    font-weight: inherit
    display: block

  #configame label
    color: #90A4AE
    font-size: .8em
    margin-bottom: 5px

  #configame input,
  #configame select
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

  #configame input[type="checkbox"]
    text-align: left
    width: initial
    display: inline

  #configame button
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

    &:active,
    &:focus,
    &:hover
      outline: none
      box-shadow: 0 1px 80px 5px rgba(0, 0, 0, .15)
      transition: all .15s ease-out 0s

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

  #dashboard
    width: 80px
    height: 50%
    background-color: red
    align-self: center
</style>
