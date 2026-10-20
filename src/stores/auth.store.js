import { defineStore } from 'pinia'
import { redirectToLogin } from '../boot/axios'
import { sistemasApi } from '../api/sistemas.api'
import { modulosApi } from '../api/modulos.api'
import { permisosApi } from '../api/permisos.api'

const SESSION_KEYS = ['token', 'sistema', 'usuario', 'userId', 'sistemaId']
let expirationTimer

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value
}

function getTokenExpiration(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
    return Number.isFinite(claims.exp) ? claims.exp * 1000 : null
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const expiration = getTokenExpiration(token)
  return expiration !== null && expiration <= Date.now()
}

function getTokenClaims(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return {}
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
  } catch {
    return {}
  }
}

function getUserId(token) {
  const claims = getTokenClaims(token)
  const userIdClaim = Object.entries(claims).find(([key]) =>
    /(^|[/#:])(nameidentifier|userid|user_id|sub|id)$/i.test(key),
  )
  return userIdClaim?.[1] || null
}

function listFromResponse(response) {
  const body = response?.data
  const data = body?.data ?? body
  return Array.isArray(data) ? data : []
}

function normalizeName(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    sistemaId: null,
    sistemaNombre: null,
    userId: null,
    usuario: null,
    modulos: [],
    sistemas: [],
    loading: false,
    initialized: false,
  }),

  getters: {
    autenticado: (state) => Boolean(state.token) && !isTokenExpired(state.token),
    tieneModulo: (state) => (siglas) => state.modulos.some((modulo) => modulo.siglas_Modulo === siglas),
    tienePermiso: (state) => (acronimo, permiso = 'canRead') => {
      const acronimoNormalizado = String(acronimo).trim().toUpperCase()
      const modulo = state.modulos.find(
        (item) =>
          String(item.acronym || item.siglas_Modulo || '').trim().toUpperCase() ===
          acronimoNormalizado,
      )
      return Boolean(modulo?.hasAccess && modulo?.[permiso])
    },
  },

  actions: {
    cargarSesionDesdeStorage() {
      this.token = localStorage.getItem('token')
      this.sistemaId = localStorage.getItem('sistema')
      this.usuario = localStorage.getItem('usuario')
      this.userId = localStorage.getItem('userId') || getUserId(this.token || '')
      this.sistemaNombre = this.sistemaId
    },

    inicializarDesdeUrl(query = {}) {
      const key = firstQueryValue(query.key)
      const sistemaNombre = firstQueryValue(query.system ?? query.sistema)
      const usuario = firstQueryValue(query.usr)

      if (key) {
        this.token = key
        localStorage.setItem('token', key)
      }
      if (sistemaNombre) {
        this.sistemaNombre = sistemaNombre
        localStorage.setItem('sistema', sistemaNombre)
      }
      if (usuario) {
        this.usuario = usuario
        localStorage.setItem('usuario', usuario)
      }
      if (this.token) {
        this.userId = getUserId(this.token) || this.userId
        if (this.userId) localStorage.setItem('userId', this.userId)
      }
    },

    programarExpiracion() {
      window.clearTimeout(expirationTimer)
      const expiration = getTokenExpiration(this.token)
      if (expiration === null) return

      const remaining = expiration - Date.now()
      if (remaining <= 0) {
        this.cerrarSesion()
        return
      }

      expirationTimer = window.setTimeout(() => this.cerrarSesion(), Math.min(remaining, 2_147_000_000))
      if (remaining > 2_147_000_000) {
        expirationTimer = window.setTimeout(() => this.programarExpiracion(), 2_147_000_000)
      }
    },

    cerrarSesion(returnToPanel = false) {
      window.clearTimeout(expirationTimer)
      const keysToRemove = returnToPanel
        ? SESSION_KEYS.filter((key) => key !== 'token')
        : SESSION_KEYS
      keysToRemove.forEach((key) => localStorage.removeItem(key))
      this.$reset()
      redirectToLogin(returnToPanel)
    },

    async cargarPermisos() {
      if (!this.sistemaNombre) throw new Error('No se recibiÃ³ el nombre del sistema.')
      if (!this.userId) throw new Error('No se pudo obtener el identificador del usuario desde el token.')

      const sistemas = listFromResponse(await sistemasApi.obtenerSistemas())

      const sistema = sistemas.find(
        (item) => normalizeName(item.name) === normalizeName(this.sistemaNombre),
      )
      if (!sistema?.id) throw new Error(`No se encontrÃ³ el sistema "${this.sistemaNombre}".`)
      this.sistemaId = String(sistema.id)
      localStorage.setItem('sistemaId', this.sistemaId)

      const [modulosResponse, accesosResponse, permisosResponse] = await Promise.all([
        modulosApi.obtenerModulosPorSistema(this.sistemaId),
        permisosApi.obtenerAccesosModulosUsuario(this.userId),
        permisosApi.obtenerPermisosModulosUsuario(this.userId),
      ])
      const modulosSistema = listFromResponse(modulosResponse)
      const accesosUsuario = listFromResponse(accesosResponse)
      const permisosUsuario = listFromResponse(permisosResponse)
      const accesosPorModulo = new Map(
        accesosUsuario
          .filter((acceso) => !acceso.userId || String(acceso.userId) === String(this.userId))
          .map((acceso) => [String(acceso.moduleId), acceso]),
      )
      const permisosPorModulo = new Map(
        permisosUsuario
          .filter((permiso) => !permiso.userId || String(permiso.userId) === String(this.userId))
          .map((permiso) => [String(permiso.moduleId), permiso]),
      )
      this.modulos = modulosSistema
        .map((modulo) => {
          const acceso = accesosPorModulo.get(String(modulo.id))
          const permisos = permisosPorModulo.get(String(modulo.id))
          return {
            ...modulo,
            hasAccess: Boolean(acceso?.hasAccess),
            canCreate: Boolean(permisos?.canCreate),
            canRead: Boolean(permisos?.canRead),
            canUpdate: Boolean(permisos?.canUpdate),
            canDelete: Boolean(permisos?.canDelete),
          }
        })
        .filter((modulo) => modulo.hasAccess)
      return this.modulos
    },

    async inicializar(query = {}) {
      this.loading = true
      try {
        this.cargarSesionDesdeStorage()
        this.inicializarDesdeUrl(query)

        if (!this.token || isTokenExpired(this.token)) {
          this.cerrarSesion()
          return
        }

        this.programarExpiracion()
        if (!this.sistemaNombre) {
          this.initialized = true
          return
        }

        await this.cargarPermisos()
        this.initialized = true
      } finally {
        this.loading = false
      }
    },
  },
})

