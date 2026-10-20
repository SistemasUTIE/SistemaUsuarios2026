<template>
  <q-page class="sistemas-page">
    <section class="sistemas-hero">
      <div class="hero-copy">
        <q-chip class="hero-chip" icon="apps" label="Gestión de sistemas" />
        <h1>Sistemas</h1>
      </div>
    </section>

    <section v-if="authStore.tienePermiso('SYSTEM', 'canRead')" class="stats-grid">
      <article class="stat-card accent-purple">
        <div class="stat-icon">
          <q-icon name="apps" />
        </div>
        <div class="stat-text">
          <strong>{{ sistemas.length }}</strong>
          <span>Sistemas registrados</span>
        </div>
      </article>

      <article class="stat-card accent-green">
        <div class="stat-icon">
          <q-icon name="check_circle" />
        </div>
        <div class="stat-text">
          <strong>{{ sistemasConUrl }}</strong>
          <span>Con URL registrada</span>
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
        label="Nuevo sistema"
        @click="abrirCrear"
      />
    </div>
    <q-card flat bordered class="content-card">
      <div class="panel-header">
        <div>
          <h2>Directorio de sistemas</h2>
        </div>

        <q-input
          v-model="filtro"
          outlined
          dense
          clearable
          class="search-input"
          placeholder="Buscar por nombre, acrónimo o URL..."
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner color="primary" size="42px" />
      </q-inner-loading>

      <div
        v-if="!loading && authStore.tienePermiso('SYSTEM', 'canRead') && !sistemasFiltrados.length"
        class="empty-state"
      >
        <div class="empty-icon">
          <q-icon name="apps" />
        </div>
        <strong>Sin sistemas para mostrar</strong>
        <span>Crea el primer sistema para registrar la estructura digital del instituto.</span>
        <q-btn
          v-if="authStore.tienePermiso('SYSTEM', 'canCreate')"
          unelevated
          rounded
          color="primary"
          icon="add"
          label="Crear sistema"
          @click="abrirCrear"
        />
      </div>

      <q-table
        v-else-if="authStore.tienePermiso('SYSTEM', 'canRead')"
        flat
        bordered
        :rows="sistemasFiltrados"
        :columns="columnas"
        row-key="id"
        class="sistemas-table"
        :grid="$q.screen.lt.md"
        :pagination="{ sortBy: 'id', descending: false, rowsPerPage: 10 }"
        no-data-label="Sin sistemas para mostrar"
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-sistema="props">
          <q-td :props="props">
            <div class="table-sistema">
              <div class="table-sistema-icon">
                <q-icon name="apps" />
              </div>
              <div>
                <strong>{{ props.row.name }}</strong>
                <span
                  >{{ props.row.acronym || 'Sin acrónimo' }} ·
                  {{ props.row.url || 'Sin URL' }}</span
                >
              </div>
            </div>
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
              v-if="authStore.tienePermiso('SYSTEM', 'canRead')"
              flat
              round
              icon="account_tree"
              color="secondary"
              @click="abrirModulos(props.row)"
            >
              <q-tooltip>Administrar módulos</q-tooltip>
            </q-btn>
            <q-btn
              v-if="authStore.tienePermiso('SYSTEM', 'canUpdate')"
              flat
              round
              icon="edit"
              color="primary"
              @click="abrirEditar(props.row)"
            >
              <q-tooltip>Editar sistema</q-tooltip>
            </q-btn>
            <q-btn
              v-if="authStore.tienePermiso('SYSTEM', 'canDelete')"
              flat
              round
              icon="delete_outline"
              color="negative"
              @click="eliminarSistema(props.row)"
            >
              <q-tooltip>Eliminar sistema</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #item="props">
          <div class="q-pa-xs col-12">
            <q-card flat bordered class="mobile-sistema-card">
              <q-card-section class="mobile-sistema-card__head">
                <div class="table-sistema">
                  <div class="table-sistema-icon">
                    <q-icon name="apps" />
                  </div>
                  <div>
                    <strong>{{ props.row.name }}</strong>
                    <span>{{ props.row.acronym || 'Sin acrónimo' }}</span>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="mobile-sistema-card__body">
                <div class="mobile-field">
                  <span>URL</span>
                  <strong>{{ props.row.url || 'Sin URL' }}</strong>
                </div>
                <div class="mobile-field mobile-field--full">
                  <span>Descripción</span>
                  <strong>{{ props.row.description || 'Sin descripción' }}</strong>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  v-if="authStore.tienePermiso('SYSTEM', 'canRead')"
                  flat
                  dense
                  no-caps
                  icon="account_tree"
                  label="Módulos"
                  color="secondary"
                  @click="abrirModulos(props.row)"
                />
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
                  @click="eliminarSistema(props.row)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
      <div v-else class="empty-state">
        <strong>No tienes permiso para consultar sistemas.</strong>
      </div>
    </q-card>

    <q-dialog v-model="dialogo" persistent>
      <q-card class="sistema-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip
              dense
              class="hero-chip"
              :label="modoEdicion ? 'Editar sistema' : 'Nuevo sistema'"
            />
            <h2>{{ modoEdicion ? 'Actualizar sistema' : 'Registrar sistema' }}</h2>
            <p>Captura la información principal del sistema para su administración y acceso.</p>
          </div>
          <q-btn flat round icon="close" color="white" @click="cerrarDialogo" />
        </div>

        <q-card-section class="dialog-body">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.name"
                outlined
                label="Nombre del sistema *"
                :rules="[(val) => !!val || 'El nombre es requerido']"
              >
                <template #prepend>
                  <q-icon name="apps" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.acronym" outlined label="Acrónimo">
                <template #prepend>
                  <q-icon name="short_text" />
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-input
                v-model="form.description"
                outlined
                type="textarea"
                rows="3"
                label="Descripción"
              >
                <template #prepend>
                  <q-icon name="notes" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.logoUrl" outlined label="Logo URL">
                <template #prepend>
                  <q-icon name="image" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.url" outlined label="URL">
                <template #prepend>
                  <q-icon name="language" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model="form.version" outlined label="Versión">
                <template #prepend>
                  <q-icon name="info" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model="form.port" outlined label="Puerto">
                <template #prepend>
                  <q-icon name="settings_ethernet" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-4">
              <q-input v-model="form.smtp" outlined label="SMTP">
                <template #prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.email" outlined type="email" label="Correo electrónico">
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input v-model="form.password" outlined type="password" label="Contraseña">
                <template #prepend>
                  <q-icon name="vpn_key" />
                </template>
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
            :label="modoEdicion ? 'Guardar cambios' : 'Crear sistema'"
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
import { useRouter } from 'vue-router'
import { sistemasApi } from '../api/sistemas.api'
import { useAuthStore } from '../stores/auth.store'

