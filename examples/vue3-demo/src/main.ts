import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import SimpleMicroApp from 'simple-micro-app'

SimpleMicroApp.start()

createApp(App).mount('#app')
