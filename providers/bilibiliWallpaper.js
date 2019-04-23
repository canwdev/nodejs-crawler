const options = {
  outDir: 'output/bili',
  fromPage: 1,
  toPage: 1,
  ajaxMode: true,
  numberingFolder: false,
  numberingFile: true,
}

function getList($, data) {
  $.items.forEach((v) => {
    let title = v.title
    let links = []

    v.pictures.forEach((v1) => {
      links.push(v1.img_src)
    })

    data.push({
      title,
      links
    })
  })
}


function getDetailData($) {
  return null
}

module.exports = {
  options,
  listUrl: i => `https://api.vc.bilibili.com/link_draw/v1/doc/doc_list?uid=6823116&page_num=${i}&page_size=30&biz=all`,
  getList,
  getDetailData
}