const $q = useQuasar()
const authStore = useAuthStore()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const dialogo = ref(false)
const modoEdicion = ref(false)
const sistemaEditandoId = ref(null)
const filtro = ref('')

const sistemas = ref([])

const formBase = () => ({
  name: '',
  acronym: '',
  description: '',
  logoUrl: '',
  url: '',
  version: '',
  email: '',
  password: '',
  port: '',
  smtp: '',
})

const form = ref(formBase())

const columnas = [
  { name: 'sistema', label: 'Sistema', field: 'name', align: 'left' },
  { name: 'descripcion', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'right' },
]

const sistemasFiltrados = computed(() => {
  const q = filtro.value?.trim().toLowerCase()

  return sistemas.value.filter((sistema) => {
    if (!q) return true

    return [sistema.name, sistema.acronym, sistema.description, sistema.url]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(q))
  })
})

const sistemasConUrl = computed(
  () => sistemas.value.filter((sistema) => sistema.url && sistema.url.trim()).length,
)

onMounted(() => {
  if (authStore.tienePermiso('SYSTEM', 'canRead')) cargarTodo()
})

async function cargarTodo() {
  if (!authStore.tienePermiso('SYSTEM', 'canRead')) return
  loading.value = true
  try {
    const response = await sistemasApi.obtenerSistemas()
    sistemas.value = response.data.data || response.data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar los sistemas.',
    })
  } finally {
    loading.value = false
  }
}

function abrirCrear() {
  if (!authStore.tienePermiso('SYSTEM', 'canCreate')) return
  modoEdicion.value = false
  sistemaEditandoId.value = null
  form.value = formBase()
  dialogo.value = true
}

function abrirModulos(sistema) {
  if (!authStore.tienePermiso('SYSTEM', 'canRead')) return
  router.push({
    name: 'modulos',
    params: { systemId: sistema.id },
    query: { systemName: sistema.name },
  })
}

function abrirEditar(sistema) {
  if (!authStore.tienePermiso('SYSTEM', 'canUpdate')) return
  modoEdicion.value = true
  sistemaEditandoId.value = sistema.id
  form.value = {
    name: sistema.name || '',
    acronym: sistema.acronym || '',
    description: sistema.description || '',
    logoUrl: sistema.logoUrl || '',
    url: sistema.url || '',
    version: sistema.version || '',
    email: sistema.email || '',
    password: sistema.password || '',
    port: sistema.port ?? '',
    smtp: sistema.smtp || '',
  }
  dialogo.value = true
}

function cerrarDialogo() {
  dialogo.value = false
}

