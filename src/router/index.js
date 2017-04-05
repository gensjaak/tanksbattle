import Vue from 'vue'
import Router from 'vue-router'
import TanksGame from '@/components/TanksGame'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'TanksGame',
      component: TanksGame
    }
  ]
})
