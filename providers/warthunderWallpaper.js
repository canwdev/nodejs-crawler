const domain = 'https://warthunder.com'
const config = {
  outDir: 'output/wtw',
  fromPage: 1,
  toPage: 1,
  numberingFolder: true,
  numberingFile: true,
  proxy: 'http://127.0.0.1:1080',
}

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

function getImageUrlList($) {
  return null
}

module.exports = {
  config,
  listUrl: i => domain + '/en/media/wallpapers/page/' + i,
  getList,
  getImageUrlList
}