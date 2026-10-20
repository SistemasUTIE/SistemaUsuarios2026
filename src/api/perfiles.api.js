import { api } from '../boot/axios'

export const perfilesApi = {
  obtenerPerfiles: () => api.get('/Profiles'),
  crearPerfil: (payload) => api.post('/Profiles', payload),
  actualizarPerfil: (id, payload) => api.put(`/Profiles/${id}`, payload),
  eliminarPerfil: (id) => api.delete(`/Profiles/${id}`),
}
