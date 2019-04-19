const Crawler = require('./index')
let provider = null

// 接收命令行参数
const arg = process.argv[2]

if (arg) {
  provider = require(arg)
} else {
  provider = require('./providers/monkeyuser')
}

new Crawler(provider).run()