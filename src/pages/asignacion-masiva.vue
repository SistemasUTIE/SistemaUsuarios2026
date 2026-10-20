<template>
  <q-page class="bulk-page">
    <section class="bulk-hero">
      <div class="hero-copy">
        <q-chip class="hero-chip" icon="group_add" label="Administración de accesos" />
        <h1>Asignación masiva</h1>
        <p>
          Otorga acceso a un perfil completo o habilita un módulo específico para varias cuentas.
        </p>
      </div>
      <div class="hero-actions">
        <q-btn
          v-if="authStore.tienePermiso('PER_MASIV', 'canRead')"
          rounded
          class="secondary-action"
          icon="refresh"
          label="Actualizar"
          :loading="loading"
          @click="cargarCatalogos"
        />
      </div>
    </section>

    <q-card flat bordered class="content-card">
      <div class="panel-header">
        <div>
          <h2>Configurar asignación</h2>
          <p>Los resultados incluirán únicamente cuentas sin acceso vigente al sistema.</p>
        </div>
        <q-btn-toggle
          v-model="modo"
          unelevated
          no-caps
          color="white"
          text-color="grey-8"
          toggle-color="primary"
          :options="modos"
          class="mode-toggle"
          @update:model-value="reiniciarSeleccion"
        />
      </div>

      <div class="assignment-form">
        <q-select
          v-model="systemId"
          :options="sistemasOptions"
          outlined
          emit-value
          map-options
          clearable
          label="Sistema *"
          :loading="loading"
          @update:model-value="cambiarSistema"
        >
          <template #prepend><q-icon name="apps" /></template>
        </q-select>

        <q-select
          v-if="modo === 'profile'"
          v-model="profileId"
          :options="perfilesOptions"
          outlined
          emit-value
          map-options
          clearable
          label="Perfil *"
          @update:model-value="reiniciarSeleccion"
        >
          <template #prepend><q-icon name="badge" /></template>
        </q-select>

        <q-select
          v-else
          v-model="moduleId"
          :options="modulosOptions"
          outlined
          emit-value
          map-options
          clearable
          label="Módulo *"
          :loading="loadingModulos"
          :disable="!systemId || loadingModulos"
          @update:model-value="reiniciarSeleccion"
        >
          <template #prepend><q-icon name="account_tree" /></template>
        </q-select>

        <q-select
          v-model="userType"
          :options="tiposUsuario"
          outlined
          emit-value
          map-options
          clearable
          label="Tipo de usuario *"
          @update:model-value="reiniciarSeleccion"
        >
          <template #prepend><q-icon name="manage_accounts" /></template>
        </q-select>
      </div>

      <section v-if="modo === 'module' && criteriosCompletos" class="module-rights">
        <div class="module-rights__title">
          <div class="rights-icon"><q-icon name="tune" /></div>
          <div>
            <strong>Permisos del módulo</strong>
            <span>Por defecto se concede únicamente lectura.</span>
          </div>
        </div>
        <div class="module-rights__checks">
          <q-checkbox v-model="permisosModulo.canRead" dense label="Lectura" color="primary" />
          <q-checkbox v-model="permisosModulo.canCreate" dense label="Registrar" color="primary" />
          <q-checkbox v-model="permisosModulo.canUpdate" dense label="Editar" color="primary" />
          <q-checkbox v-model="permisosModulo.canDelete" dense label="Eliminar" color="primary" />
        </div>
      </section>

      <q-separator />

      <div v-if="authStore.tienePermiso('PER_MASIV', 'canRead')" class="panel-header users-panel-header">
        <div>
          <h2>Usuarios disponibles</h2>
          <p v-if="criteriosCompletos">
            {{ usuariosElegibles.length }} cuentas sin acceso vigente al sistema seleccionado.
          </p>
          <p v-else>
            Selecciona el sistema, el destino y el tipo de usuario para consultar cuentas.
          </p>
        </div>
        <div v-if="criteriosCompletos" class="selection-actions">
          <span>{{ seleccionados.length }} seleccionados</span>
          <q-btn
            v-if="
              authStore.tienePermiso('PER_MASIV', 'canCreate') ||
              (modo === 'profile' && authStore.tienePermiso('PER_MASIV', 'canUpdate'))
            "
            unelevated
            no-caps
            color="primary"
            icon="how_to_reg"
            label="Asignar acceso"
            :loading="saving"
            :disable="!seleccionados.length || saving"
            @click="asignarSeleccionados"
          />
        </div>
      </div>

      <q-inner-loading :showing="loading || loadingModulos || saving">
        <q-spinner color="primary" size="42px" />
      </q-inner-loading>

      <div v-if="!criteriosCompletos" class="empty-state">
        <div class="empty-icon"><q-icon name="filter_alt" /></div>
        <strong>Completa los criterios</strong>
        <span>La lista se mostrará cuando todos los selectores requeridos tengan una opción.</span>
      </div>

      <div
        v-else-if="
          criteriosCompletos &&
          authStore.tienePermiso('PER_MASIV', 'canRead') &&
          !loading &&
          !usuariosElegibles.length
        "
        class="empty-state"
      >
        <div class="empty-icon"><q-icon name="verified_user" /></div>
        <strong>No hay cuentas pendientes</strong>
        <span>Todos los usuarios de este tipo ya tienen acceso vigente al sistema.</span>
      </div>

      <q-table
        v-else-if="criteriosCompletos && authStore.tienePermiso('PER_MASIV', 'canRead')"
        v-model:selected="seleccionados"
        flat
        selection="multiple"
        :rows="usuariosElegibles"
        :columns="columnas"
        row-key="id"
        class="bulk-table"
        :grid="$q.screen.lt.md"
        :pagination="{ sortBy: 'displayName', descending: false, rowsPerPage: 10 }"
        no-data-label="Sin usuarios disponibles"
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-usuario="props">
          <q-td :props="props">
            <div class="user-cell">
              <q-avatar size="38px" class="user-avatar"><q-icon name="person" /></q-avatar>
              <div>
                <strong>{{ props.row.displayName }}</strong>
                <span>{{ props.row.userName }}</span>
              </div>
            </div>
          </q-td>
        </template>
        <template #body-cell-correo="props">
          <q-td :props="props">{{ props.row.email || 'Sin correo registrado' }}</q-td>
        </template>
        <template #body-cell-categoria="props">
          <q-td :props="props">{{ props.row.category }}</q-td>
        </template>
        <template #item="props">
          <div class="q-pa-xs col-12">
            <q-card flat bordered class="mobile-user-card">
              <q-card-section class="user-cell">
                <q-avatar size="40px" class="user-avatar"><q-icon name="person" /></q-avatar>
                <div>
                  <strong>{{ props.row.displayName }}</strong>
                  <span>{{ props.row.userName }}</span>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section class="mobile-user-details">
                <span>{{ props.row.email || 'Sin correo registrado' }}</span>
                <span>{{ props.row.category }}</span>
              </q-card-section>
              <q-card-actions align="right">
                <q-checkbox v-model="props.selected" dense label="Seleccionar" />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
      <div v-else-if="!authStore.tienePermiso('PER_MASIV', 'canRead')" class="empty-state">
        <strong>No tienes permiso para consultar la información de asignación masiva.</strong>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { usuariosApi } from '../api/usuarios.api'
