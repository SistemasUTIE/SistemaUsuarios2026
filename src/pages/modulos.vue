<template>
  <q-page class="modulos-page">
    <section class="modulos-hero">
      <div class="hero-copy">
        <q-chip class="hero-chip" icon="home" label="Volver a sistemas" @click="volverASistemas" />
        <q-chip class="hero-chip" label="\" />
        <q-chip class="hero-chip" icon="account_tree" label="Estructura del sistema" />
        <h1>Módulos</h1>
      </div>
    </section>

    <section v-if="authStore.tienePermiso('SYSTEM', 'canRead')" class="stats-grid">
      <article class="stat-card accent-purple">
        <div class="stat-icon"><q-icon name="account_tree" /></div>
        <div class="stat-text">
          <strong>{{ modulos.length }}</strong>
          <span>Módulos</span>
        </div>
      </article>
    </section>
    <div class="hero-actions">
      <q-btn
        v-if="authStore.tienePermiso('SYSTEM', 'canRead')"
        rounded
        class="secondary-action"
        icon="refresh"
        label="Actualizar"
        :loading="loading"
        @click="cargarTodo"
      />
      <q-btn
        v-if="authStore.tienePermiso('SYSTEM', 'canCreate')"
        rounded
        class="primary-action"
        icon="add"
        label="Nuevo módulo"
        @click="abrirCrear"
      />
    </div>
    <q-card flat bordered class="content-card">
      <div class="panel-header">
        <div>
          <h2>Directorio de módulos del sistema {{ nombreSistema }}</h2>
          <p>Consulta y organiza los módulos pertenecientes al sistema seleccionado.</p>
        </div>

        <q-input
          v-model="filtro"
          outlined
          dense
          clearable
          class="search-input"
          placeholder="Buscar por nombre, acrónimo o descripción..."
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <q-inner-loading :showing="loading">
        <q-spinner color="primary" size="42px" />
      </q-inner-loading>

      <div
        v-if="!loading && authStore.tienePermiso('SYSTEM', 'canRead') && !modulosFiltrados.length"
        class="empty-state"
      >
        <div class="empty-icon"><q-icon name="account_tree" /></div>
        <strong>Sin módulos para mostrar</strong>
        <span>Crea el primer módulo para comenzar a organizar este sistema.</span>
        <q-btn
          v-if="authStore.tienePermiso('SYSTEM', 'canCreate')"
          unelevated
          rounded
          color="primary"
          icon="add"
          label="Crear módulo"
          @click="abrirCrear"
        />
      </div>

      <q-table
        v-else-if="authStore.tienePermiso('SYSTEM', 'canRead')"
        flat
        bordered
        :rows="modulosFiltrados"
        :columns="columnas"
        row-key="id"
        class="modulos-table"
        :grid="$q.screen.lt.md"
        :pagination="{ sortBy: 'order', descending: false, rowsPerPage: 10 }"
        no-data-label="Sin módulos para mostrar"
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-modulo="props">
          <q-td :props="props">
            <div class="table-modulo">
              <div class="table-modulo-icon"><q-icon name="account_tree" /></div>
              <div>
                <strong>{{ props.row.name }}</strong>
                <span>{{ props.row.acronym || 'Sin acrónimo' }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-orden="props">
          <q-td :props="props">
            <q-badge rounded class="order-badge">{{ props.row.order || 0 }}</q-badge>
          </q-td>
        </template>

        <template #body-cell-descripcion="props">
          <q-td :props="props">
            <span class="description-cell">{{ props.row.description || 'Sin descripción' }}</span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right actions-cell">
            <q-btn
              v-if="authStore.tienePermiso('SYSTEM', 'canUpdate')"
              flat
              round
              icon="edit"
              color="primary"
              @click="abrirEditar(props.row)"
            >
              <q-tooltip>Editar módulo</q-tooltip>
            </q-btn>
            <q-btn
              v-if="authStore.tienePermiso('SYSTEM', 'canDelete')"
              flat
              round
              icon="delete_outline"
              color="negative"
              @click="eliminarModulo(props.row)"
            >
              <q-tooltip>Eliminar módulo</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #item="props">
          <div class="q-pa-xs col-12">
            <q-card flat bordered class="mobile-modulo-card">
              <q-card-section class="mobile-modulo-card__head">
                <div class="table-modulo">
                  <div class="table-modulo-icon"><q-icon name="account_tree" /></div>
                  <div>
                    <strong>{{ props.row.name }}</strong>
                    <span>{{ props.row.acronym || 'Sin acrónimo' }}</span>
                  </div>
                </div>
                <q-badge rounded class="order-badge">Orden {{ props.row.order || 0 }}</q-badge>
              </q-card-section>

              <q-separator />

              <q-card-section class="mobile-modulo-card__body">
                <div class="mobile-field mobile-field--full">
                  <span>Descripción</span>
                  <strong>{{ props.row.description || 'Sin descripción' }}</strong>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  v-if="authStore.tienePermiso('SYSTEM', 'canUpdate')"
                  unelevated
                  dense
                  no-caps
                  icon="edit"
                  label="Editar"
                  color="primary"
                  @click="abrirEditar(props.row)"
                />
                <q-btn
                  v-if="authStore.tienePermiso('SYSTEM', 'canDelete')"
                  flat
                  dense
                  no-caps
                  icon="delete_outline"
                  label="Eliminar"
                  color="negative"
                  @click="eliminarModulo(props.row)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
      <div v-else class="empty-state">
        <strong>No tienes permiso para consultar los módulos.</strong>
      </div>
    </q-card>

    <q-dialog v-model="dialogo" persistent>
      <q-card class="modulo-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip
              dense
              class="hero-chip"
              :label="modoEdicion ? 'Editar módulo' : 'Nuevo módulo'"
            />
            <h2>{{ modoEdicion ? 'Actualizar módulo' : 'Registrar módulo' }}</h2>
            <p>El módulo quedará asociado automáticamente a {{ nombreSistema }}.</p>
          </div>
          <q-btn flat round icon="close" color="white" @click="cerrarDialogo" />
        </div>

        <q-card-section class="dialog-body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model.number="form.order" type="number" min="0" outlined label="Orden *">
                <template #prepend><q-icon name="sort" /></template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.name"
                outlined
                label="Nombre del módulo *"
                :rules="[(val) => !!val || 'El nombre es requerido']"
              >
                <template #prepend><q-icon name="account_tree" /></template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.acronym" outlined label="Acrónimo">
                <template #prepend><q-icon name="short_text" /></template>
              </q-input>
            </div>

            <div class="col-12">
              <q-input
                v-model="form.description"
                outlined
                type="textarea"
                rows="4"
                label="Descripción"
              >
                <template #prepend><q-icon name="notes" /></template>
              </q-input>
            </div>
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
            :label="modoEdicion ? 'Guardar cambios' : 'Crear módulo'"
            :loading="saving"
            class="dialog-actions__save"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { modulosApi } from '../api/modulos.api'
import { useAuthStore } from '../stores/auth.store'

const $q = useQuasar()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const systemId = String(route.params.systemId || '')
const nombreSistema = computed(() => String(route.query.systemName || 'sistema seleccionado'))

const loading = ref(false)
const saving = ref(false)
const dialogo = ref(false)
const modoEdicion = ref(false)
const moduloEditandoId = ref(null)
const filtro = ref('')
const modulos = ref([])

const formBase = () => ({
  order: 0,
  systemId,
  name: '',
  acronym: '',
  description: '',
})

const form = ref(formBase())

const columnas = [
  { name: 'modulo', label: 'Módulo', field: 'name', align: 'left' },
  { name: 'orden', label: 'Orden', field: 'order', align: 'center' },
  { name: 'descripcion', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'right' },
]

const modulosFiltrados = computed(() => {
  const q = filtro.value?.trim().toLowerCase()

  return modulos.value.filter((modulo) => {
    if (!q) return true

    return [modulo.name, modulo.acronym, modulo.description]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(q))
  })
})

