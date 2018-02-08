<template>
  <div id="app" v-loading.fullscreen.lock="loading">
    <router-view></router-view>
  </div>
</template>

<script>
  export default {
    name: 'App',
    data () {
      return {
        loading: true
      }
    },
    created () {
      this.loading = true
    },
    mounted () {
      this.$nextTick(_ => {
        setTimeout(_ => {
          this.loading = false
        }, 2000)
      })
    }
  }
</script>

<style>
  /* CSS */
</style>
