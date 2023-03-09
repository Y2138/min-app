import { fetchSource, validHttp } from "./utils"

// fetch加载html资源
export default function loadHtml (app) {
  fetchSource(app.url).then((html) => {
    const formatHtml = html.replace(/<head[^>]*>[\s\S]*?<\/head>/i, (match) => {
      // 将head标签替换为micro-app-head，因为web页面只允许有一个head标签
      return match
        .replace(/<head/i, '<micro-app-head')
        .replace(/<\/head>/i, '</micro-app-head>')
    }).replace(/<body[^>]*>[\s\S]*?<\/body>/i, (match) => {
      // 将body标签替换为micro-app-body，防止与基座应用的body标签重复导致的问题。
      return match
        .replace(/<body/i, '<micro-app-body')
        .replace(/<\/body>/i, '</micro-app-body>')
    })

    // 将html字符串转化为dom结构
    const htmlDom = document.createElement("div")
    htmlDom.innerHTML = formatHtml

    // 进一步提取和处理js、css等静态资源
    extractSourceDom(htmlDom, app);
    console.log('App Source: ', app.source)

    // 获取micro-app-head
    const microAppHead = htmlDom.querySelector('micro-app-head')
    // 如果有link标签资源，则通过fetch请求
    if (app.source.links.size) {
      fetchLinksFromHtml(app, microAppHead, htmlDom)
    } else {
      app.onLoad(htmlDom)
    }
    // 如果有script标签资源，则通过fetch请求
    if (app.source.scripts.size) {
      fetchScriptsFromHtml(app, htmlDom)
    } else {
      app.onLoad(htmlDom)
    }

    console.log('App Instance: ', app)
  }).catch(e => {
    console.log('加载html失败', e)
  })
}

/**
 * 递归处理每一个子元素
 * @param {Dom} parent 父元素
 * @param {App实例} app
 */
function extractSourceDom (parent, app) {
  const children = Array.from(parent.children)

  children.length && children.forEach(child => {
    extractSourceDom(child, app)
  })
  // 判断如果是link、script标签去加载对应的资源
  for (const dom of children) {
    if (dom instanceof HTMLLinkElement) {
      // 提取远程link地址
      const href = dom.getAttribute('href')
      if (dom.getAttribute('ref') === 'stylesheet' && href) {
        app.source.links.set(href, {
          code: '', // 代码内容，先定义用于缓存
        })
        // 删除原有元素
        parent.removeChild(dom)
      }
    } else if (dom instanceof HTMLScriptElement) {
      // 提取script标签
      let src = dom.getAttribute('src')
      let type = dom.getAttribute('type')
      if (src) {
        src = validHttp(src, app.url)
        if (type === 'module') {
          dom.setAttribute('src', src)
          app.source.scripts.set(src, {
            code: '',
            type: 'module', // 区分是不是module，执行逻辑不一样
            isExternal: true
          })
        } else {
          app.source.scripts.set(src, {
            code: '',
            type: 'script',
            isExternal: true, // 是否远程
          })
        }
      } else if (dom.textContent) {
        // 没有src则是内联元素
        const nonceStr = Math.random().toString(36).substring(2, 17)
        app.source.scripts.set(nonceStr, {
          code: dom.textContent, // 内联代码块
          type: type === 'module' ? 'module' : 'script',
          isExternal: false, // 是否远程
        })
      }
      let replaceComment = document.createComment('script element removed by micro-app')
      // es-module模块不删除
      parent.replaceChild(replaceComment, dom)
    } else if (dom instanceof HTMLStyleElement) {
      // 进行样式隔离
    }
  }
}

/**
 * 获取所有link标签
 * @param {App实例} app 
 * @param {microAppHead标签} microAppHead 
 * @param {html} htmlDom 
 */
function fetchLinksFromHtml(app, microAppHead, htmlDom) {
  const linkEntries = Array.from(app.source.links.entries())
  // 通过fetch请求所有link资源
  const fetchLinkPromise = []
  for (const [url] of linkEntries) {
    fetchLinkPromise.push(fetchSource(url))
  }
  Promise.all(fetchLinkPromise).then(res => {
    for (let i = 0; i < res.length; i++) {
      const code = res[i]
      // 拿到css资源后放入style元素并插入到micro-app-head中
      const link2Style = document.createElement('style')
      link2Style.textContent = code
      microAppHead.appendChild(link2Style)

      // 将代码放入缓存，再次渲染时可以从缓存中获取
      linkEntries[i][1].code = code
    }

    // 处理完成之后执行onLoad方法
    console.log('links ready')
    app.onLoad(htmlDom)
  }).catch(e => {
    console.error('加载link出错', e)
  })
}

/**
 * 获取js远程资源
 * @param app 应用实例
 * @param htmlDom html DOM结构
 */
 export function fetchScriptsFromHtml (app, htmlDom) {
  const scriptEntries = Array.from(app.source.scripts.entries())
  // 通过fetch请求所有js资源
  const fetchScriptPromise = []
  console.log('scriptEntries: ', scriptEntries)
  for (const [url, info] of scriptEntries) {
    // 如果是内联script，则不需要请求资源
    fetchScriptPromise.push(!info.isExternal ? Promise.resolve(info.code) :  fetchSource(url))
  }

  Promise.all(fetchScriptPromise).then((res) => {
    for (let i = 0; i < res.length; i++) {
      const code = res[i]
      // 将代码放入缓存，再次渲染时可以从缓存中获取
      scriptEntries[i][1].code = code
    }
    console.log('scripts ready')
    // 处理完成后执行onLoad方法
    app.onLoad(htmlDom)
  }).catch((e) => {
    console.error('加载js出错', e)
  })
}