onMounted(() => {
  if (authStore.tienePermiso('SYSTEM', 'canRead')) cargarTodo()
})

async function cargarTodo() {
  if (!authStore.tienePermiso('SYSTEM', 'canRead')) return
  if (!systemId) {
    $q.notify({ type: 'negative', message: 'No se recibió el sistema seleccionado.' })
    return
  }

  loading.value = true
  try {
    const response = await modulosApi.obtenerModulosPorSistema(systemId)
    modulos.value = response.data.data || response.data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar los módulos.',
    })
  } finally {
    loading.value = false
  }
}

function volverASistemas() {
  router.push({ name: 'sistemas' })
}

function abrirCrear() {
  if (!authStore.tienePermiso('SYSTEM', 'canCreate')) return
  modoEdicion.value = false
  moduloEditandoId.value = null
  form.value = formBase()
  dialogo.value = true
}

function abrirEditar(modulo) {
  if (!authStore.tienePermiso('SYSTEM', 'canUpdate')) return
  modoEdicion.value = true
  moduloEditandoId.value = modulo.id
  form.value = {
    order: Number(modulo.order || 0),
    systemId,
    name: modulo.name || '',
    acronym: modulo.acronym || '',
    description: modulo.description || '',
  }
  dialogo.value = true
}

function cerrarDialogo() {
  dialogo.value = false
}

