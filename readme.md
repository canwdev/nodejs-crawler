# nodejs-crawler

![logo](assets/logo.png)

简单的 Node.js 爬虫，用来爬取网站图片

食用方式：

```sh
npm install
npm run dev
```

直接运行：`node run.js`

带参数运行：`node run.js ./providers/warthunderWallpaper.js`

调试模式：建议直接使用vscode的调试功能，按`F5`，或者：`node --inspect-brk run.js`，执行完成后，打开Chrome任意页面的调试工具，可以看到一个绿色nodejs图标，点击进入调试

```js
const Crawler = require('./index')
const provider = require('./providers/monkeyuser')
new Crawler(provider).run()
```

默认输出目录为`./output/`

## provider 配置说明

`provider/`是爬虫处理的配置文件夹，包含了一些demo脚本，可以通过编写脚本实现针对特定网站的爬取，目前仅支持列表到详情页的静态资源爬取

```js
// 定义配置，参考index.js里面的注释
const options = {
}

/**
 * 处理列表页数据
 * @param $        传入的一个cheerio对象用于读取dom cheerio.load(res.text)；当ajaxMode开启时$为ajax返回的结果
 * @param data    要操作的数组，返回格式约定为{url,title,links(可选),customize(可选)}对象构成的数组，url是指向详情页的链接，title用来命名保存文件夹，如果不传url，则links必传
 * customize说明：高级功能，可在data中以放置一个包含自定义信息的customize对象，这样可以控制下载详情页的内容
 * pnMode说明：   返回一个链接，指向上一页或下一页
 */
function getList($, data) {
}

/**
 * 获取详情页图片下载链接数组
 * @param $           传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param extraData   当customize开启时，接收第二个参数extraData，为getList输出的customize对象
 * @returns {Array}   图片链接的数组；当customize开启时，返回自定义对象，用于customizeDownload
 */
function getDetailData($, extraData) {
}

/**
 * 可以通过这个函数完全控制下载以及文件保存
 * @param data      可下载的数据
 * @param downPath  下载文件保存的根目录
 * @param handleDownload  [可选] 可使用预置的下载方式
  */
async function customizeDownload(data, downPath, handleDownload) {

}


module.exports = {
  options,
  listUrl: i => 'http://example.com/page/' + i,   // 返回第i页的地址
  getList,
  getDetailData
}
```

## 参考

- [没想到你是这样的程序员（node.js 爬虫 萌新起步教程）](https://zhuanlan.zhihu.com/p/33722307)