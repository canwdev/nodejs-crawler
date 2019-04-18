# nodejs-crawler

简单的 Node.js 爬虫，用来爬取网站图片

食用方式：

```js
npm install
npm run dev
```

直接运行：`node run.js`

调试模式：`node --inspect-brk run.js`，执行完成后，打开Chrome随意一个页面的调试工具，可以看到一个绿色nodejs图标，点击进入调试

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
 * 处理列表数据
 * @param $     传入的一个cheerio对象用于读取dom cheerio.load(res.text)
 * @param data  要操作的数组，返回格式约定为{url,title,links(可选)}对象构成的数组，如果不传url，则links必传
 * pnMode说明：  返回一个链接，指向上一页或下一页
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
  options,
  listUrl: i => 'http://example.com/page/' + i,   // 返回第i页的地址
  getList,
  getImageUrlList
}
```

## 参考

- [没想到你是这样的程序员（node.js 爬虫 萌新起步教程）](https://zhuanlan.zhihu.com/p/33722307)