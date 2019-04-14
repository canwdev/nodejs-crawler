const domain = 'http://ciyuandao.com'

/**
 * 处理列表数据
 * @param $     传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param data  要操作的数组，返回格式约定为{url,title,author}对象构成的数组
 */
function handleList($, data) {
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
 * 处理图集数据
 * @param $     传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param fn    回调函数，用于下载单张图片
 * @param downPath  存放文件的完整路径
 * @returns {Promise<void>}
 */
async function handleImages($, fn, downPath) {
  let $imgWarps = $('.talk_pic p')

  for (let i = 0; i < $imgWarps.length; i++) {
    const imgUrl = $imgWarps.eq(i).find('img').attr('src')
    // console.log('     ', imgUrl)
    await fn(downPath, imgUrl, i + 1, $imgWarps.length)
  }
}


module.exports = {
  domain,
  listUrl: domain + '/photo/index/0-0-',
  handleList,
  handleImages
}