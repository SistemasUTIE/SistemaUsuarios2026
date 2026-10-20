<template>
  <q-page class="permisos-page">
    <section class="permisos-hero">
      <div class="hero-copy">
        <q-chip class="hero-chip" icon="verified_user" label="Control de acceso" />
        <h1>Permisos</h1>
        <p>Relaciona perfiles con sistemas y define a cuáles pueden acceder.</p>
      </div>

      <div class="hero-actions">
        <q-btn
          rounded
          class="secondary-action"
          icon="refresh"
          label="Actualizar"
          :loading="loading"
          @click="cargarTodo"
        />
        <q-btn
          rounded
          class="primary-action"
          icon="add"
          label="Asignar permiso"
          @click="abrirCrear"
        />
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card accent-purple">
        <div class="stat-icon"><q-icon name="link" /></div>
        <div class="stat-text">
          <strong>{{ permisos.length }}</strong
          ><span>Relaciones</span>
        </div>
      </article>
      <article class="stat-card accent-green">
        <div class="stat-icon"><q-icon name="lock_open" /></div>
        <div class="stat-text">
          <strong>{{ permisosConAcceso }}</strong
          ><span>Con acceso</span>
        </div>
      </article>
      <article class="stat-card accent-orange">
        <div class="stat-icon"><q-icon name="lock" /></div>
        <div class="stat-text">
          <strong>{{ permisosSinAcceso }}</strong
          ><span>Sin acceso</span>
        </div>
      </article>
      <article class="stat-card accent-blue">
        <div class="stat-icon"><q-icon name="groups" /></div>
        <div class="stat-text">
          <strong>{{ perfiles.length }}</strong
          ><span>Perfiles</span>
        </div>
      </article>
    </section>

    <q-card flat bordered class="content-card">
      <div class="panel-header">
        <div>
          <h2>Relaciones de acceso</h2>
          <p>Consulta qué sistemas están asociados a cada perfil y administra sus accesos.</p>
        </div>
        <q-input
          v-model="filtro"
          outlined
          dense
          clearable
          class="search-input"
          placeholder="Buscar por perfil o sistema..."
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner color="primary" size="42px" />
      </q-inner-loading>

      <div v-if="!loading && !perfilesAgrupados.length" class="empty-state">
        <div class="empty-icon"><q-icon name="verified_user" /></div>
        <strong>Sin permisos para mostrar</strong>
        <span>Registra perfiles antes de crear relaciones de acceso con los sistemas.</span>
        <q-btn
          v-if="perfiles.length && sistemas.length"
          unelevated
          rounded
          color="primary"
          icon="add"
          label="Asignar permiso"
          @click="abrirCrear"
        />
        <span v-else>Primero registra al menos un perfil para mostrarlo aquí.</span>
      </div>

      <q-table
        v-else
        flat
        :rows="perfilesAgrupados"
        :columns="columnas"
        row-key="id"
        class="permisos-table"
        :grid="$q.screen.lt.md"
        :pagination="{ sortBy: 'name', descending: false, rowsPerPage: 10 }"
        no-data-label="Sin permisos para mostrar"
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-perfil="props">
          <q-td :props="props">
            <div class="relation-entity">
              <div class="entity-icon entity-icon--profile"><q-icon name="badge" /></div>
              <div>
                <strong>{{ props.row.name }}</strong>
                <span>{{ props.row.description || 'Perfil institucional' }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-sistemas="props">
          <q-td :props="props">
            <div class="system-summary">
              <strong>{{ props.row.sistemasConAcceso.length }}</strong>
              <span>de {{ props.row.relaciones.length }} asignados</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-asignados="props">
          <q-td :props="props">
            <q-badge rounded class="relations-badge">
              {{ props.row.relaciones.length }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right actions-cell">
            <q-btn
              flat
              dense
              no-caps
              icon="add_link"
              label="Asignar"
              class="assign-button"
              @click="abrirCrear(props.row.id)"
            >
              <q-tooltip>Asignar sistema a este perfil</q-tooltip>
            </q-btn>
            <q-btn
              unelevated
              dense
              no-caps
              icon="visibility"
              label="Ver sistemas"
              class="view-systems-button"
              @click="abrirSistemasPerfil(props.row)"
            >
              <q-tooltip>Ver sistemas asociados al perfil</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #item="props">
          <div class="q-pa-xs col-12">
            <q-card flat bordered class="mobile-permiso-card">
              <q-card-section class="mobile-permiso-card__head">
                <div class="relation-entity">
                  <div class="entity-icon entity-icon--profile"><q-icon name="badge" /></div>
                  <div>
                    <strong>{{ props.row.name }}</strong>
                    <span>{{ props.row.description || 'Perfil institucional' }}</span>
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <div class="system-summary">
                  <strong>{{ props.row.sistemasConAcceso.length }} sistemas con acceso</strong>
                  <span>{{ props.row.relaciones.length }} relaciones registradas</span>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  flat
                  dense
                  no-caps
                  icon="add_link"
                  label="Asignar sistema"
                  class="assign-button"
                  @click="abrirCrear(props.row.id)"
                />
                <q-btn
                  unelevated
                  dense
                  no-caps
                  icon="visibility"
                  label="Ver sistemas"
                  class="view-systems-button"
                  @click="abrirSistemasPerfil(props.row)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo" persistent>
      <q-card class="permiso-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip
              dense
              class="hero-chip"
              :label="modoEdicion ? 'Editar relación' : 'Nueva relación'"
            />
            <h2>{{ modoEdicion ? 'Actualizar permiso' : 'Asignar permiso' }}</h2>
            <p>Selecciona el perfil, el sistema y define el acceso.</p>
          </div>
          <q-btn flat round icon="close" color="white" @click="cerrarDialogo" />
        </div>

        <q-card-section class="dialog-body">
          <q-select
            v-model="form.profileId"
            :options="perfilesOptions"
            outlined
            emit-value
            map-options
            label="Perfil *"
            :rules="[(value) => !!value || 'Selecciona un perfil']"
          >
            <template #prepend><q-icon name="badge" /></template>
          </q-select>

          <q-select
            v-model="form.systemId"
            :options="sistemasOptions"
            outlined
            emit-value
            map-options
            label="Sistema *"
            :rules="[(value) => !!value || 'Selecciona un sistema']"
          >
            <template #prepend><q-icon name="apps" /></template>
          </q-select>

          <div class="access-control">
            <div class="access-control__icon" :class="form.hasAccess ? 'is-granted' : 'is-denied'">
              <q-icon :name="form.hasAccess ? 'lock_open' : 'lock'" />
            </div>
            <div class="access-control__copy">
              <strong>{{ form.hasAccess ? 'Acceso permitido' : 'Acceso denegado' }}</strong>
              <span>{{
                form.hasAccess
                  ? 'Este perfil podrá acceder al sistema.'
                  : 'Este perfil no podrá acceder al sistema.'
              }}</span>
            </div>
            <q-toggle v-model="form.hasAccess" color="positive" aria-label="Permitir acceso" />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            color="grey-7"
            label="Cancelar"
            class="dialog-actions__cancel"
            @click="cerrarDialogo"
          />
          <q-btn
            unelevated
            color="primary"
            icon="save"
            :label="modoEdicion ? 'Guardar cambios' : 'Guardar permiso'"
            :loading="saving"
            class="dialog-actions__save"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoSistemas">
      <q-card class="systems-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip dense class="hero-chip" icon="badge" label="Perfil seleccionado" />
            <h2>{{ perfilSeleccionado?.name }}</h2>
            <p>Consulta los sistemas relacionados y el estado de acceso de este perfil.</p>
          </div>
          <q-btn
            flat
            round
            icon="close"
            color="white"
            aria-label="Cerrar"
            @click="dialogoSistemas = false"
          />
        </div>

        <q-card-section class="systems-dialog__body">
          <div v-if="!relacionesPerfilSeleccionado.length" class="systems-empty">
            <q-icon name="apps" />
            <strong>Sin sistemas asignados</strong>
            <span>Asigna un sistema para definir el acceso de este perfil.</span>
          </div>

          <div v-else class="profile-system-list">
            <article
              v-for="relacion in relacionesPerfilSeleccionado"
              :key="relacion.id"
              class="profile-system-row"
            >
              <div class="relation-entity">
                <div class="entity-icon entity-icon--system"><q-icon name="apps" /></div>
                <div>
                  <strong>{{ nombreSistema(relacion.systemId) }}</strong>
                  <span>{{
                    relacion.hasAccess
                      ? 'Este perfil puede acceder'
                      : 'Acceso bloqueado para este perfil'
                  }}</span>
                </div>
              </div>
              <q-badge
                rounded
                :class="
                  relacion.hasAccess
                    ? 'access-badge access-badge--granted'
                    : 'access-badge access-badge--denied'
                "
              >
                <q-icon :name="relacion.hasAccess ? 'lock_open' : 'lock'" class="q-mr-xs" />
                {{ relacion.hasAccess ? 'Con acceso' : 'Sin acceso' }}
              </q-badge>
              <div class="profile-system-row__actions">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  aria-label="Editar relación"
                  @click="editarRelacionDesdeDetalle(relacion)"
                >
                  <q-tooltip>Editar relación</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="negative"
                  aria-label="Eliminar relación"
                  @click="eliminarPermiso(relacion)"
                >
                  <q-tooltip>Eliminar relación</q-tooltip>
                </q-btn>
              </div>
            </article>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat color="grey-7" label="Cerrar" @click="dialogoSistemas = false" />
          <q-btn
            unelevated
            color="primary"
            icon="add_link"
            label="Asignar sistema"
            @click="asignarSistemaAlPerfilSeleccionado"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { perfilesApi } from '../api/perfiles.api'
import { sistemasApi } from '../api/sistemas.api'
import { permisosApi } from '../api/permisos.api'

const $q = useQuasar()

const loading = ref(false)
const saving = ref(false)
const dialogo = ref(false)
const dialogoSistemas = ref(false)
const modoEdicion = ref(false)
const permisoEditandoId = ref(null)
const filtro = ref('')
const permisos = ref([])
const perfiles = ref([])
const sistemas = ref([])
const perfilSeleccionado = ref(null)

const formBase = () => ({ profileId: null, systemId: null, hasAccess: true })
const form = ref(formBase())

const columnas = [
  { name: 'perfil', label: 'Perfil', field: 'name', align: 'left' },
  { name: 'sistemas', label: 'Sistemas con acceso', field: 'sistemasConAcceso', align: 'left' },
  { name: 'asignados', label: 'Relaciones', field: 'relaciones', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'right' },
]

const perfilesOptions = computed(() =>
  perfiles.value.map((perfil) => ({ label: perfil.name, value: perfil.id })),
)
const sistemasOptions = computed(() =>
  sistemas.value.map((sistema) => ({ label: sistema.name, value: sistema.id })),
)
const permisosConAcceso = computed(
  () => permisos.value.filter((permiso) => permiso.hasAccess).length,
)
const permisosSinAcceso = computed(() => permisos.value.length - permisosConAcceso.value)

const perfilesAgrupados = computed(() => {
  const query = filtro.value?.trim().toLowerCase()

  return perfiles.value
    .map((perfil) => {
      const relaciones = permisos.value.filter(
        (permiso) => String(permiso.profileId) === String(perfil.id),
      )

      return {
        ...perfil,
        relaciones,
        sistemasConAcceso: relaciones.filter((relacion) => relacion.hasAccess),
      }
    })
    .filter((perfil) => {
      if (!query) return true
      const sistemasDelPerfil = perfil.relaciones
        .map((relacion) => nombreSistema(relacion.systemId))
        .join(' ')
      return `${perfil.name} ${perfil.description || ''} ${sistemasDelPerfil}`
        .toLowerCase()
        .includes(query)
    })
})

const relacionesPerfilSeleccionado = computed(() => {
  if (!perfilSeleccionado.value) return []
  return permisos.value.filter(
    (permiso) => String(permiso.profileId) === String(perfilSeleccionado.value.id),
  )
})

onMounted(cargarTodo)

async function cargarTodo() {
  loading.value = true
  try {
    const [permisosResponse, perfilesResponse, sistemasResponse] = await Promise.all([
      permisosApi.obtenerPermisos(),
      perfilesApi.obtenerPerfiles(),
      sistemasApi.obtenerSistemas(),
    ])
    permisos.value = permisosResponse.data.data || permisosResponse.data || []
    perfiles.value = perfilesResponse.data.data || perfilesResponse.data || []
    sistemas.value = sistemasResponse.data.data || sistemasResponse.data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar los permisos y catálogos.',
    })
  } finally {
    loading.value = false
  }
}

