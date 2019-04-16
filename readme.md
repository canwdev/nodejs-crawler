# nodejs-crawler

用来爬取网站图片

直接运行：`node index.js`

调试模式：`node --inspect-brk index.js`，执行完成后，打开Chrome随意一个页面的调试工具，可以看到一个绿色nodejs图标，点击进入调试

输出目录为`./output/`

# provider 文档

在`provider/`文件夹下，可以自定义需要爬的网站的脚本（js文件），目前仅支持列表到详情页的静态资源爬取


```js
// 定义配置，参考index.js
const config = {
}

/**
 * 处理列表数据
 * @param $     传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param data  要操作的数组，返回格式约定为{url,title,links(可选)}对象构成的数组，如果不传url，则links必传
 * pnMode说明：返回一个链接，指向上一页或下一页
 */
function getList($, data) {
}

/**
 * 获取图片下载链接数组
 * @param $   传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @returns {Array} 图片链接的数组
 */
function getImageUrlList($) {
}


module.exports = {
  config,
  listUrl: i => 'http://example.com/page/' + i,   // 返回第i页的地址
  getList,
  getImageUrlList
}
```