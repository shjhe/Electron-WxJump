<template>
  <div id="wrapper">
    <main>
      <div class="logger-wrapper" ref="logger">
        <p v-for="log in loggers" :key="log">{{log}}</p>
      </div>
    </main>
  </div>
</template>

<script>
  import SystemInformation from './LandingPage/SystemInformation'
  import shell from 'shelljs'
  export default {
    name: 'landing-page',
    components: { SystemInformation },
    data () {
      return {
        loggers: []
      }
    },
    created () {
      // da
    },
    methods: {
      addLog () {
        // console.log(this.loggers)
        this.loggers.push(`>>>>>>>>这是第${this.loggers.length + 1}条信息`)
        this.$nextTick(() => {
          this.$refs.logger.scrollTop = this.$refs.logger.scrollHeight + 20
        })
        console.log(this.$refs.logger.sc)
      },
      closeWindow () {
        console.log('12121')
        shell.exec('node -v', function(...arg) {
          console.log(arg)
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .logger-wrapper{
    widows: 800px;
    height: 300px;
    border: 1px solid #ccc;
    overflow: auto;
  }
</style>

