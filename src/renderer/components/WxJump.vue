<template>
  <div class="wx-jump-wrapper">
    <el-button type="primary" @click="wxJump('start')">开始</el-button>
    <el-button type="default" @click="stopJump">停止</el-button>
    <!-- <div class="image-wrapper">
      <span class="tips" v-for="(tip, index) in tips" :key="index" :style="{
        top: tip.top/2 + 'px',
        left: tip.left/2 + 'px'
      }"></span>
      <img :key="imageData" :src="`${DIR_STATIC}/wxJumpTemp.png?v=${imageData}`" width="50%">
    </div> -->
    <div class="logger-wrapper" ref="loggerRef">
      <p class="logger-item" v-for="(item, index) in loggers" :key="index">{{item}}</p>
    </div>
  </div>
</template>
<script>
  let path = require('path')
  import Shell from 'shelljs'
  import GetPixels from 'get-pixels'
  import { PHONE_SETTING, IMG_SETTING }  from '@/config'
  // 打包后路径不一样 因为需要上传文件并读取
  // 上传图片放置根目录的temp文件夹 需要在package.json中配置 并创建temp目录
  const IS_DEV = process.env.NODE_ENV !== 'production'
  const DIR_PATH = IS_DEV ? path.join(__static, '../temp') : path.join(__static, '../../../../../temp')
  const ADB_PATH = IS_DEV ? path.join(__static, '../Tools/Adb/adb.exe') : path.join(__static, '../../../../../Tools/Adb/adb.exe')
  const IMG_PATH = path.join(DIR_PATH, IMG_SETTING.NAME)
  Shell.config.silent = true
  Shell.config.execPath = 'C:\\WINDOWS\\system32\\cmd.exe' // 'C:\\Program Files\\nodejs\\node.exe'
  export default {
    data () {
      return {
        DIR_STATIC: DIR_PATH,
        imageData: '',
        imageState: true,
        btnState: true,
        loggers: [],
        imageRandom: Math.random(),
        tips: [],
        state: {
          isConnect: false
        }
      }
    },
    created () {
      window.tyler = this
      console.log(__static)
    },
    methods: {
      getCenterPoint (callback) {
        GetPixels(IMG_PATH, (err, pixels) => {
          if(err) {
            this.loggers.push(JSON.stringify(err))
            return
          }
          let data = this.findPoint(pixels)
          callback(data)
        })
      },
      findPoint (pixels) {
        let piece_x_sum = 0,
            piece_x_c = 0,
            piece_y_max = 0,
            board_x = 0,
            board_y = 0;
        let { width, height } = this.$image.getSize()
        for(var y = 0; y < height; y++) {
          for(var x = 0; x < width; x ++) {
            var pixel0 = pixels.get(x, y, 0),
                pixel1 = pixels.get(x, y, 1),
                pixel2 = pixels.get(x, y, 2);
            if ((50 < pixel0 && pixel0 < 60) && (53 < pixel1 && pixel1 < 63) && (95 < pixel2 && pixel2 < 110)) {
              piece_x_sum += x
              piece_x_c += 1
              piece_y_max = y > piece_y_max ? y : piece_y_max
            }
          }
        }
        if (!piece_x_sum || !piece_x_c) {
          return [0,0,0,0]
        }
        let piece_x = piece_x_sum / piece_x_c;
        let piece_y = piece_y_max - 20;  // 上移棋子底盘高度的一半


        for (var y = 0; y < height; y++){
          if (y < 300) {
            continue
          }
          if (board_x || board_y) {
            break;
          }
          var last_pixel0 = pixels.get(0, y, 0);
          var last_pixel1 = pixels.get(0, y, 1);
          var last_pixel2 = pixels.get(0, y, 2);
          let board_x_sum = 0
          let board_x_c = 0
          for (var x = 0; x < width; x++) {
            var pixel0 = pixels.get(x, y, 0),
                pixel1 = pixels.get(x, y, 1),
                pixel2 = pixels.get(x, y, 2);
            //修掉脑袋比下一个小格子还高的情况的 bug
            if (Math.abs(x - piece_x) < 70) {
              continue
            }
            //修掉圆顶的时候一条线导致的小 bug
            if (Math.abs(pixel0 - last_pixel0) + Math.abs(pixel1 - last_pixel1) + Math.abs(pixel2 - last_pixel2) > 10){
              board_x_sum += x
              board_x_c += 1
            }
          }
          if (board_x_sum) {
            board_x = board_x_sum / board_x_c
          }
        }
        board_y = piece_y + Math.abs(board_x - piece_x) * Math.abs(1122 - 831) / Math.abs(813 - 310)   // 按实际的角度来算，找到接近下一个 board 中心的坐标
        if (!board_x || !board_y) {
          return [0,0,0,0]
        }
        return [piece_x, piece_y, board_x, board_y]
      },
      upLoadImg () {
        return new Promise((resolve) => {
          this.loggers.unshift('>>>>>>>>>>>截取图片')
          Shell.exec(`${ADB_PATH} shell screencap -p /sdcard/${IMG_SETTING.NAME}`, () => {
            this.loggers.unshift('>>>>>>>>>>>上传图片')
            Shell.exec(`${ADB_PATH} pull /sdcard/${IMG_SETTING.NAME} ${this.DIR_STATIC}`, () => {
              this.loggers.unshift('>>>>>>>>>>>图片上传完成')
              this.imageData = Math.random()
              resolve()
            })
          })
        })
      },
      // 获取安卓分辨率
      getAndroidScreen () {
        return new Promise((resolve, reject) => {
          Shell.exec(`${ADB_PATH} shell "dumpsys window | grep mUnrestrictedScreen"`, function (code, stdout, stderr) {
            if (code == 0) {
              var newStdout = stdout.split(')')[1].match(/(\d+)(\d+)/g)
              resolve({
                x: ~~newStdout[0],
                y: ~~newStdout[1]
              })
            }
            reject()
          })
        })
      },
      androidJump (distance) {
        this.getAndroidScreen().then(({x, y}) => {
          let config = {}
          let press_time = distance * 2.099
          press_time = press_time > 200 ? press_time : 200
          press_time = ~~press_time
          // TODO: 坐标根据截图的 size 来计算
          let [ x1, x2, y1, y2 ] = [374, 1060, 374, 1060]
          let cmd = `${ADB_PATH} shell input swipe ${x1} ${y1} ${x2} ${y2} ${press_time}`
          this.loggers.unshift(`>>>>>>>>>>>>>>>${cmd}`)
          Shell.exec(cmd, () => {})
        })
      },
      wxJump (type) {
        if (type === 'start') {
          // 如果为开始按钮 则强制开始
          this.$isStop = false
        }
        this.upLoadImg().then(() => {
          this.$image = this.$electron.nativeImage.createFromPath(IMG_PATH)
          this.getCenterPoint(([piece_x, piece_y, board_x, board_y]) => {
            this.loggers.unshift(`${piece_x}, ${piece_y}, ${board_x}, ${board_x}`)
            this.androidJump(Math.sqrt(Math.abs(board_x - piece_x) ** 2 + Math.abs(board_y - piece_y) ** 2))
            this.$timer = setTimeout(() => {
              !this.$isStop && this.wxJump()
            }, 2000)
          })
        })
      },
      stopJump () {
        this.$isStop = true
      }
    }
  }
</script>
<style lang="scss" scoped>
  .wx-jump-wrapper{
    .logger-wrapper{
      width: 600px;
      height: 400px;
      border: 1px solid #ccc;
      overflow-y: auto;
      .logger-item{
        padding: 0;
        margin: 0;
        line-height: 24px;
        color: #ccc;
      }
    }
  }
</style>
