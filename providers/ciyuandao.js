const domain = 'http://ciyuandao.com'

/**
 * 处理列表数据
 * @param $     传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param data  要操作的数组，返回格式约定为{url,title,author}对象构成的数组
 */
function getList($, data) {
  $('.pics li').each((index, el) => {
    const url = $(el).find('>a').attr('href')
    const title = $(el).find('p').eq(0).text().trim()
    const author = $(el).find('p').eq(1).text().trim()
    data.push({
      url,
      title,
      author
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
  domain,
  listUrl: domain + '/photo/index/0-0-',
  getList,
  getImageUrlList
}