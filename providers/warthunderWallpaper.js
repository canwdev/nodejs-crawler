const domain = 'https://warthunder.com'
const config = {
  outDir: 'output_wt',
  fromPage: 1,
  toPage: 1,
  numberingFolder: true,
  numberingFile: true,
}

/**
 * 处理列表数据
 * @param $     传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param data  要操作的数组，返回格式约定为{url,title,links(可选)}对象构成的数组，如果不传url，则links必传
 */
function getList($, data) {
  $('.wallpapers .wallpapers__item').each((index, el) => {
    let smallSrc = $(el).find('.wallpapers__image img').attr('src')
    let title = smallSrc.split('/').pop().split('.').shift()
    let links = []

    $(el).find('.wallpapers__dimensions a').each((i, el) => {
      links.push('http:' + $(el).attr('href'))
    })

    data.push({
      url: null,
      title,
      links
    })
  })
}

/**
 * 获取图片下载链接数组
 * @param $   传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @returns {Array} 图片链接的数组
 */
function getImageUrlList($) {
  return null
}


module.exports = {
  config,
  listUrl: i => domain + '/en/media/wallpapers/page/' + i,
  getList,
  getImageUrlList
}