function nombrePerfil(profileId) {
  return (
    perfiles.value.find((perfil) => String(perfil.id) === String(profileId))?.name ||
    'Perfil no encontrado'
  )
}

function nombreSistema(systemId) {
  return (
    sistemas.value.find((sistema) => String(sistema.id) === String(systemId))?.name ||
    'Sistema no encontrado'
  )
}

function abrirCrear(profileId = null) {
  if (!perfiles.value.length || !sistemas.value.length) {
    $q.notify({ type: 'warning', message: 'Primero registra al menos un perfil y un sistema.' })
    return
  }
  modoEdicion.value = false
  permisoEditandoId.value = null
  form.value = { ...formBase(), profileId }
  dialogo.value = true
}

function abrirSistemasPerfil(perfil) {
  perfilSeleccionado.value = perfil
  dialogoSistemas.value = true
}

function asignarSistemaAlPerfilSeleccionado() {
  const profileId = perfilSeleccionado.value?.id
  dialogoSistemas.value = false
  abrirCrear(profileId)
}

function editarRelacionDesdeDetalle(relacion) {
  dialogoSistemas.value = false
  abrirEditar(relacion)
}

function abrirEditar(permiso) {
  modoEdicion.value = true
  permisoEditandoId.value = permiso.id
  form.value = {
    profileId: permiso.profileId,
    systemId: permiso.systemId,
    hasAccess: Boolean(permiso.hasAccess),
  }
  dialogo.value = true
}

