# nodejs-crawler

用来爬取网站图片

直接运行：`node index.js`

调试模式：`node --inspect-brk index.js`，执行完成后，打开Chrome随意一个页面的调试工具，可以看到一个绿色nodejs图标，点击进入调试

输出目录为`./output/`

# provider 文档

在`provider/`文件夹下，可以自定义需要爬的网站的脚本，目前仅支持列表到详情页的静态资源爬取

