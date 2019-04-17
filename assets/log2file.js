/**
 * Modified from log-to-file
 */

// Import.
const fs = require('fs')

/**
 * Append zero to length.
 * @param {string} value Value to append zero.
 * @param {number} length Needed length.
 * @returns {string} String with appended zeros id need it.
 */
function appendZeroToLength(value, length) {
  return `${value}`.padStart(length, 0)
}

/**
 * Get date as text.
 * @returns {string} Date as text. Sample: "2018.12.03, 07:32:13.0162 UTC".
 */
function getDateAsText() {
  var currentDate = new Date()
  return "[" + currentDate.getFullYear() + "-"
    + (currentDate.getMonth() + 1) + "-"
    + currentDate.getDate() + " "
    + currentDate.getHours().toString().padStart(2,'0') + ":"
    + currentDate.getMinutes().toString().padStart(2,'0') + ":"
    + currentDate.getSeconds() + "]"
}

/**
 * Log to file.
 * @param {string} text Text to log.
 * @param {string} [file] Log file path.
 */
function logToFile(text, file) {
  // Define file name.
  const filename = file ? file : 'default.log'

  // Define log text.
  const logText = getDateAsText() + '' + text + '\r\n'

  // Save log to file.
  fs.appendFile(filename, logText, 'utf8', function (error) {
    if (error) {
      // If error - show in console.
      console.log(getDateAsText() + ' -> ' + error)
    }
  })
}

class Log2f {
  /**
   * 打印到文件Log2f构造器
   * @param path    目标文件路径
   * @param print   是否同时输出到console
   */
  constructor(path, print = true) {
    this.path = path
    this.print = print
  }

  log(...text) {
    if (this.print) {
      console.log(...text)
    }
    let str = ''
    let args = [...text]
    args.forEach((v, i) => {
      str += typeof v === 'object' ? JSON.stringify(v) : v
    })
    logToFile(str, this.path)
  }

  static slog(...args) {
    logToFile(...args)
  }
}

// Export.
module.exports = Log2f
