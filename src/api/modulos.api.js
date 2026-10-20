import { api } from '../boot/axios'

export const modulosApi = {
    obtenerModulosPorSistema: (systemId) => api.get('/modules', { params: { systemId } }),
    crearModulo: (payload) => api.post('/modules', payload),
    actualizarModulo: (id, payload) => api.put(`/modules/${id}`, payload),
    eliminarModulo: (id) => api.delete(`/modules/${id}`),
}
