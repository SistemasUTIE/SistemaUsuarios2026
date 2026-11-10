import { boot } from 'quasar/wrappers'
import axios from 'axios'

//const API_PORT = '9884'

const baseURL = 'http://sistema.ieenayarit.org:9884/api'
const LOGIN_URL = 'http://sistema.ieenayarit.org:9884/acceso/'

// const baseURL =
//   hostname === 'localhost'
//     ? `http://192.168.2.110:${API_PORT}/api`
//     : `${protocol}//${hostname}:${API_PORT}/api`

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

function redirectToLogin(returnToPanel = false) {
  if (window.location.href.startsWith(LOGIN_URL)) return
  const keysToRemove = returnToPanel
    ? ['sistema', 'usuario', 'userId', 'sistemaId']
    : ['token', 'sistema', 'usuario', 'userId', 'sistemaId']
  keysToRemove.forEach((key) => localStorage.removeItem(key))
  window.location.replace(`${LOGIN_URL}?return=${returnToPanel}`)
}

// Agrega el token automÃ¡ticamente a cada peticiÃ³n
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

// Manejo centralizado de respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin()
    }

    return Promise.reject(error)
  },
)

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api, redirectToLogin }

