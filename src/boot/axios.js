import { boot } from 'quasar/wrappers'
import axios from 'axios'

const baseURL = import.meta.env.QCLI_API_BASE_URL
const LOGIN_URL = import.meta.env.QCLI_LOGIN_URL

if (!baseURL || !LOGIN_URL) {
  throw new Error('Configura QCLI_API_BASE_URL y QCLI_LOGIN_URL en el archivo .env.')
}

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
