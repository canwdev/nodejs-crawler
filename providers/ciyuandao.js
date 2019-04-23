const domain = 'http://ciyuandao.com'
const options = {
  outDir: 'output/cos',
  fromPage: 1,
  toPage: 1,
  numberingFolder: false,
  numberingFile: false,
}

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

function getDetailData($) {
  let $imgWarps = $('.talk_pic p')
  let ret = []

  for (let i = 0; i < $imgWarps.length; i++) {
    ret.push($imgWarps.eq(i).find('img').attr('src'))
  }
  return ret
}


module.exports = {
  options,
  listUrl: i => domain + '/photo/index/0-0-' + i,
  getList,
  getDetailData
}