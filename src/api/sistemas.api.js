import { api } from '../boot/axios'

export const sistemasApi = {
  obtenerSistemas: () => api.get('/systems'),
  crearSistema: (payload) => api.post('/systems', payload),
  actualizarSistema: (id, payload) => api.put(`/systems/${id}`, payload),
  eliminarSistema: (id) => api.delete(`/systems/${id}`),
}
