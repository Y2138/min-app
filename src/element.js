import CreateApp, { appInstanceMap } from './app'


// Web Components 自定义元素
class MyElement extends HTMLElement {
  // 声明需要监听的属性名，只有这些属性变化时才会触发attributeChangedCallback
  static get observedAttributes() {
    return ['name', 'url']
  }

  constructor() {
    super()
  }

  connectedCallback() {
    // 元素被插入到DOM时执行，此时去加载子应用的静态资源并渲染
    console.log('micro-app is connected')
    // 创建微应用实例
    const app = new CreateApp({
      name: this.name,
      url: this.url,
      container: this
    })

    // 记入缓存
    appInstanceMap.set(this.name, app);
  }
  disconnectedCallback() {
    console.log('micro-app has disconnected')
  }
  attributeChangedCallback(attr, oldVal, newVal) {
    // 元素属性发生变化时执行，可以获取name、url等属性的值
    console.log(`attribute ${attr}: ${newVal}`)
    if (attr === 'name' && !this.name && newVal) {
      this.name = newVal
    } else if (attr === 'url' && !this.url && newVal) {
      this.url = newVal
    }
  }
}

// window.customElements.define('micro-app', MyElement)

export function defineElement() {
  if (!window.customElements.get('micro-app')) {
    window.customElements.define('micro-app', MyElement)
  }
}