function cerrarDialogo() {
  dialogo.value = false
}

async function guardar() {
  if (!form.value.profileId || !form.value.systemId) {
    $q.notify({ type: 'warning', message: 'Selecciona un perfil y un sistema.' })
    return
  }

  const existente = permisos.value.find(
    (permiso) =>
      String(permiso.profileId) === String(form.value.profileId) &&
      String(permiso.systemId) === String(form.value.systemId) &&
      String(permiso.id) !== String(permisoEditandoId.value),
  )

  if (!modoEdicion.value && existente) {
    $q.notify({ type: 'warning', message: 'Ya existe una relación entre este perfil y sistema.' })
    return
  }

  saving.value = true
  try {
    const payload = {
      systemId: form.value.systemId,
      profileId: form.value.profileId,
      hasAccess: Boolean(form.value.hasAccess),
    }

    if (modoEdicion.value) {
      await permisosApi.actualizarPermiso(permisoEditandoId.value, payload)
      $q.notify({ type: 'positive', message: 'Permiso actualizado correctamente.' })
    } else {
      await permisosApi.crearPermiso(payload)
      $q.notify({ type: 'positive', message: 'Permiso asignado correctamente.' })
    }
    dialogo.value = false
    await cargarTodo()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudo guardar el permiso.',
    })
  } finally {
    saving.value = false
  }
}

