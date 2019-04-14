module.exports = {
  random(min, max) {
    return min + Math.round(Math.random() * (max - min))
  },

  sleep(time) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, time)
    })
  }
}