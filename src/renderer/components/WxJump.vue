<template>
  
</template>
<script>
  // const Images = require('images')
  import ImageMagick from 'imagemagick'
  import Shell from 'shelljs'
  import GetPixels from 'get-pixels'
  import { PHONE_SETTING }  from '@/config'
  const Image = {}
  export default {
    data () {
      return {}
    },
    methods: {
      getCenterPoint () {
        GetPixels(LOCAL_IMG_PATH + IMG_NAME, function(err, pixels) {
          if(err) {
            console.log("Bad image path")
            return
          }
          let data = find_poit(pixels, img)
          callback(data)
        })
      },
      findPoint () {
        let piece_x_sum = 0,
            piece_x_c = 0,
            piece_y_max = 0,
            board_x = 0,
            board_y = 0;
        let { width, height } = img.size()
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
        piece_x = piece_x_sum / piece_x_c;
        piece_y = piece_y_max - 20;  // 上移棋子底盘高度的一半


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
          board_x_sum = 0
          board_x_c = 0
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
          console.info('>>>>>>>>>>>截取图片')
          Shell.exec(`adb shell screencap -p /sdcard/${IMG_NAME}`, () => {
            console.info('>>>>>>>>>>>上传图片')
            Shell.exec(`adb pull /sdcard/${IMG_NAME}`, () => {
              console.info('>>>>>>>>>>>图片上传完成')
              resolve()
            })
          })
        })
      },
      // 获取安卓分辨率
      getAndroidScreen () {
        return new Promise((resolve, reject) => {
          Shell.exec('adb shell "dumpsys window | grep mUnrestrictedScreen"', function (code, stdout, stderr) {
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
      androidJump () {
        this.getAndroidScreen().then(({x, y}) => {
          let config = {}
          press_time = distance * config.press_radio
          press_time = press_time > 200 ? press_time : 200
          press_time = ~~press_time
          // TODO: 坐标根据截图的 size 来计算
          let { x1, x2, y1, y2 } = config.swipe
          let cmd = `adb shell input swipe ${x1} ${y1} ${x2} ${y2} ${press_time}`
          console.info(`>>>>>>>>>>>>>>>${cmd}`)
          shell.exec(cmd)
        })
      },
      wxJump () {
        this.upLoadImg().then(() => {
          let curImg = ImageMagick(LOCAL_IMG_PATH + IMG_NAME)
          get_center_point(curImg, ([piece_x, piece_y, board_x, board_y]) => {
            console.log(piece_x, piece_y, board_x, board_x)
            androidJump(Math.sqrt(Math.abs(board_x - piece_x) ** 2 + Math.abs(board_y - piece_y) ** 2))
            setTimeout(() => {
              init(img)
            }, 3500)
          })
        })
      }
    }
  }
</script>

