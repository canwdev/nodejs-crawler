const Crawler = require('./index')
const provider = require('./providers/monkeyuser')

new Crawler(provider).run()