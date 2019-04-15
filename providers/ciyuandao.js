const domain = 'http://ciyuandao.com'
const config = {
  outDir: 'output',
  fromPage: 30,
  toPage: 31,
  numberingFolder: true,
  numberingFile: true,
}

/**
 * 处理列表数据
 * @param $     传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param data  要操作的数组，返回格式约定为{url,title}对象构成的数组
 */
function getList($, data) {
  $('.pics li').each((index, el) => {
    const url = domain + $(el).find('>a').attr('href')
    const mid = url.substring(url.lastIndexOf('/') + 1)
    const title = $(el).find('p').eq(0).text().trim()
    const author = $(el).find('p').eq(1).text().trim()
    data.push({
      url,
      title: mid + '__' + author + '__' + title
    })
  })
}

/**
 * 获取图片下载链接数组
 * @param $   传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @returns {Array} 图片链接的数组
 */
function getImageUrlList($) {
  let $imgWarps = $('.talk_pic p')
  let ret = []

  for (let i = 0; i < $imgWarps.length; i++) {
    ret.push($imgWarps.eq(i).find('img').attr('src'))
  }
  return ret
}


module.exports = {
  config,
  listUrl: i => domain + '/photo/index/0-0-' + i,
  getList,
  getImageUrlList
}