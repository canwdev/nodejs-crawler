// superagent 是方便的客户端请求代理模块
const request = require('superagent')
// 为服务器特别定制的，类似jQuery的实现
const cheerio = require('cheerio')
// 丰富了fs模块，同时支持async/await
const fs = require('fs-extra')

let url = 'http://ciyuandao.com/photo/index/0-0-'

// request.get(url+1).then((res)=>{
//   console.log(res.text)
// })



async function getUrl() {
  const PAGE = 3
  let ret = []
  for (let i = 1; i <= PAGE; i++) {
    console.log('请求页面：', url + i)
    const res = await request.get(url + i)
    const $ = cheerio.load(res.text)
    $('.pics li').each((index, el) => {
      const href = $(el).find('>a').attr('href')
      const title = $(el).find('p').eq(0).text().trim()
      const author = $(el).find('p').eq(1).text().trim()
      ret.push({
        href,
        title,
        author
      })
    })
  }

  console.log(ret)
  return ret
}

getUrl()