function eliminarPermiso(permiso) {
  $q.dialog({
    title: 'Eliminar relación',
    message: `¿Deseas eliminar la relación entre ${nombrePerfil(permiso.profileId)} y ${nombreSistema(permiso.systemId)}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await permisosApi.eliminarPermiso(permiso.id)
      $q.notify({ type: 'positive', message: 'Relación eliminada correctamente.' })
      await cargarTodo()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'No se pudo eliminar la relación.',
      })
    }
  })
}
</script>

<style scoped>
:root {
  --brand-gradient: linear-gradient(135deg, #4f2d8f 0%, #7a42c7 35%, #a64dd8 100%);
  --surface-card: #fff;
  --border-soft: rgba(76, 40, 111, 0.12);
  --text-strong: #211b2d;
  --text-muted: #6f6780;
}

.permisos-page {
  min-height: 100%;
  padding: 28px;
  display: grid;
  gap: 22px;
  background: linear-gradient(180deg, #f7f5fb 0%, #f2f4fb 100%);
}

.permisos-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding: 34px;
  overflow: hidden;
  border-radius: 28px;
  color: #fff;
  background: var(--brand-gradient);
  box-shadow: 0 26px 60px rgba(92, 47, 146, 0.2);
}

.permisos-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-size: 28px 28px;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
}

.hero-chip {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.permisos-hero h1 {
  margin: 10px 0 8px;
  color: #542583;
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  line-height: 0.95;
  font-weight: 950;
}

.permisos-hero p {
  max-width: 700px;
  margin: 0;
  color: #532680;
  font-size: 1rem;
}

.hero-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.secondary-action,
.primary-action {
  background: #5b2d82 !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.secondary-action :deep(.q-btn__content),
.secondary-action :deep(.q-btn__label),
.secondary-action :deep(.q-icon),
.primary-action :deep(.q-btn__content),
.primary-action :deep(.q-btn__label),
.primary-action :deep(.q-icon) {
  color: #fff !important;
}

.primary-action {
  font-weight: 800;
  box-shadow: 0 18px 34px rgba(28, 15, 40, 0.18);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 108px;
  padding: 18px 20px;
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  background: var(--surface-card);
  box-shadow: 0 12px 30px rgba(80, 46, 120, 0.07);
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  flex: 0 0 50px;
  border-radius: 15px;
  color: #fff;
  font-size: 24px;
}

.accent-purple .stat-icon {
  background: #67449a;
}
.accent-green .stat-icon {
  background: #278254;
}
.accent-orange .stat-icon {
  background: #c27a20;
}
.accent-blue .stat-icon {
  background: #287e9c;
}

.stat-text {
  display: grid;
  gap: 4px;
}

.stat-text strong {
  color: var(--text-strong);
  font-size: 2rem;
  line-height: 1;
  font-weight: 900;
}

.stat-text span {
  color: var(--text-muted);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.content-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 14px 36px rgba(80, 46, 120, 0.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px;
  border-bottom: 1px solid var(--border-soft);
}

.panel-header h2 {
  margin: 0 0 7px;
  color: var(--text-strong);
  font-size: 1.12rem;
  font-weight: 900;
}

.panel-header p {
  margin: 0;
  color: var(--text-muted);
}

.search-input {
  min-width: 320px;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 11px;
  padding: 48px 20px;
  text-align: center;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  border-radius: 19px;
  background: #f0e9f8;
  color: #5d2f82;
  font-size: 32px;
}

.empty-state strong {
  color: var(--text-strong);
  font-size: 1.05rem;
}

.empty-state span {
  max-width: 460px;
  color: var(--text-muted);
}

.permisos-table {
  margin: 12px;
  border: 2px solid #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(76, 40, 111, 0.08);
}

.permisos-table :deep(thead tr) {
  background: #4c286f;
}

.permisos-table :deep(thead th) {
  height: 52px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
}

.permisos-table :deep(thead th:last-child) {
  text-align: right;
}

.permisos-table :deep(tbody td) {
  height: 76px;
  border-bottom: 1px solid rgba(76, 40, 111, 0.06);
}

.permisos-table :deep(tbody tr:hover) {
  background: #fcf7fd;
}

.permisos-table :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.relation-entity {
  display: flex;
  align-items: center;
  gap: 11px;
}

.relation-entity > div:last-child {
  display: grid;
  gap: 3px;
}

.relation-entity strong {
  color: var(--text-strong);
  font-weight: 800;
}

.relation-entity span {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.entity-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 13px;
  font-size: 19px;
}

.entity-icon--profile {
  background: #f0e9f8;
  color: #5d2f82;
}

.entity-icon--system {
  background: #e7f1f4;
  color: #286f86;
}

.access-badge {
  padding: 7px 10px;
  font-size: 0.76rem;
  font-weight: 800;
}

.access-badge--granted {
  background: #e5f2e9;
  color: #246b3f;
}

.access-badge--denied {
  background: #f8e9e8;
  color: #9b3833;
}

.system-summary {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.system-summary strong {
  color: var(--text-strong);
  font-size: 1.15rem;
  font-weight: 900;
}

.system-summary span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.relations-badge {
  min-width: 30px;
  justify-content: center;
  background: #f0e9f8;
  color: #5d2f82;
  font-weight: 800;
}

.view-systems-button {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 9px;
  background: #5b2d82 !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 3px 8px rgba(76, 40, 111, 0.18);
  transition:
    background-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.view-systems-button :deep(.q-btn__content),
.view-systems-button :deep(.q-icon) {
  color: #fff !important;
}

.view-systems-button:hover {
  background: #452263 !important;
  box-shadow: 0 5px 12px rgba(76, 40, 111, 0.24);
  transform: translateY(-1px);
}

.assign-button {
  min-height: 36px;
  margin-right: 6px;
  padding: 0 10px;
  border: 1px solid rgba(91, 45, 130, 0.2);
  border-radius: 9px;
  background: #f8f4fb;
  color: #5b2d82 !important;
  font-weight: 700;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.assign-button :deep(.q-btn__content),
.assign-button :deep(.q-icon) {
  color: #5b2d82 !important;
}

.assign-button:hover {
  border-color: rgba(91, 45, 130, 0.38);
  background: #eee5f5;
}

.actions-cell {
  white-space: nowrap;
}

.mobile-permiso-card {
  border-radius: 16px;
}

.mobile-permiso-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.permiso-dialog {
  width: min(620px, 96vw);
  border-radius: 22px;
  overflow: hidden;
}

.systems-dialog {
  width: min(720px, 96vw);
  max-height: 90vh;
  border-radius: 22px;
  overflow: hidden;
}

.systems-dialog__body {
  max-height: 55vh;
  overflow-y: auto;
  padding: 18px 22px;
}

.profile-system-list {
  display: grid;
}

.profile-system-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-soft);
}

.profile-system-row:last-child {
  border-bottom: 0;
}

.profile-system-row__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.profile-system-row__actions .q-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #f7f4fa;
  transition:
    background-color 160ms ease,
    transform 160ms ease;
}

.profile-system-row__actions .q-btn:hover {
  background: #eee7f4;
  transform: translateY(-1px);
}

.systems-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 24px 12px;
  color: var(--text-muted);
  text-align: center;
}

.systems-empty .q-icon {
  color: #5d2f82;
  font-size: 34px;
}

.systems-empty strong {
  color: var(--text-strong);
}

.dialog-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 22px 24px;
  color: #fff;
  background: var(--brand-gradient);
}

.dialog-hero h2 {
  margin: 8px 0 6px;
  color: #fff;
  font-size: 1.45rem;
  font-weight: 900;
}

.dialog-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
}

.dialog-body {
  display: grid;
  gap: 8px;
  padding: 22px;
}

.access-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  background: #fbf9fd;
}

.access-control__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
}

.access-control__icon.is-granted {
  background: #e5f2e9;
  color: #246b3f;
}

.access-control__icon.is-denied {
  background: #f8e9e8;
  color: #9b3833;
}

.access-control__copy {
  display: grid;
  gap: 3px;
  flex: 1;
}

.access-control__copy strong {
  color: var(--text-strong);
}

.access-control__copy span {
  color: var(--text-muted);
  font-size: 0.84rem;
}

.dialog-actions {
  padding: 14px 22px 22px;
}

.dialog-actions :deep(.q-btn) {
  min-width: 140px;
}

.dialog-actions__cancel {
  color: #5b337f;
}

@media (max-width: 900px) {
  .permisos-hero,
  .panel-header {
    flex-direction: column;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .permisos-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .profile-system-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .profile-system-row__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
