import loadHtml from "./source"
import { code2Function } from './utils'

// 创建微应用
export default class CreateApp {
  constructor({ name, url, container }) {
    this.name = name // 应用名
    this.url = url // 应用url地址
    this.container = container // micro-app元素
    this.status = 'loading'
    loadHtml(this)
  }
  loadCount = 0
  status = 'created' // 组件状态，包括created/loading/mount/unmont

  source = {
    links: new Map(), // 储存服务中的link标签
    scripts: new Map(), // 出参服务中的script标签
  }

  // 资源加载完执行
  onLoad(htmlDom) {
    this.loadCount = this.loadCount + 1
    console.log('onload', this.loadCount, htmlDom)
    if (this.loadCount === 2 && this.status !== 'unmount') {
      // 记录Dom结构用于后续操作
      this.source.html = htmlDom
      // 执行mount方法
      this.mount()
    }
  }

  // 资源加载完成后进行渲染
  mount() {
    // 克隆DOM节点
    const cloneHTML = this.source.html.cloneNode(true)
    // 创建一个fragment节点作为模板，这样不会产生冗余的元素
    const fragment = document.createDocumentFragment()
    Array.from(cloneHTML.childNodes).forEach(node => {
      fragment.appendChild(node)
    })
    // 将格式化后的DOM结构插入到容器中
    this.container.appendChild(fragment)

    // 执行js
    this.source.scripts.forEach((info, url) => {
      if (info.type === 'module') {
        const scriptElement = document.createElement('script', {})
        if (!info.isExternal) {
          const blob = new Blob([info.code], { type: 'text/javascript' })
          scriptElement.src = URL.createObjectURL(blob)
        } else {
          scriptElement.src = url
        }
        scriptElement.setAttribute('type', 'module')

        const parent = this.container.querySelector('micro-app-body')
        parent.appendChild(scriptElement)
      } else {
        code2Function(info.code).call(window)
        // (0, eval)(info.code) // eval间接调用，让js在全局调用
      }
    })

    // 标记应用为已渲染
    this.status = 'mounted'
    console.log('mounted: ', this.container)
  }

  // 卸载应用，执行关闭沙箱，清空缓存等操作
  unmount() {

  }
}

export const appInstanceMap = new Map()