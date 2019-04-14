// superagent 是方便的客户端请求代理模块
const defaults = require('superagent-defaults');
const request = defaults()

// 设置fake UA
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
// 自定义图片提供者
const provider = require('./providers/ciyuandao')

// request.get(url+1).then((res)=>{
//   console.log(res.text)
// })

/**
 * 获取图集列表，返回包含图集信息对象的数组
 * @returns {Promise<Array>}
 */
async function getList() {
  const PAGE = 1
  let ret = []

  console.log('=== 🚧 列表请求开始 🚧 ===')

  for (let i = 1; i <= PAGE; i++) {
    console.log('✔请求页面：', provider.listUrl + i)
    const res = await request.get(provider.listUrl + i).catch(err => {
      console.error(err.message, err.response)
    })
    const $ = cheerio.load(res.text)

    provider.getList($, ret)
  }

  console.log('=== 🚧 列表请求完成 🚧 ===\n')
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
  const res = await request.get(provider.domain + obj.url)
  const $ = cheerio.load(res.text)

  const imgId = obj.url.substring(obj.url.lastIndexOf('/') + 1)
  const folderName = sanitize(`${imgId}__${obj.author}__${obj.title}`, {replacement: ' '})
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
    console.log(currentTip + '[⛔已存在DIR，跳过] ' + downPath)
    return
  }

  let imgUrlList = provider.getImageUrlList($)

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
      request.get(url).pipe(stream)

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