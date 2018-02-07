<template>
  <div class="wx-jump-wrapper">
    <el-button type="primary" @click="wxJump('start')">开始</el-button>
    <el-button type="default" @click="stopJump">停止</el-button>
    <div class="image-wrapper">
      <span class="tips" v-for="(tip, index) in tips" :key="index" :style="{
        left: tip[0] + 'px',
        top: tip[1] + 'px'
      }"></span>
      <img :key="imageData" src="../../../temp/wxJumpTemp.png" width="720px">
    </div>
    <!-- <div class="logger-wrapper" ref="loggerRef">
      <p class="logger-item" v-for="(item, index) in loggers" :key="index">{{item}}</p>
    </div> -->
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
        // 查找目标位置
        let piece_x_sum = 0,
            piece_x_c = 0,
            piece_y_max = 0,
            piece_x = 0,
            piece_y = 0,
            board_x_start = 0,
            board_x_end = 0,
            board_x_sum = 0,
            board_x_c = 0,
            board_x = 0,
            board_y = 0;
            let { width, height } = this.$image.getSize()
        let scan_x_border = Math.floor(width/8) // 扫描棋子时的左右边界
        let scan_start_y = 0  // 扫描的起始 y 坐标
        // 以 50px 步长，尝试探测 scan_start_y
        for(let y = Math.floor(height/3); y < Math.floor(height*2/3); y+=50) {
          let last_pixel0 = pixels.get(0, y, 0);
          let last_pixel1 = pixels.get(0, y, 1);
          let last_pixel2 = pixels.get(0, y, 2);
          for(var x = 1; x < width; x ++) {
            let pixel0 = pixels.get(x, y, 0),
                pixel1 = pixels.get(x, y, 1),
                pixel2 = pixels.get(x, y, 2);
            // 不是纯色的线，则记录 scan_start_y 的值，准备跳出循环
            if (pixel0 != last_pixel0 || pixel1 != last_pixel1 || pixel2 != last_pixel2) {
              scan_start_y = y - 50
              break
            }
          }
          if(scan_start_y) {
            break
          }
        }
        // console.info(`scan_start_y: ${scan_start_y}`)

        // 从 scan_start_y 开始往下扫描，棋子应位于屏幕上半部分，这里暂定不超过 2/3
        for(let y = scan_start_y; y < Math.floor(height*2/3); y++) {
            for(let x = scan_x_border; x < (width - scan_x_border); x++){  // 横坐标方面也减少了一部分扫描开销
              let pixel0 = pixels.get(x, y, 0),
                  pixel1 = pixels.get(x, y, 1),
                  pixel2 = pixels.get(x, y, 2);
              // 根据棋子的最低行的颜色判断，找最后一行那些点的平均值，这个颜色这样应该 OK，暂时不提出来
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
        piece_x = Math.floor(piece_x_sum / piece_x_c)
        piece_y = piece_y_max - 20 // - (13 || config.half_height)  // 上移棋子底盘高度的一半

        // 限制棋盘扫描的横坐标，避免音符 bug
        if(piece_x < width/2){
          board_x_start = piece_x
          board_x_end = width
        } else {
          board_x_start = 0
          board_x_end = piece_x
        }
        let cur_y = 0 // 记录本次循环最大值 用作下一次处理
        for(cur_y = Math.floor(height/3); cur_y < Math.floor(height*2/3); cur_y++) {
          let last_pixel0 = pixels.get(0, cur_y, 0);
          let last_pixel1 = pixels.get(0, cur_y, 1);
          let last_pixel2 = pixels.get(0, cur_y, 2);
          if (board_x || board_y) {
            break
          }
          board_x_sum = 0
          board_x_c = 0
          for(let x = Math.floor(board_x_start); x < Math.floor(board_x_end);x++) {
            let pixel0 = pixels.get(x, cur_y, 0),
                pixel1 = pixels.get(x, cur_y, 1),
                pixel2 = pixels.get(x, cur_y, 2);
            // 修掉脑袋比下一个小格子还高的情况的 bug
            if (Math.abs(x - piece_x) < (47 || config.piece_body_width)) {
              continue
            }
            // 修掉圆顶的时候一条线导致的小 bug，这个颜色判断应该 OK，暂时不提出来
            if (Math.abs(pixel0 - last_pixel0) + Math.abs(pixel1 - last_pixel1) + Math.abs(pixel2 - last_pixel2) > 10){
              board_x_sum += x
              board_x_c += 1
            }

          }
          if (board_x_sum) {
            board_x = board_x_sum / board_x_c
          }
        }
        let last_pixel0 = pixels.get(board_x, cur_y, 0);
        let last_pixel1 = pixels.get(board_x, cur_y, 1);
        let last_pixel2 = pixels.get(board_x, cur_y, 2);
        // 从上顶点往下 +274 的位置开始向上找颜色与上顶点一样的点，为下顶点
        // 该方法对所有纯色平面和部分非纯色平面有效，对高尔夫草坪面、木纹桌面、药瓶和非菱形的碟机（好像是）会判断错误
        let down_y = 0
        for(down_y = cur_y + 274; down_y > cur_y; down_y--) {
          let pixel0 = pixels.get(board_x, down_y, 0),
            pixel1 = pixels.get(board_x, down_y, 1),
            pixel2 = pixels.get(board_x, down_y, 2);
          if(Math.abs(pixel0 - last_pixel0) + Math.abs(pixel1 - last_pixel1) + Math.abs(pixel2 - last_pixel2) < 10){
            break
          }
        }
        board_y = Math.floor((cur_y + down_y) / 2)
        // 如果上一跳命中中间，则下个目标中心会出现 r245 g245 b245 的点，利用这个属性弥补上一段代码可能存在的判断错误
        // 若上一跳由于某种原因没有跳到正中间，而下一跳恰好有无法正确识别花纹，则有可能游戏失败，由于花纹面积通常比较大，失败概率较低
        for(let i = cur_y; i < cur_y + 200; i++) {
          let pixel0 = pixels.get(board_x, i, 0),
            pixel1 = pixels.get(board_x, i, 1),
            pixel2 = pixels.get(board_x, i, 2);
          if(Math.abs(pixel0 - 245) + Math.abs(pixel1 - 245) + Math.abs(pixel2 - 245) == 0) {
            board_y = i + 10
            break
          }
        }
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
    .tips{
      position: absolute;
      z-index: 999;
      width: 4px;
      height: 4px;
      background-color: red;
    }
  }
</style>
