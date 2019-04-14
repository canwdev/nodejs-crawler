// superagent 是方便的客户端请求代理模块
const defaults = require('superagent-defaults');
const request = defaults()

// 设置fake ua
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
const sanitize = require("sanitize-filename");

const utils = require('./assets/utils')


const domain = 'http://ciyuandao.com'
const listUrl = domain + '/photo/index/0-0-'

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

  console.log('--- 列表请求开始 ---')

  for (let i = 1; i <= PAGE; i++) {
    console.log('请求页面：', listUrl + i)
    const res = await request.get(listUrl + i).catch(err => {
      console.error(err.message, err.response)
    })
    const $ = cheerio.load(res.text)
    $('.pics li').each((index, el) => {
      const url = $(el).find('>a').attr('href')
      const title = $(el).find('p').eq(0).text().trim()
      const author = $(el).find('p').eq(1).text().trim()
      ret.push({
        url,
        title,
        author
      })
    })
  }

  console.log('--- 列表请求完成 ---\n')
  return ret
}

/**
 * 获取单个图集内的所有图片，创建下载文件夹并下载
 * @param obj
 * @returns {Promise<void>}
 */
async function getPic(obj) {
  const outputDirName = 'output'
  const outputDirPath = path.join(__dirname, outputDirName)
  const res = await request.get(domain + obj.url)
  const $ = cheerio.load(res.text)

  const imgId = obj.url.substring(obj.url.lastIndexOf('/') + 1)
  const folderName = sanitize(`${imgId}__${obj.author}__${obj.title}`, {replacement: ' '})
  const downPath = path.join(outputDirPath, folderName)

  // 如果不存在output文件夹则创建一个
  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath);
    console.log('[创建DIR] ' + outputDirPath)
  }
  if (!fs.existsSync(downPath)) {
    await fs.mkdir(downPath)
    console.log('[创建DIR] ' + downPath)
  } else {
    console.log('[已存在DIR] ' + downPath)
    console.log('跳过这个文件夹...')
    return
  }

  // if (imgId !== '11856') {
  //   console.log(imgId+'，跳过')
  //   return
  // }
  let $imgWarps = $('.talk_pic p')

  for (let i = 0; i < $imgWarps.length; i++) {
    const imgUrl = $imgWarps.eq(i).find('img').attr('src')
    // console.log('     ', imgUrl)
    await download(downPath, imgUrl, i + 1)
  }

  let waitTime = utils.random(200, 1200)
  console.log('[等待(ms)] ', waitTime)
  await utils.sleep(waitTime)
}

/**
 * 下载单张图片
 * @param dir 保存路径
 * @param url  原图地址
 * @param index 保存文件的编号（可选）
 * @param asyncFlag 是否开启异步下载，默认否
 */
async function download(dir, url, index, asyncFlag = false) {
  // 去除无用后缀（原图）
  url = url.split('?')[0]

  let fileName = url.split('/').pop()
  if (index) {
    fileName = index.toString().padStart(3, '0') + '.' + fileName
  }

  const savePath = path.join(dir, fileName)
  let stream = fs.createWriteStream(savePath)
  stream.on('finish', () => {
    console.log('[已下载] ' + savePath)
  })

  if (asyncFlag) {
    // 使用pipe异步下载
    const req = request.get(url).binaryType(true)
    req.pipe(stream)

    // await sleep(random(0, 500))
  } else {
    const req = await request.get(url).catch(err => {
      console.error('[ERR]', err.message) //, err.response
      // debugger
    })
    if (req) {
      stream.write(req.body)
      console.log('[已下载] ' + savePath)
    } else {
      console.error('[下载失败]', savePath)
    }

  }
}

async function init() {
  let list = await getList()
  for (let item of list) {
    await getPic(item)
  }
}

init()