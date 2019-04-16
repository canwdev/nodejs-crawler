const Crawler = require('./index')
const provider = require('./providers/ciyuandao')

new Crawler(provider).run()