async function guardar() {
  const permisoNecesario = modoEdicion.value ? 'canUpdate' : 'canCreate'
  if (!authStore.tienePermiso('SYSTEM', permisoNecesario)) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para guardar este módulo.' })
    return
  }
  if (!form.value.name?.trim()) {
    $q.notify({ type: 'warning', message: 'El nombre del módulo es obligatorio.' })
    return
  }

  saving.value = true

  try {
    const payload = {
      order: Number(form.value.order || 0),
      systemId,
      name: form.value.name.trim(),
      acronym: form.value.acronym?.trim() || '',
      description: form.value.description?.trim() || '',
    }

    if (modoEdicion.value) {
      await modulosApi.actualizarModulo(moduloEditandoId.value, payload)
      $q.notify({ type: 'positive', message: 'Módulo actualizado correctamente.' })
    } else {
      await modulosApi.crearModulo(payload)
      $q.notify({ type: 'positive', message: 'Módulo creado correctamente.' })
    }

    dialogo.value = false
    await cargarTodo()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudo guardar el módulo.',
    })
  } finally {
    saving.value = false
  }
}

function eliminarModulo(modulo) {
  if (!authStore.tienePermiso('SYSTEM', 'canDelete')) return
  $q.dialog({
    title: 'Eliminar módulo',
    message: `¿Deseas eliminar el módulo "${modulo.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await modulosApi.eliminarModulo(modulo.id)
      $q.notify({ type: 'positive', message: 'Módulo eliminado correctamente.' })
      await cargarTodo()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'No se pudo eliminar el módulo.',
      })
    }
  })
}
</script>

<style scoped>
:root {
  --brand-gradient: linear-gradient(135deg, #4f2d8f 0%, #7a42c7 35%, #a64dd8 100%);
  --surface-soft: #f7f3ff;
  --surface-card: #ffffff;
  --border-soft: rgba(94, 54, 134, 0.12);
  --text-strong: #211b2d;
  --text-muted: #6f6780;
}

.modulos-page {
  min-height: 100%;
  padding: 28px;
  display: grid;
  gap: 22px;
  background:
    radial-gradient(circle at top left, rgba(173, 128, 255, 0.12), transparent 20%),
    linear-gradient(180deg, #f7f5fb 0%, #f2f4fb 100%);
}

.modulos-hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 22px;
  overflow: hidden;
  padding: 28px 34px 34px;
  border-radius: 28px;
  color: #fff;
  background: var(--brand-gradient);
  box-shadow: 0 26px 60px rgba(92, 47, 146, 0.25);
}

.modulos-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.36;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
}

.back-button {
  margin-bottom: 14px;
  padding-left: 0;
  color: rgba(255, 255, 255, 0.86);
}

.hero-chip {
  background: rgba(255, 255, 255, 0.12);
  color: #532680;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.hero-chip :deep(.q-icon) {
  color: #532680 !important;
}

.hero-copy h1 {
  color: rgba(84, 37, 131, 0.82);
}

.modulos-hero h1 {
  margin: 10px 0 8px;
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  line-height: 0.95;
  font-weight: 950;
  letter-spacing: -0.06em;
}

.modulos-hero p {
  margin: 0;
  max-width: 700px;
  color: rgba(83, 4, 4, 0.82);
}

.modulos-hero p strong {
  color: #fff;
}

.hero-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-copy h1 {
  color: rgba(84, 37, 131, 0.82);
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
  min-height: 116px;
  padding: 18px 20px;
  border: 1px solid var(--border-soft);
  border-radius: 22px;
  background: var(--surface-card);
  box-shadow: 0 18px 40px rgba(80, 46, 120, 0.08);
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  color: #fff;
}

.accent-purple .stat-icon {
  background: linear-gradient(135deg, #5f45a9, #8d5be3);
}
.accent-blue .stat-icon {
  background: linear-gradient(135deg, #168db8, #3ec6d7);
}
.accent-green .stat-icon {
  background: linear-gradient(135deg, #1b9c63, #4bc98c);
}
.accent-orange .stat-icon {
  background: linear-gradient(135deg, #d8851d, #f2b544);
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

.stat-text span,
.mobile-field span {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.content-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 44px rgba(80, 46, 120, 0.07);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 22px 18px;
  border-bottom: 1px solid var(--border-soft);
}

.panel-header h2 {
  margin: 0 0 8px;
  color: var(--text-strong);
  font-size: 1.12rem;
  font-weight: 900;
}

.panel-header p {
  margin: 0;
  color: var(--text-muted);
}

.search-input {
  min-width: 340px;
}

.filters-bar {
  padding: 18px 22px 10px;
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 42px 20px 48px;
  text-align: center;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(111, 68, 181, 0.12), rgba(166, 77, 216, 0.16));
}

.empty-icon .q-icon,
.table-modulo-icon {
  color: #5d2f88;
}

.empty-icon .q-icon {
  font-size: 34px;
}

.empty-state strong,
.table-modulo strong {
  color: var(--text-strong);
}

.empty-state span,
.table-modulo span,
.description-cell {
  color: var(--text-muted);
}

.empty-state span {
  max-width: 440px;
}

.modulos-table {
  margin: 12px 18px 18px;
  background: transparent;
  border: 2px solid #6a4389;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(76, 40, 111, 0.08);
}

.modulos-table :deep(thead tr) {
  background: #4c286f;
}

.modulos-table :deep(thead th) {
  height: 52px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  border-bottom: 0;
}

.modulos-table :deep(thead th:last-child) {
  text-align: right;
}

.modulos-table :deep(tbody td) {
  height: 78px;
  padding-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(76, 40, 111, 0.06);
}

.modulos-table :deep(tbody tr:hover) {
  background: #faf7fd;
}

.modulos-table :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.table-modulo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-modulo > div:last-child {
  display: grid;
  gap: 3px;
}

.table-modulo strong {
  font-weight: 900;
}

.table-modulo span {
  font-size: 0.85rem;
}

.table-modulo-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(111, 68, 181, 0.12), rgba(166, 77, 216, 0.15));
  font-size: 22px;
}

.description-cell {
  display: inline-block;
  max-width: 460px;
}

.order-badge {
  background: #f0e8fb;
  color: #5d2f88;
  font-weight: 800;
}

.actions-cell {
  white-space: nowrap;
}

.mobile-modulo-card {
  border-radius: 22px;
}

.mobile-modulo-card__head,
.mobile-modulo-card__body {
  display: grid;
  gap: 12px;
}

.mobile-field {
  display: grid;
  gap: 4px;
}

.mobile-field strong {
  color: var(--text-strong);
}

.mobile-field--full {
  grid-column: 1 / -1;
}

.modulo-dialog {
  width: min(760px, 96vw);
  border-radius: 26px;
  overflow: hidden;
}

.dialog-hero {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  padding: 22px 24px;
  color: #fff;
  background: var(--brand-gradient);
}

.dialog-hero h2 {
  margin: 8px 0 6px;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 900;
}

.dialog-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
}

.dialog-body {
  padding: 22px;
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
  .modulos-hero,
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
    min-width: 100%;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .modulos-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
