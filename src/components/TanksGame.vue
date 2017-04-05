<template>
  <div id="maingame"></div>
</template>

<script>
  /* eslint-disable no-unused-vars */

  import Game from './TanksGame/Game'

  export default {
    name: 'TanksGame',
    components: {
    },
    data () {
      return {
        GameInstance: null,
        player: {
          color: '#42A5F5',
          resistance: 2
        },
        teams: [
          {
            color: '#9ccc65',
            nbPlayers: 2,
            winPts: 10,
            resistance: 3
          }
        ]
      }
    },
    mounted () {
      this.GameInstance = new Game({
        el: 'maingame',
        teams: this.teams,
        player: this.player
      })
      let MainPlayer = this.GameInstance.start()

      this.GameInstance.mapWithKeyboard(MainPlayer)
    },
    methods: {
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
  html, body
    overflow: hidden

  #maingame
    align-self: center
    position: relative
    width: 600px
    height: 600px
    box-shadow: 0 0 50px 0 rgba(0, 0, 0, .15)
    border-radius: 1px
    background-color: #FFF
    background-image: url('./../assets/imgs/map.png')
    background-repeat: repeat
    background-position: 0 0
    margin: 0
    padding: 0
    overflow: visible
</style>
