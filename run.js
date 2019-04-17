const Crawler = require('./index')
const provider = require('./providers/warthunderWallpaper')

new Crawler(provider).run()