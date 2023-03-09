/**
 * 获取静态资源
 * @param {string} url 静态资源地址
 */
export function fetchSource (url) {
  return fetch(url).then(res => {
    return res.text()
  })
}

/**
 * 解析url是不是http
 * @param {string} url 静态资源地址
 * @param {string} baseUrl 静态资源域名地址
 */
export function validHttp(url, baseUrl) {
  const httpReg = new RegExp(/^http(s)?:\/\/([\w-]+\.)+[\w-]+([\w- ./?%&=]*)?/)
  if (httpReg.test(url)) {
    return url
  }
  return (baseUrl.charAt(baseUrl.length - 1) === '/' ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl) + url
}

export function code2Function(info) {
  let parsedCode = `(function(window){;${info.code}\n${!info.isExternal ? '' : `//# sourceURL=${address}\n`}})`
  console.log('parsedCode: ', parsedCode)
  return new Function(parsedCode)
}