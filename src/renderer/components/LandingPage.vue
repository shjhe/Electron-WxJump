<template>
  <div id="wrapper">
  </div>
</template>

<script>
  import shell from 'shelljs'
  export default {
    data () {
      return {
        loggers: []
      }
    },
    created () {
      this.initState()
    },
    methods: {
      initState () {
        // 查看是否连接手机并正常安装驱动
        Shell.exec('adb devices', (code, stdout, stderr) => {
          let flag = false
          debugger
          if (code === 0) {
            const reg = /.+\s+device\b/g
            let mathArr = stdout.match(reg) || []
            if (mathArr.length) {
              flag = true
            }
          }
          this.state.isConnect = flag
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