import { sistemasApi } from '../api/sistemas.api'
import { perfilesApi } from '../api/perfiles.api'
import { modulosApi } from '../api/modulos.api'
import { permisosApi } from '../api/permisos.api'
import { useAuthStore } from '../stores/auth.store'

const $q = useQuasar()
const authStore = useAuthStore()
const loading = ref(false)
const loadingModulos = ref(false)
const saving = ref(false)
const modo = ref('profile')
const systemId = ref(null)
const profileId = ref(null)
const moduleId = ref(null)
const userType = ref(null)
const sistemas = ref([])
const perfiles = ref([])
const modulos = ref([])
const empleados = ref([])
const usuarios = ref([])
const accesosSistema = ref([])
const seleccionados = ref([])
const asignadosModulo = ref(new Set())
const permisosModulo = ref({ canRead: true, canCreate: false, canUpdate: false, canDelete: false })

const modos = [
  { label: 'Por perfil', value: 'profile', icon: 'badge' },
  { label: 'Un módulo', value: 'module', icon: 'account_tree' },
]
const tiposUsuario = [
  { label: 'Empleados IEEN', value: 1 },
  { label: 'Ciudadanos', value: 3 },
  { label: 'Partidos Politicos', value: 2 },
]
const sistemasOptions = computed(() =>
  sistemas.value.map((item) => ({ label: item.name, value: item.id })),
)
const perfilesOptions = computed(() =>
  perfiles.value.map((item) => ({ label: item.name, value: item.id })),
)
const modulosOptions = computed(() =>
  modulos.value.map((item) => ({ label: item.name, value: item.id })),
)
const criteriosCompletos = computed(() =>
  Boolean(
    systemId.value &&
    userType.value !== null &&
    (modo.value === 'profile' ? profileId.value : moduleId.value),
  ),
)
const columnas = [
  { name: 'usuario', label: 'Usuario', field: 'displayName', align: 'left' },
  { name: 'correo', label: 'Correo', field: 'email', align: 'left' },
  { name: 'categoria', label: 'Tipo', field: 'category', align: 'left' },
]

