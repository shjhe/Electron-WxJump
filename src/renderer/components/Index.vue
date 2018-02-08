<template>
  <div class="home-page-wrapper">
    <div class="logo-wrapper">
      <img class="logo" src="/static/images/logo.jpg" alt="">
    </div>
    <div class="welcome">
      欢迎使用微信跳一跳辅助软件
    </div>
    <div class="button-wrapper">
      <el-button class="button" type="primary" @click="handleBegin">立即开始</el-button>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'Welcome',
    data () {
      return {}
    },
    methods: {
      handleBegin () {
        this.$router.push('/jump')
      }
    }
  }
</script>
<style lang="scss" scoped>
  .home-page-wrapper{
    text-align: center;
    .logo-wrapper{
      margin-top: 60px;
      .logo{
        width: 256px;
      }
    }
    .welcome{
      font-size: 24px;
    }
    .button-wrapper{
      margin-top: 40px;
      .button{
        width: 200px;
        font-size: 18px;
      }
    }
  }
</style>
