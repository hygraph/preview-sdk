import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import Home from './views/Home.vue'
import Recipe from './views/Recipe.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/recipes/:id', name: 'Recipe', component: Recipe, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')