const usuariosElegibles = computed(() => {
  if (!criteriosCompletos.value) return []
  const accounts = usuarios.value.filter(
    (usuario) => Number(usuario.userType) === Number(userType.value),
  )
  const empleadosPorId = new Map(empleados.value.map((empleado) => [String(empleado.id), empleado]))
  const usuariosConAcceso = new Set(
    accesosSistema.value
      .filter((acceso) => String(acceso.systemId) === String(systemId.value) && acceso.hasAccess)
      .map((acceso) => String(acceso.userId)),
  )

  return accounts
    .filter((usuario) => !usuariosConAcceso.has(String(usuario.id)))
    .filter((usuario) => modo.value !== 'module' || !asignadosModulo.value.has(String(usuario.id)))
    .map((usuario) => {
      const empleado = empleadosPorId.get(String(usuario.referenceId))
      return {
        ...usuario,
        displayName:
          empleado?.fullName ||
          [empleado?.name, empleado?.paternalSurname, empleado?.maternalSurname]
            .filter(Boolean)
            .join(' ') ||
          usuario.userName ||
          usuario.email ||
          'Usuario sin nombre',
        category:
          tiposUsuario.find((tipo) => tipo.value === Number(usuario.userType))?.label || 'Usuario',
      }
    })
})

onMounted(() => {
  if (authStore.tienePermiso('PER_MASIV', 'canRead')) cargarCatalogos()
})

function listaDesdeRespuesta(response) {
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : []
}

function reiniciarSeleccion() {
  seleccionados.value = []
}

async function cargarCatalogos() {
  if (!authStore.tienePermiso('PER_MASIV', 'canRead')) return
  loading.value = true
  try {
    const [
      sistemasResponse,
      perfilesResponse,
      empleadosResponse,
      usuariosResponse,
      accesosResponse,
    ] = await Promise.all([
      sistemasApi.obtenerSistemas(),
      perfilesApi.obtenerPerfiles(),
      usuariosApi.obtenerEmpleados(),
      usuariosApi.obtenerUsuarios(),
      permisosApi.obtenerAccesosSistemas(),
    ])
    sistemas.value = listaDesdeRespuesta(sistemasResponse)
    perfiles.value = listaDesdeRespuesta(perfilesResponse)
    empleados.value = listaDesdeRespuesta(empleadosResponse)
    usuarios.value = listaDesdeRespuesta(usuariosResponse)
    accesosSistema.value = listaDesdeRespuesta(accesosResponse)
    seleccionados.value = []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar los catálogos y usuarios.',
    })
  } finally {
    loading.value = false
  }
}

async function cambiarSistema(value) {
  systemId.value = value
  moduleId.value = null
  modulos.value = []
  asignadosModulo.value = new Set()
  seleccionados.value = []
  if (!value) return

  loadingModulos.value = true
  try {
    const response = await modulosApi.obtenerModulosPorSistema(value)
    if (String(systemId.value) === String(value)) modulos.value = listaDesdeRespuesta(response)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar los módulos del sistema.',
    })
  } finally {
    loadingModulos.value = false
  }
}

