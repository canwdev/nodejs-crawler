const request = require('superagent')
// 设置代理
require('superagent-proxy')(request)
const cheerio = require('cheerio')
const fs = require('fs-extra')
const path = require('path')
const sanitize = require('sanitize-filename')
const download = require('download')

const Log2f = require('./assets/log2file')
const utils = require('./assets/utils')
const userAgents = require('./assets/userAgents')

// const provider = require('./providers/monkeyuser')
let provider = {}
let options = {
  outDir: 'output',             // 输出根文件夹（相对当前路径）
  fromPage: 1,                  // 爬取开始页面下标
  toPage: 1,                    // 爬取结束页面下标
  pnMode: false,                // 上一页(previous)/下一页(next)模式
  numberingFolder: false,       // 用数字编号文件夹
  numberingFile: false,         // 用数字编号文件
  ignoreExistsFolder: true,     // 跳过已存在的文件夹
  concurrentDownload: true,     // 开启并发下载
  proxy: null,                  // 是否使用代理，http://127.0.0.1:1080
  header: {                     // 定义请求头部
    "User-Agent": userAgents.default,
  }
}
let log2f = null
let OUT_DIR_PATH = ''

// TODO 尝试增加页面通过ajax获取数据的抓取模式
class Crawler {
  constructor(prov) {
    // 自定义provider，实现从不同网站爬取数据
    provider = prov
    options = Object.assign(options, provider.options)
    OUT_DIR_PATH = path.join(__dirname, options.outDir)
    log2f = new Log2f(path.join(OUT_DIR_PATH + '/crawler.log'), true)
  }

  /**
   * 获取图集列表，返回包含图集信息对象的数组
   * @returns {Promise<Array>}
   */
  async getList() {
    let ret = []

    log2f.log('=== 🚧 获取列表开始 🚧 ===')

    let url = ''
    for (let i = options.fromPage; i <= options.toPage; i++) {
      if (options.pnMode) {
        // pnMode
        if (url === '') {
          // 获取第一页链接（仅一第次）
          url = provider.listUrl()
        }
      } else {
        // 正常模式
        url = provider.listUrl(i)
      }

      log2f.log(`[${i}/${options.toPage}][请求列表] `, url)

      // TODO 使用PhantomJS实现模拟浏览器请求，解决某站301错误
      const res = await request
        .get(url)
        .set(options.header)
        .proxy(options.proxy)
        .catch(err => {
          log2f.log(`[${i}/${options.toPage}][请求列表失败] `, err.message, err.response)  //, err.response
          debugger
        })

      if (res) {
        const $ = cheerio.load(res.text)
        // 仅当pnMode开启才有newUrl
        let newUrl = provider.getList($, ret)
        if (newUrl && options.pnMode) {
          url = newUrl
        }
      } else {
        ret.push({})
      }

    }


    Log2f.slog(JSON.stringify(ret), path.join(OUT_DIR_PATH + '/resource.log'))
    log2f.log('=== 🚧 列表获取完成 🚧 ===\n')

    return ret
  }

