const defaults = require('superagent-defaults');
const request = defaults()
const cheerio = require('cheerio')
const fs = require('fs-extra')
const path = require('path')
const sanitize = require("sanitize-filename")
const Log2f = require('./assets/log2file')

const utils = require('./assets/utils')
// 自定义图片提供者，通过自定义provider实现从不同网站爬取的功能


// 设置fake UA
const userAgents = require('./assets/userAgents')

function randua() {
  return userAgents[parseInt(Math.random() * userAgents.length)]
}

request.set('User-Agent', randua())
const provider = require('./providers/ciyuandao')
let options = {
  outDir: 'output',
  fromPage: 1,
  toPage: 1,
  numberingFolder: false,
  numberingFile: false,
  ignoreExistsFolder: true
}
options = Object.assign(options, provider.config)
const OUT_DIR_PATH = path.join(__dirname, options.outDir)
let log2f = new Log2f(path.join(OUT_DIR_PATH + '/crawler.log'), true)

/**
 * 获取图集列表，返回包含图集信息对象的数组
 * @returns {Promise<Array>}
 */
async function getList() {
  // 如果不存在output文件夹则创建一个
  if (!fs.existsSync(OUT_DIR_PATH)) {
    fs.mkdirSync(OUT_DIR_PATH);
    log2f.log('[创建DIR] ' + OUT_DIR_PATH)
  }

  let ret = []
  // TODO: 新增providers规范说明文档，移除不必要注释

  log2f.log('=== 🚧 列表请求开始 🚧 ===')

  for (let i = options.fromPage; i <= options.toPage; i++) {
    log2f.log(`[${i}/${options.toPage}][请求列表]`, provider.listUrl(i))
    const res = await request.get(provider.listUrl(i)).catch(err => {
      log2f.log('请求列表失败', err.message)  //, err.response
    })

    if (res) {
      const $ = cheerio.load(res.text)
      provider.getList($, ret)
    } else {
      ret.push({})
    }

  }

  log2f.log('=== 🚧 列表请求完成 🚧 ===\n')

  Log2f.slog(JSON.stringify(ret), path.join(OUT_DIR_PATH + '/resource.log'))

  return ret
}

/**
 * 获取单个图集内的所有图片，创建下载文件夹并下载
 * @param obj
 * @param curIndex    可选，用于显示当前下载个数
 * @param allLength   可选，用于显示全部文件数量
 * @returns {Promise<void>}
 */
async function getFiles(obj, curIndex, allLength) {
  let currentTip = ''
  if (curIndex && allLength) {
    currentTip = `[${curIndex}/${allLength}]`
  }

  if (Object.keys(obj).length === 0) {
    log2f.log(currentTip + ' 内容为空，跳过')
    return
  }

  // 下载文件夹标号
  let folderNumber = options.numberingFolder ? curIndex.toString().padStart(3, '0') : ''
  // 要下载的文件链接数组
  let fileUrlList = []

  // 如果具有子页面链接
  if (obj.url) {
    const res = await request.get(obj.url)
    const $ = cheerio.load(res.text)
    fileUrlList = provider.getImageUrlList($)
  } else {
    fileUrlList = obj.links
  }


  const folderName = sanitize(`${folderNumber}__${obj.title}`, {replacement: ' '})
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

  for (let i = 0; i < fileUrlList.length; i++) {
    await download(downPath, fileUrlList[i], i + 1, fileUrlList.length)
  }


  let waitTime = utils.random(500, 2000)
  log2f.log(currentTip + '[列表文件下载完成，等待(ms)] ', waitTime)
  await utils.sleep(waitTime)
}

/**
 * 下载单张图片
 * @param dir 保存路径
 * @param url  原图地址
 * @param curIndex    可选，保存文件的编号
 * @param allLength   可选，用于显示全部文件数量
 * @param asyncFlag 是否开启异步下载，默认否
 */
async function download(dir, url, curIndex, allLength, asyncFlag = false) {
  let currentTip = ''
  if (curIndex && allLength) {
    currentTip = `[${curIndex}/${allLength}]`
  }
  // 去除无用后缀（原图）
  url = url.split('?')[0]

  let fileName = url.split('/').pop()
  if (options.numberingFile && curIndex) {
    fileName = curIndex.toString().padStart(3, '0') + '.' + fileName
  }

  const savePath = path.join(dir, fileName)
  if (fs.existsSync(savePath)) {
    log2f.log(currentTip + '[文件已存在，跳过] ' + savePath)
    return
  }

  let stream = fs.createWriteStream(savePath)

  if (asyncFlag) {
    // 异步下载
    // TODO: 完善异步下载
    log2f.log(currentTip + '[下载中] ' + url)
    stream.on('finish', () => {
      // log2f.log(currentTip + '[已下载] ')
      resolve()
    })
    stream.on('error', (err) => {
      log2f.log(currentTip + '[文件保存错误]', err)
      debugger
      reject()
    })
    const res = request.get(url).pipe(stream)
    await sleep(random(0, 500))
  } else {
    log2f.log(currentTip + '[下载中] ' + url)
    await new Promise((resolve, reject) => {
      let req = request.get(url)
        .retry(2)
        .accept('image/jpeg')
        .timeout({
          response: 5000,  // Wait 5 seconds for the server to start sending,
          deadline: 120000, // but allow 2 minute for the file to finish loading.
        })
        // .catch(err => {
        //   log2f.log('[下载失败]', err.message) //, err.response
        //   debugger
        //   reject()
        // })
        .pipe(stream)
      // TODO: 修复下载失败闪退，如果必要，使用download库进行（多线程？）下载

      stream.on('finish', () => {
        // log2f.log('[已下载]')
        resolve()
      })
      stream.on('error', (err) => {
        log2f.log(currentTip + '[文件保存错误]', err)
        debugger
        reject()
      })
    })
  }
}

async function init() {
  let list = await getList()
  for (let i = 0; i < list.length; i++) {
    await getFiles(list[i], i + 1, list.length)
  }
  log2f.log('👍全部下载完成！🎉🎉')
}

init()