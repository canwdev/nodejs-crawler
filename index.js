// superagent 是方便的客户端请求代理模块
const defaults = require('superagent-defaults');
const request = defaults()

// 设置fake UA
// TODO: 验证每次请求的fakeUA是否相同
const userAgents = require('./assets/userAgents')

function randua() {
  return userAgents[parseInt(Math.random() * userAgents.length)]
}

request.set('User-Agent', randua())

// 为服务器特别定制的，类似jQuery的实现
const cheerio = require('cheerio')
// 丰富了fs模块，同时支持async/await
const fs = require('fs-extra')
const path = require('path')
// 净化文件名
const sanitize = require("sanitize-filename")

const utils = require('./assets/utils')
// 自定义图片提供者，通过自定义provider实现从不同网站爬取的功能
const provider = require('./providers/warthunderWallpaper')

/**
 * 获取图集列表，返回包含图集信息对象的数组
 * @returns {Promise<Array>}
 */
async function getList() {
  const PAGE = 12
  const INIT_PAGE = 1
  let ret = []

  // TODO: 修复PAGE超出闪退
  // TODO: 增加自定义PAGE、INIT_PAGE、IGNORE_PAGE
  // TODO: 优化Windows下显示表情为方块？
  // TODO: 新增providers规范说明文档，移除不必要注释

  console.log('=== 🚧 列表请求开始 🚧 ===')

  for (let i = INIT_PAGE; i <= PAGE; i++) {
    // TODO: 增加count
    console.log('✔请求页面：', provider.listUrl(i))
    const res = await request.get(provider.listUrl(i)).catch(err => {
      console.error(err.message, err.response)
    })
    const $ = cheerio.load(res.text)

    provider.getList($, ret)
  }

  console.log('=== 🚧 列表请求完成 🚧 ===\n')
  console.log(ret)
  return ret
}

/**
 * 获取单个图集内的所有图片，创建下载文件夹并下载
 * @param obj
 * @param curIndex    可选，用于显示当前下载个数
 * @param allLength   可选，用于显示全部文件数量
 * @returns {Promise<void>}
 */
async function getPic(obj, curIndex, allLength) {
  let currentTip = ''
  if (curIndex && allLength) {
    currentTip = `[${curIndex}/${allLength}]`
  }
  const outputDirName = 'output'
  const outputDirPath = path.join(__dirname, outputDirName)
  // 下载文件夹标号
  let imgId = curIndex.toString().padStart(3, '0')
  // 要下载的文件链接数组
  let imgUrlList = []

  // 如果具有子页面链接
  if (obj.url) {
    const res = await request.get(provider.domain + obj.url)
    const $ = cheerio.load(res.text)
    imgUrlList = provider.getImageUrlList($)
  } else {
    imgUrlList = obj.links
  }


  const folderName = sanitize(`${imgId}__${obj.title}`, {replacement: ' '})
  const downPath = path.join(outputDirPath, folderName)

  // 如果不存在output文件夹则创建一个
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath);
    console.log(currentTip + '[✨创建DIR] ' + outputDirPath)
  }
  if (!fs.existsSync(downPath)) {
    await fs.mkdir(downPath)
    console.log(currentTip + '[✨创建DIR] ' + downPath)
  } else {
    // TODO: 增加如果存在文件夹，检测内部文件是否存在，然后跳过文件，加个开关
    console.log(currentTip + '[⛔已存在DIR，跳过] ' + downPath)
    return
  }

  for (let i = 0; i < imgUrlList.length; i++) {
    await download(downPath, imgUrlList[i], i + 1, imgUrlList.length)
  }


  let waitTime = utils.random(200, 1200)
  console.log('[🕑getPic阶段完成，等待(ms)] ', waitTime)
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
  if (curIndex) {
    fileName = curIndex.toString().padStart(3, '0') + '.' + fileName
  }

  const savePath = path.join(dir, fileName)
  let stream = fs.createWriteStream(savePath)

  if (asyncFlag) {
    // 异步下载
    // TODO: 完善异步下载
    console.log(currentTip + '[🚀下载中] ' + savePath)
    stream.on('finish', () => {
      // console.log(currentTip + '[已下载] ')
      resolve()
    })
    stream.on('error', (err) => {
      console.error(currentTip + '[❌文件保存错误]', err)
      debugger
      reject()
    })
    const res = request.get(url).pipe(stream)
    await sleep(random(0, 500))
  } else {
    console.log(currentTip + '[🚀下载中] ' + savePath)
    await new Promise((resolve, reject) => {
      let req = request.get(url)
        .retry(2)
        .accept('image/jpeg')
        .timeout({
          response: 5000,  // Wait 5 seconds for the server to start sending,
          deadline: 120000, // but allow 2 minute for the file to finish loading.
        })
        // .catch(err => {
        //   console.error('[❌下载失败]', err.message) //, err.response
        //   debugger
        //   reject()
        // })
        .pipe(stream)
        // TODO: 修复下载失败闪退，如果必要，使用download库进行（多线程？）下载

      stream.on('finish', () => {
        // console.log('[已下载]')
        resolve()
      })
      stream.on('error', (err) => {
        console.error(currentTip + '[❌文件保存错误]', err)
        debugger
        reject()
      })
    })
  }
}

async function init() {
  let list = await getList()
  for (let i = 0; i < list.length; i++) {
    await getPic(list[i], i + 1, list.length)
  }
  console.log('👍✨全部下载完成！🎉🎉')
}

init()