  /**
   * 获取单个图集内的所有图片，创建下载文件夹并下载
   * @param obj
   * @param curIndex    可选，用于显示当前下载个数
   * @param allLength   可选，用于显示全部文件数量
   * @returns {Promise<void>}
   */
  async getFiles(obj, curIndex, allLength) {
    let currentTip = ''
    if (curIndex && allLength) {
      currentTip = `[${curIndex}/${allLength}]`
    }

    if (Object.keys(obj).length === 0) {
      log2f.log(currentTip + ' 内容为空，跳过')
      return
    }

    // 下载文件夹标号
    let folderNumber = options.numberingFolder ? curIndex.toString().padStart(3, '0') + '__' : ''
    // 要下载的文件链接数组
    let fileUrlList = []

    // 如果具有子页面链接
    if (obj.url) {
      const res = await request
        .get(obj.url)
        .set(options.header)
        .proxy(options.proxy)
        .catch(err => {
          log2f.log(currentTip + '[内容获取失败]', err.message, err.response)  //, err.response
          debugger
        })
      const $ = cheerio.load(res.text)
      fileUrlList = provider.getImageUrlList($)
    } else {
      fileUrlList = obj.links
    }


    const folderName = sanitize(`${folderNumber}${obj.title}`, {replacement: ' '})
    const downPath = path.join(OUT_DIR_PATH, folderName)

    if (!fs.existsSync(downPath)) {
      await fs.mkdir(downPath)
      log2f.log(currentTip + '[创建DIR] ' + downPath)
    } else {
      if (this.ignoreExistsFolder) {
        log2f.log(currentTip + '[已存在DIR，跳过] ' + downPath)
        return
      } else {
        log2f.log(currentTip + '[已存在DIR] ' + downPath)
      }
    }

    const fileCount = fileUrlList.length

    // 如果是pnMode，则每页只包含一张图片所以直接并发下载
    if (options.pnMode && options.concurrentDownload) {
      this.handleDownload(fileUrlList[0], downPath, curIndex, allLength)

      let waitTime = utils.random(10, 500)
      // log2f.log(currentTip + '[并发限制等待(ms)] ', waitTime)
      await utils.sleep(waitTime)
      return
    }

    if (options.concurrentDownload) {
      let promises = []
      for (let i = 0; i < fileCount; i++) {
        promises.push(this.handleDownload(fileUrlList[i], downPath, i + 1, fileCount))

        if (i < fileCount - 1) {
          let waitTime = utils.random(10, 500)
          // log2f.log(currentTip + '[并发限制等待(ms)] ', waitTime)
          await utils.sleep(waitTime)
        }

      }
      await Promise.all(promises)
    } else {
      for (let i = 0; i < fileCount; i++) {
        await this.handleDownload(fileUrlList[i], downPath, i + 1, fileCount)
      }
    }


    let waitTime = utils.random(500, 2000)
    log2f.log(currentTip + '[列表文件下载完成，等待(ms)] ', waitTime)
    await utils.sleep(waitTime)
  }

  /**
   * 下载单张图片
   * @param url         原图地址
   * @param dir         保存路径
   * @param curIndex    可选，保存文件的编号
   * @param allLength   可选，用于显示全部文件数量
   */
  async handleDownload(url, dir, curIndex, allLength) {
    // TODO: 显示下载进度条？
    let currentTip = ''
    if (curIndex && allLength) {
      currentTip = `[${curIndex}/${allLength}]`
    }
    // 去除无用后缀（原图）
    if (url) {
      url = url.split('?')[0]
    } else {
      log2f.log(currentTip + '[下载失败，无效的链接]')
      return
    }


    let fileName = url.split('/').pop()
    if (options.numberingFile && curIndex) {
      fileName = curIndex.toString().padStart(3, '0') + '.' + fileName
    }

    const savePath = path.join(dir, fileName)
    if (fs.existsSync(savePath)) {
      log2f.log(currentTip + '[文件已存在，跳过] ' + savePath)
      return
    }

    log2f.log(currentTip + '[下载中] ' + url)

    await new Promise((resolve, reject) => {

      download(url, dir, {
        filename: fileName,
        proxy: options.proxy
      }).then(() => {
        log2f.log(currentTip + '[已下载] ' + savePath)
        resolve()
      }).catch(err => {
        log2f.log(currentTip + '[下载失败] ', err.message, err.response)
        debugger
        reject()
      })

    })

  }

  async run() {

    // 如果不存在output文件夹则创建一个
    if (!fs.existsSync(OUT_DIR_PATH)) {
      fs.mkdirSync(OUT_DIR_PATH)
      log2f.log('[创建DIR] ' + OUT_DIR_PATH)
    }

    if (options.proxy) {
      log2f.log('[使用代理] ' + options.proxy)
    }


    let list = await this.getList()
    for (let i = 0; i < list.length; i++) {
      await this.getFiles(list[i], i + 1, list.length)
    }
    if (options.pnMode && options.concurrentDownload) {
      log2f.log('=== 执行完成，请等待异步任务结束 ===\n')
    } else {
      log2f.log('=== 全部下载完成! ===\n')

    }
  }
}

module.exports = Crawler