const domain = 'https://www.monkeyuser.com'
const options = {
  outDir: 'output/monkeyuser',
  fromPage: 1,
  toPage: 5,
  flatFolder: 'monkeyuser',
  pnMode: true,
  numberingFile: false,
  // proxy: 'socks5://127.0.0.1:1080',
}


function getList($, data) {
  let newUrl = domain + $('.thumb.prev.nobefore a').attr('href')
  let img = $('.content img').attr('src')
  let title = $('title').text()

  console.log(img, title, newUrl)

  data.push({
    url: null,
    title: title,
    links: [img]
  })
  return newUrl
}

function getImageUrlList($) {
  return null
}

module.exports = {
  options,
  listUrl: () => domain + '',
  getList,
  getImageUrlList
}