async function asignarSeleccionados() {
  if (
    modo.value === 'module'
      ? !authStore.tienePermiso('PER_MASIV', 'canCreate')
      : !authStore.tienePermiso('PER_MASIV', 'canCreate') &&
        !authStore.tienePermiso('PER_MASIV', 'canUpdate')
  ) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para crear accesos masivos.' })
    return
  }
  const targets = [...seleccionados.value]
  if (!targets.length || !criteriosCompletos.value) return

  saving.value = true
  let completados = 0
  const fallidos = []
  try {
    let accesosPerfil = []
    let permisosPerfil = []
    if (modo.value === 'profile') {
      const [accesosResponse, permisosResponse] = await Promise.all([
        permisosApi.obtenerAccesosModulosPorPerfil(profileId.value),
        permisosApi.obtenerPermisosModulosPorPerfil(profileId.value),
      ])
      accesosPerfil = listaDesdeRespuesta(accesosResponse)
      permisosPerfil = listaDesdeRespuesta(permisosResponse)
    }

    for (const usuario of targets) {
      try {
        if (modo.value === 'profile') {
          const accesoExistente = accesosSistema.value.find(
            (acceso) =>
              String(acceso.userId) === String(usuario.id) &&
              String(acceso.systemId) === String(systemId.value),
          )
          const payloadAcceso = {
            systemId: systemId.value,
            userId: usuario.id,
            profileId: profileId.value,
            hasAccess: true,
          }
          if (accesoExistente) {
            if (!authStore.tienePermiso('PER_MASIV', 'canUpdate')) {
              throw new Error('No tienes permiso para actualizar accesos masivos existentes.')
            }
            await permisosApi.actualizarAccesoSistemaUsuario(accesoExistente.id, payloadAcceso)
          } else {
            if (!authStore.tienePermiso('PER_MASIV', 'canCreate')) {
              throw new Error('No tienes permiso para crear accesos masivos.')
            }
            await permisosApi.crearAccesoSistemaUsuario(payloadAcceso)
          }
          const moduleIds = new Set(modulos.value.map((modulo) => String(modulo.id)))
          const accesosActivos = accesosPerfil.filter(
            (acceso) => moduleIds.has(String(acceso.moduleId)) && acceso.hasAccess,
          )
          for (const acceso of accesosActivos) {
            if (!authStore.tienePermiso('PER_MASIV', 'canCreate')) {
              throw new Error('No tienes permiso para crear accesos a módulos.')
            }
            const permiso = permisosPerfil.find(
              (item) => String(item.moduleId) === String(acceso.moduleId),
            )
            await permisosApi.crearAccesoModuloUsuario({
              moduleId: acceso.moduleId,
              userId: usuario.id,
              hasAccess: true,
            })
            await permisosApi.crearPermisoModuloUsuario({
              moduleId: acceso.moduleId,
              userId: usuario.id,
              canCreate: Boolean(permiso?.canCreate),
              canUpdate: Boolean(permiso?.canUpdate),
              canDelete: Boolean(permiso?.canDelete),
              canRead: Boolean(permiso?.canRead),
            })
          }
        } else {
          if (!authStore.tienePermiso('PER_MASIV', 'canCreate')) {
            throw new Error('No tienes permiso para crear accesos a módulos.')
          }
          await permisosApi.crearAccesoModuloUsuario({
            moduleId: moduleId.value,
            userId: usuario.id,
            hasAccess: true,
          })
          await permisosApi.crearPermisoModuloUsuario({
            moduleId: moduleId.value,
            userId: usuario.id,
            canCreate: Boolean(permisosModulo.value.canCreate),
            canUpdate: Boolean(permisosModulo.value.canUpdate),
            canDelete: Boolean(permisosModulo.value.canDelete),
            canRead: Boolean(permisosModulo.value.canRead),
          })
          asignadosModulo.value = new Set([...asignadosModulo.value, String(usuario.id)])
        }
        completados += 1
      } catch (error) {
        fallidos.push(
          `${usuario.userName || usuario.email || String(usuario.id)}: ${error.response?.data?.message || 'Error al guardar'}`,
        )
      }
    }

    if (modo.value === 'profile') {
      const response = await permisosApi.obtenerAccesosSistemas()
      accesosSistema.value = listaDesdeRespuesta(response)
    }
    seleccionados.value = []
    if (fallidos.length) {
      $q.notify({
        type: 'warning',
        message: `Asignación parcial: ${completados} completados; fallaron ${fallidos.length}: ${fallidos.join(', ')}.`,
        timeout: 10000,
      })
    } else {
      $q.notify({
        type: 'positive',
        message: `Acceso asignado correctamente a ${completados} usuario(s).`,
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar los permisos del perfil.',
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.bulk-page {
  min-height: 100%;
  padding: 28px;
  display: grid;
  align-content: start;
  gap: 22px;
  background:
    radial-gradient(circle at top left, rgba(173, 128, 255, 0.12), transparent 20%),
    linear-gradient(180deg, #f7f5fb 0%, #f2f4fb 100%);
}

.bulk-hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;
  overflow: hidden;
  padding: 34px;
  border-radius: 28px;
  color: #fff;
  background: linear-gradient(135deg, #4f2d8f 0%, #7a42c7 35%, #a64dd8 100%);
  box-shadow: 0 26px 60px rgba(92, 47, 146, 0.25);
}

.bulk-hero::before {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  content: '';
  opacity: 0.36;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
}

.hero-chip {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.12);
  color: #532680;
}

.bulk-hero h1 {
  margin: 10px 0 8px;
  color: rgba(84, 37, 131, 0.82);
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  font-weight: 950;
  line-height: 0.95;
}

.bulk-hero p {
  max-width: 700px;
  margin: 0;
  color: rgba(83, 4, 4, 0.82);
  font-size: 1rem;
}

.secondary-action {
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: #5b2d82 !important;
  color: #fff !important;
  font-weight: 700;
}

.secondary-action :deep(.q-btn__content),
.secondary-action :deep(.q-btn__label),
.secondary-action :deep(.q-icon),
.secondary-action :deep(.material-icons) {
  color: #fff !important;
  fill: #fff !important;
}

.content-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(94, 54, 134, 0.12);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 44px rgba(80, 46, 120, 0.07);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 22px;
  border-bottom: 1px solid rgba(94, 54, 134, 0.12);
}

.panel-header h2 {
  margin: 0;
  color: #211b2d;
  font-size: 1.15rem;
  font-weight: 850;
}

.panel-header p {
  margin: 5px 0 0;
  color: #6f6780;
  font-size: 0.88rem;
}

.mode-toggle {
  flex: 0 0 auto;
  border: 1px solid rgba(94, 54, 134, 0.16);
  border-radius: 8px;
  overflow: hidden;
}

.assignment-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 22px;
}

.module-rights {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin: 0 22px 22px;
  padding: 14px 16px;
  border: 1px solid rgba(94, 54, 134, 0.12);
  border-radius: 12px;
  background: #faf8fd;
}

.module-rights__title,
.module-rights__checks {
  display: flex;
  align-items: center;
  gap: 12px;
}

.module-rights__title > div:last-child {
  display: grid;
  gap: 3px;
}

.module-rights__title strong {
  color: #342643;
  font-size: 0.9rem;
}

.module-rights__title span {
  color: #766d80;
  font-size: 0.8rem;
}

.rights-icon,
.user-avatar {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #684099;
  background: #eee6f7;
}

.rights-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.users-panel-header {
  border-bottom: 0;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.selection-actions > span {
  color: #6f6780;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.user-cell > div:last-child {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.user-cell strong,
.user-cell span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-cell strong {
  color: #30263b;
  font-size: 0.9rem;
}

.user-cell span {
  color: #756b81;
  font-size: 0.8rem;
}

.mobile-user-details {
  display: grid;
  gap: 8px;
  color: #6f6780;
  font-size: 0.84rem;
}

.mobile-user-card {
  border-color: rgba(94, 54, 134, 0.12);
  border-radius: 12px;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 42px 22px 50px;
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border-radius: 16px;
  background: #f0e9f7;
  color: #684099;
  font-size: 1.5rem;
}

.empty-state strong {
  color: #30263b;
  font-size: 1rem;
}

.empty-state span {
  max-width: 480px;
  color: #756b81;
  font-size: 0.88rem;
}

@media (max-width: 900px) {
  .assignment-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .module-rights {
    align-items: flex-start;
    flex-direction: column;
  }

  .module-rights__checks {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .bulk-page {
    padding: 16px;
  }

  .bulk-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
    border-radius: 20px;
  }

  .bulk-hero h1 {
    font-size: 2.2rem;
  }

  .assignment-form {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px;
  }

  .panel-header,
  .users-panel-header {
    align-items: stretch;
    flex-direction: column;
    padding: 18px 16px;
  }

  .mode-toggle {
    width: 100%;
  }

  .selection-actions {
    justify-content: space-between;
  }

  .module-rights {
    margin: 0 16px 16px;
  }
}
</style>
