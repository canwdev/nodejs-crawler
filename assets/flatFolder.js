// 将当前文件夹内的内容重命名，并平铺放置到外部
const fs = require('fs')
const path = require('path')

const outputFolderName = '__output'
const rootPath = __dirname
const outDirPath = path.join(__dirname, outputFolderName)
let dirs = fs.readdirSync(rootPath)

if (!fs.existsSync(outDirPath)) fs.mkdirSync(outDirPath)

// console.log(dirs)
// 遍历文件夹
dirs.forEach((dirname) => {
  // console.log(dirname)
  let curFolderPath = path.join(rootPath, dirname)
  if (fs.statSync(curFolderPath).isDirectory() && dirname !== outputFolderName) {
    let files = fs.readdirSync(curFolderPath)
    // console.log(files)

    files.forEach((filename, i) => {
      let newFilename = null
      if (files.length > 1) {
        newFilename = dirname + '(' + i + ').' + filename.split('.').pop()
      } else {
        newFilename = dirname + '.' + filename.split('.').pop()
      }
      fs.renameSync(path.join(curFolderPath, filename), path.join(outDirPath, newFilename))
    })
    fs.rmdirSync(curFolderPath)
  }
})