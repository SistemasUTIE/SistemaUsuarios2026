import { api } from '../boot/axios'

export const usuariosApi = {
    obtenerEmpleados: () => api.get('/Employees'),
    obtenerUsuarios: () => api.get('/Users'),
    crearUsuario: (payload) => api.post('/Users', payload),
    actualizarEstadoUsuario: (id, status) => api.patch(`/Users/${id}/status`, { status }),
}