async function guardar() {
  const permisoNecesario = modoEdicion.value ? 'canUpdate' : 'canCreate'
  if (!authStore.tienePermiso('SYSTEM', permisoNecesario)) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para guardar este sistema.' })
    return
  }
  if (!form.value.name?.trim()) {
    $q.notify({ type: 'warning', message: 'El nombre del sistema es obligatorio.' })
    return
  }

  saving.value = true

  try {
    const payload = {
      name: form.value.name.trim(),
      acronym: form.value.acronym?.trim() || '',
      description: form.value.description?.trim() || '',
      logoUrl: form.value.logoUrl?.trim() || '',
      url: form.value.url?.trim() || '',
      version: form.value.version?.trim() || '',
      email: form.value.email?.trim() || '',
      password: form.value.password?.trim() || '',
      port: form.value.port === '' ? null : Number(form.value.port),
      smtp: form.value.smtp?.trim() || '',
    }

    if (modoEdicion.value) {
      await sistemasApi.actualizarSistema(sistemaEditandoId.value, payload)
      $q.notify({ type: 'positive', message: 'Sistema actualizado correctamente.' })
    } else {
      await sistemasApi.crearSistema(payload)
      $q.notify({ type: 'positive', message: 'Sistema creado correctamente.' })
    }

    dialogo.value = false
    await cargarTodo()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudo guardar el sistema.',
    })
  } finally {
    saving.value = false
  }
}

function eliminarSistema(sistema) {
  if (!authStore.tienePermiso('SYSTEM', 'canDelete')) return
  $q.dialog({
    title: 'Eliminar sistema',
    message: `¿Deseas eliminar el sistema "${sistema.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await sistemasApi.eliminarSistema(sistema.id)
      $q.notify({ type: 'positive', message: 'Sistema eliminado correctamente.' })
      await cargarTodo()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'No se pudo eliminar el sistema.',
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

.sistemas-page {
  min-height: 100%;
  padding: 28px;
  display: grid;
  gap: 22px;
  background:
    radial-gradient(circle at top left, rgba(173, 128, 255, 0.12), transparent 20%),
    linear-gradient(180deg, #f7f5fb 0%, #f2f4fb 100%);
}

.sistemas-hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  align-items: center;
  gap: 22px;
  padding: 34px;
  border-radius: 28px;
  color: #fff;
  background: var(--brand-gradient);
  box-shadow: 0 26px 60px rgba(92, 47, 146, 0.25);
}

.sistemas-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-size: 24px 24px;
  opacity: 0.36;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
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

.sistemas-hero h1 {
  margin: 10px 0 8px;
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  line-height: 0.95;
  font-weight: 950;
  letter-spacing: -0.06em;
}

.sistemas-hero p {
  margin: 0;
  max-width: 700px;
  color: rgba(83, 4, 4, 0.82);
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
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: none;
}

.secondary-action :deep(.q-btn__content),
.secondary-action :deep(.q-btn__label),
.secondary-action :deep(.q-icon),
.secondary-action :deep(.material-icons),
.primary-action :deep(.q-btn__content),
.primary-action :deep(.q-btn__label),
.primary-action :deep(.q-icon),
.primary-action :deep(.material-icons),
.secondary-action :deep(.q-btn__label span),
.primary-action :deep(.q-btn__label span) {
  color: #ffffff !important;
  fill: #ffffff !important;
}

.secondary-action {
  font-weight: 700;
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
  font-size: 2rem;
  line-height: 1;
  color: var(--text-strong);
  font-weight: 900;
}

.stat-text span {
  color: var(--text-muted);
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 700;
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
  min-width: 320px;
}

.filters-bar {
  display: flex;
  align-items: center;
  gap: 12px;
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

.empty-icon .q-icon {
  font-size: 34px;
  color: #5d2f88;
}

.empty-state strong {
  color: var(--text-strong);
  font-size: 1.05rem;
}

.empty-state span {
  color: var(--text-muted);
  max-width: 440px;
}

.sistemas-table {
  margin: 12px 18px 18px;
  background: transparent;
  border: 2px solid #6a4389;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(76, 40, 111, 0.08);
}

.sistemas-table :deep(thead tr) {
  background: #4c286f;
}

.sistemas-table :deep(thead th) {
  height: 52px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  border-bottom: 0;
}

.sistemas-table :deep(thead th:last-child) {
  text-align: right;
}

.sistemas-table :deep(tbody td) {
  height: 78px;
  padding-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(76, 40, 111, 0.06);
}

.sistemas-table :deep(tbody tr:hover) {
  background: #faf7fd;
}

.sistemas-table :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.table-sistema {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-sistema > div:last-child {
  display: grid;
  gap: 3px;
}

.table-sistema strong {
  color: var(--text-strong);
  font-weight: 900;
}

.table-sistema span {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

.table-sistema-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(111, 68, 181, 0.12), rgba(166, 77, 216, 0.15));
  color: #5d2f88;
  font-size: 22px;
}

.description-cell {
  display: inline-block;
  max-width: 460px;
  color: var(--text-muted);
}

.actions-cell {
  white-space: nowrap;
}

.mobile-sistema-card {
  border-radius: 22px;
}

.mobile-sistema-card__head,
.mobile-sistema-card__body {
  display: grid;
  gap: 12px;
}

.mobile-field {
  display: grid;
  gap: 4px;
}

.mobile-field span {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mobile-field--full {
  grid-column: 1 / -1;
}

.sistema-dialog {
  width: min(860px, 96vw);
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

.dialog-actions__save {
  box-shadow: 0 18px 34px rgba(117, 76, 188, 0.22);
}

@media (max-width: 900px) {
  .sistemas-hero,
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
  .sistemas-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
