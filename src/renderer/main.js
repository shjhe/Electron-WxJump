import Vue from 'vue'
import axios from 'axios'

import App from './App'
import router from './router'
import store from './store'
import log from 'electron-log'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false
log.info('Hello, log');
/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
