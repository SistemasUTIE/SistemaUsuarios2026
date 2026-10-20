import { api } from '../boot/axios'

export const permisosApi = {
  obtenerPermisos: () => api.get('/SystemProfiles'),
  crearPermiso: (payload) => api.post('/SystemProfiles', payload),
  actualizarPermiso: (id, payload) => api.put(`/SystemProfiles/${id}`, payload),
  eliminarPermiso: (id) => api.delete(`/SystemProfiles/${id}`),
  obtenerAccesosModulosPorPerfil: (profileId) =>
    api.get(`/ModuleProfileAccesses/profile/${profileId}`),
  crearAccesoModuloPerfil: (payload) => api.post('/ModuleProfileAccesses', payload),
  actualizarAccesoModuloPerfil: (id, payload) => api.put(`/ModuleProfileAccesses/${id}`, payload),
  crearPermisoModuloPerfil: (payload) => api.post('/ModuleProfilePermissions', payload),
  actualizarPermisoModuloPerfil: (id, payload) =>
    api.put(`/ModuleProfilePermissions/${id}`, payload),
  obtenerPermisosModulosPorPerfil: (profileId) =>
    api.get(`/ModuleProfilePermissions/profile/${profileId}`),
  crearAccesoSistemaUsuario: (payload) => api.post('/SystemUsers', payload),
  actualizarAccesoSistemaUsuario: (id, payload) => api.put(`/SystemUsers/${id}`, payload),
  obtenerAccesosSistemas: () => api.get('/SystemUsers'),
  crearAccesoModuloUsuario: (payload) => api.post('/ModuleUserAccesses', payload),
  actualizarAccesoModuloUsuario: (id, payload) => api.put(`/ModuleUserAccesses/${id}`, payload),
  obtenerAccesosModulosUsuario: (userId) => api.get(`/ModuleUserAccesses/user/${userId}`),
  crearPermisoModuloUsuario: (payload) => api.post('/ModuleUserPermissions', payload),
  actualizarPermisoModuloUsuario: (id, payload) => api.put(`/ModuleUserPermissions/${id}`, payload),
  obtenerPermisosModulosUsuario: (userId) => api.get(`/ModuleUserPermissions/user/${userId}`),
}
