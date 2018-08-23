import Vue from 'vue'
import Router from 'vue-router'
import Music from '@/pages/music'
import Home from '@/pages/home'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,

    },
    {
        path: '/music',
        name: 'Music',
        component: Music
    }
  ]
})
