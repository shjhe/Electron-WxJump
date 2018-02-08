import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'wx-jump',
      component: require('@/components/Index').default
    },
    {
      path: '/jump',
      name: 'wx-jump',
      component: require('@/components/WxJump').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
