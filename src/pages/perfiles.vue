<template>
  <q-page class="perfiles-page">
    <section class="perfiles-hero">
      <div class="hero-copy">
        <q-chip class="hero-chip" icon="badge" label="Gestión de perfiles" />
        <h1>Perfiles</h1>
      </div>
    </section>
    <div class="hero-actions">
      <q-btn
        v-if="authStore.tienePermiso('PER', 'canRead')"
        rounded
        class="secondary-action"
        icon="refresh"
        label="Actualizar"
        :loading="loading"
        @click="cargarTodo"
      />
      <q-btn
        v-if="authStore.tienePermiso('PER', 'canCreate')"
        rounded
        class="primary-action"
        icon="add"
        label="Nuevo perfil"
        @click="abrirCrear"
      />
    </div>
    <q-card flat bordered class="content-card">
      <div class="panel-header">
        <div>
          <h2>Directorio de perfiles</h2>
          <p>Consulta y administra los perfiles del sistema con un control claro y moderno.</p>
        </div>

        <q-input
          v-model="filtro"
          outlined
          dense
          clearable
          class="search-input"
          placeholder="Buscar por nombre o descripción..."
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
        v-if="!loading && authStore.tienePermiso('PER', 'canRead') && !perfilesFiltrados.length"
        class="empty-state"
      >
        <div class="empty-icon">
          <q-icon name="badge" />
        </div>
        <strong>Sin perfiles para mostrar</strong>
        <span>Crea el primer perfil para comenzar a organizar la estructura del sistema.</span>
        <q-btn
          v-if="authStore.tienePermiso('PER', 'canCreate')"
          unelevated
          rounded
          color="primary"
          icon="add"
          label="Crear perfil"
          @click="abrirCrear"
        />
      </div>

      <q-table
        v-else-if="authStore.tienePermiso('PER', 'canRead')"
        :rows="perfilesFiltrados"
        :columns="columnas"
        row-key="id"
        class="perfiles-table"
        :grid="$q.screen.lt.md"
        :pagination="{
          sortBy: 'id',
          descending: false,
          rowsPerPage: 10,
        }"
        no-data-label="Sin perfiles para mostrar"
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-perfil="props">
          <q-td :props="props">
            <div class="table-perfil">
              <div class="table-perfil-icon">
                <q-icon name="badge" />
              </div>
              <div>
                <strong>{{ props.row.name }}</strong>
                <span>{{ props.row.description || 'Perfil institucional' }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-sistemas="props">
          <q-td :props="props">
            <div class="profile-system-summary">
              <strong>{{ props.row.sistemasConAcceso.length }}</strong>
              <span>de {{ props.row.relaciones.length }} sistemas con acceso</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right actions-cell">
            <q-btn
              v-if="authStore.tienePermiso('PER', 'canCreate')"
              flat
              round
              icon="add_link"
              color="secondary"
              @click="abrirAsignarSistema(props.row)"
            >
              <q-tooltip>Asignar sistema</q-tooltip>
            </q-btn>
            <q-btn
              v-if="authStore.tienePermiso('PER', 'canRead')"
              flat
              round
              icon="visibility"
              color="primary"
              @click="abrirSistemasPerfil(props.row)"
            >
              <q-tooltip>Ver sistemas y accesos</q-tooltip>
            </q-btn>
            <q-btn
              v-if="authStore.tienePermiso('PER', 'canUpdate')"
              flat
              round
              icon="edit"
              color="primary"
              @click="abrirEditar(props.row)"
            >
              <q-tooltip>Editar perfil</q-tooltip>
            </q-btn>
            <q-btn
              v-if="authStore.tienePermiso('PER', 'canDelete')"
              flat
              round
              icon="delete_outline"
              color="negative"
              @click="eliminarPerfil(props.row)"
            >
              <q-tooltip>Eliminar perfil</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #item="props">
          <div class="q-pa-xs col-12">
            <q-card flat bordered class="mobile-perfil-card">
              <q-card-section class="mobile-perfil-card__head">
                <div class="table-perfil">
                  <div class="table-perfil-icon">
                    <q-icon name="badge" />
                  </div>
                  <div>
                    <strong>{{ props.row.name }}</strong>
                    <span>ID: {{ props.row.id }}</span>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="mobile-perfil-card__body">
                <div class="mobile-field mobile-field--full">
                  <span>Descripción</span>
                  <strong>{{ props.row.description || 'Sin descripción' }}</strong>
                </div>
                <div class="mobile-field mobile-field--full">
                  <span>Sistemas con acceso</span>
                  <strong>
                    {{ props.row.sistemasConAcceso.length }} de
                    {{ props.row.relaciones.length }} asignados
                  </strong>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn
                  v-if="authStore.tienePermiso('PER', 'canCreate')"
                  flat
                  dense
                  no-caps
                  icon="add_link"
                  label="Asignar sistema"
                  color="secondary"
                  @click="abrirAsignarSistema(props.row)"
                />
                <q-btn
                  v-if="authStore.tienePermiso('PER', 'canRead')"
                  flat
                  dense
                  no-caps
                  icon="visibility"
                  label="Ver sistemas"
                  color="primary"
                  @click="abrirSistemasPerfil(props.row)"
                />
                <q-btn
                  v-if="authStore.tienePermiso('PER', 'canUpdate')"
                  unelevated
                  dense
                  no-caps
                  icon="edit"
                  label="Editar"
                  color="primary"
                  @click="abrirEditar(props.row)"
                />
                <q-btn
                  v-if="authStore.tienePermiso('PER', 'canDelete')"
                  flat
                  dense
                  no-caps
                  icon="delete_outline"
                  label="Eliminar"
                  color="negative"
                  @click="eliminarPerfil(props.row)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
      <div v-else class="empty-state">
        <strong>No tienes permiso para consultar perfiles.</strong>
      </div>
    </q-card>

    <q-dialog v-model="dialogo" persistent>
      <q-card class="perfil-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip
              dense
              class="hero-chip"
              :label="modoEdicion ? 'Editar perfil' : 'Nuevo perfil'"
            />
            <h2>{{ modoEdicion ? 'Actualizar perfil' : 'Registrar perfil' }}</h2>
            <p>Captura la información base para crear o modificar un perfil del sistema.</p>
          </div>
          <q-btn flat round icon="close" color="white" @click="cerrarDialogo" />
        </div>

        <q-card-section class="dialog-body">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model="form.name"
                outlined
                label="Nombre del perfil *"
                :rules="[(val) => !!val || 'El nombre es requerido']"
              >
                <template #prepend>
                  <q-icon name="badge" />
                </template>
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
                <template #prepend>
                  <q-icon name="notes" />
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
            v-if="authStore.tienePermiso('PER', modoEdicion ? 'canUpdate' : 'canCreate')"
            unelevated
            color="primary"
            icon="save"
            :label="modoEdicion ? 'Guardar cambios' : 'Crear perfil'"
            :loading="saving"
            class="dialog-actions__save"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoRelacion" persistent>
      <q-card class="perfil-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip dense class="hero-chip" icon="apps" label="Acceso a sistemas" />
            <h2>{{ modoEdicionRelacion ? 'Editar acceso' : 'Asignar sistema' }}</h2>
            <p>{{ perfilDeRelacion?.name }}</p>
          </div>
          <q-btn flat round icon="close" color="white" @click="cerrarDialogoRelacion" />
        </div>

        <q-card-section class="dialog-body">
          <q-select
            v-model="formRelacion.systemId"
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
            <div
              class="access-control__icon"
              :class="formRelacion.hasAccess ? 'is-granted' : 'is-denied'"
            >
              <q-icon :name="formRelacion.hasAccess ? 'lock_open' : 'lock'" />
            </div>
            <div class="access-control__copy">
              <strong>{{ formRelacion.hasAccess ? 'Acceso permitido' : 'Acceso denegado' }}</strong>
              <span>{{
                formRelacion.hasAccess
                  ? 'Este perfil podrá acceder al sistema.'
                  : 'Este perfil no podrá acceder al sistema.'
              }}</span>
            </div>
            <q-toggle
              v-model="formRelacion.hasAccess"
              color="positive"
              aria-label="Permitir acceso"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat color="grey-7" label="Cancelar" @click="cerrarDialogoRelacion" />
          <q-btn
            v-if="authStore.tienePermiso('PER', modoEdicionRelacion ? 'canUpdate' : 'canCreate')"
            unelevated
            color="primary"
            icon="save"
            :label="modoEdicionRelacion ? 'Guardar cambios' : 'Asignar sistema'"
            :loading="savingRelacion"
            @click="guardarRelacion"
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
            <p>Administra los sistemas asociados y sus permisos de acceso.</p>
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
                    relacion.hasAccess ? 'Este perfil puede acceder' : 'Acceso bloqueado'
                  }}</span>
                </div>
              </div>
              <q-badge
                :color="relacion.hasAccess ? 'positive' : 'negative'"
                :label="relacion.hasAccess ? 'Con acceso' : 'Sin acceso'"
              />
              <div class="profile-system-row__actions">
                <q-btn
                  v-if="relacion.hasAccess && authStore.tienePermiso('PER', 'canRead')"
                  flat
                  round
                  dense
                  icon="admin_panel_settings"
                  color="secondary"
                  :aria-label="`Configurar permisos de módulos de ${nombreSistema(relacion.systemId)}`"
                  @click="abrirPermisosModulos(relacion)"
                >
                  <q-tooltip>Configurar permisos de módulos</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="authStore.tienePermiso('PER', 'canUpdate')"
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  aria-label="Editar acceso"
                  @click="editarRelacion(relacion)"
                >
                  <q-tooltip>Editar acceso</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="authStore.tienePermiso('PER', 'canDelete')"
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="negative"
                  aria-label="Eliminar asignación"
                  @click="eliminarRelacion(relacion)"
                >
                  <q-tooltip>Eliminar asignación</q-tooltip>
                </q-btn>
              </div>
            </article>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat color="grey-7" label="Cerrar" @click="dialogoSistemas = false" />
          <q-btn
            v-if="authStore.tienePermiso('PER', 'canCreate')"
            unelevated
            color="primary"
            icon="add_link"
            label="Asignar sistema"
            @click="asignarSistemaSeleccionado"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoModulos" persistent>
      <q-card class="module-permissions-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip dense class="hero-chip" icon="account_tree" label="Permisos de módulos" />
            <h2 class="text-black">{{ sistemaSeleccionadoNombre }}</h2>
            <p class="text-black">{{ 'Perfil del usuario: ' + perfilSeleccionado?.name }}</p>
          </div>
          <q-btn
            flat
            round
            icon="close"
            color="black"
            aria-label="Cerrar"
            :disable="savingModulePermissions"
            @click="dialogoModulos = false"
          />
        </div>

        <q-card-section class="module-permissions-body">
          <q-inner-loading :showing="loadingModules">
            <q-spinner color="primary" size="38px" />
          </q-inner-loading>

          <div v-if="!loadingModules && !permisosModulos.length" class="systems-empty">
            <q-icon name="account_tree" />
            <strong>Este sistema no tiene módulos</strong>
          </div>

          <div v-else-if="permisosRegistrados.length" class="module-permission-section">
            <h3>Permisos registrados</h3>
            <article
              v-for="modulo in permisosRegistrados"
              :key="modulo.id"
              class="module-permission-row module-permission-row--registered"
            >
              <div class="module-permission-row__name">
                <strong>{{ modulo.name }}</strong>
                <span>{{ modulo.acronym || modulo.description || 'Módulo' }}</span>
              </div>
              <div class="module-permission-row__checks">
                <q-checkbox
                  v-model="modulo.hasAccess"
                  dense
                  label="Acceder"
                  :disable="!authStore.tienePermiso('PER', 'canUpdate')"
                />
                <q-checkbox
                  v-model="modulo.canCreate"
                  dense
                  label="Registrar"
                  :disable="!authStore.tienePermiso('PER', 'canUpdate')"
                />
                <q-checkbox
                  v-model="modulo.canUpdate"
                  dense
                  label="Editar"
                  :disable="!authStore.tienePermiso('PER', 'canUpdate')"
                />
                <q-checkbox
                  v-model="modulo.canDelete"
                  dense
                  label="Eliminar"
                  :disable="!authStore.tienePermiso('PER', 'canUpdate')"
                />
                <q-checkbox
                  v-model="modulo.canRead"
                  dense
                  label="Lectura"
                  :disable="!authStore.tienePermiso('PER', 'canUpdate')"
                />
              </div>
            </article>
          </div>

          <div v-if="!loadingModules && modulosPendientes.length" class="module-permission-section">
            <h3>Módulos pendientes</h3>
            <article
              v-for="modulo in modulosPendientes"
              :key="modulo.id"
              class="module-permission-row"
            >
              <div class="module-permission-row__name">
                <strong>{{ modulo.name }}</strong>
                <span>{{ modulo.acronym || modulo.description || 'Módulo' }}</span>
              </div>
              <div class="module-permission-row__checks">
                <q-checkbox
                  v-model="modulo.hasAccess"
                  dense
                  label="Acceder"
                  :disable="!authStore.tienePermiso('PER', 'canCreate')"
                />
                <q-checkbox
                  v-model="modulo.canCreate"
                  dense
                  label="Registrar"
                  :disable="!modulo.hasAccess || !authStore.tienePermiso('PER', 'canCreate')"
                />
                <q-checkbox
                  v-model="modulo.canUpdate"
                  dense
                  label="Editar"
                  :disable="!modulo.hasAccess || !authStore.tienePermiso('PER', 'canCreate')"
                />
                <q-checkbox
                  v-model="modulo.canDelete"
                  dense
                  label="Eliminar"
                  :disable="!modulo.hasAccess || !authStore.tienePermiso('PER', 'canCreate')"
                />
                <q-checkbox
                  v-model="modulo.canRead"
                  dense
                  label="Lectura"
                  :disable="!modulo.hasAccess || !authStore.tienePermiso('PER', 'canCreate')"
                />
              </div>
            </article>
          </div>

          <div
            v-if="!loadingModules && permisosModulos.length && !modulosPendientes.length"
            class="all-modules-registered"
          >
            Todos los módulos de este sistema ya tienen permisos registrados.
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            color="grey-7"
            label="Cancelar"
            :disable="savingModulePermissions"
            @click="dialogoModulos = false"
          />
          <q-btn
            v-if="authStore.tienePermiso('PER', 'canCreate') || authStore.tienePermiso('PER', 'canUpdate')"
            unelevated
            color="primary"
            icon="save"
            :label="permisosRegistradosModificados.length ? 'Guardar cambios' : 'Guardar permisos'"
            :loading="savingModulePermissions"
            :disable="loadingModules || !hayCambiosPermisosModulos"
            @click="guardarPermisosModulos"
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
import { modulosApi } from '../api/modulos.api'
import { useAuthStore } from '../stores/auth.store'

const $q = useQuasar()
const authStore = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const dialogo = ref(false)
const modoEdicion = ref(false)
const perfilEditandoId = ref(null)
const dialogoRelacion = ref(false)
const dialogoSistemas = ref(false)
const dialogoModulos = ref(false)
const savingRelacion = ref(false)
const loadingModules = ref(false)
const savingModulePermissions = ref(false)
const modoEdicionRelacion = ref(false)
const relacionEditandoId = ref(null)
const filtro = ref('')

const perfiles = ref([])
const permisos = ref([])
const sistemas = ref([])
const perfilSeleccionado = ref(null)
const relacionSistemaSeleccionada = ref(null)
const permisosModulos = ref([])
const permisosRegistrados = computed(() =>
  permisosModulos.value.filter((modulo) => modulo.registroExistente),
)
const modulosPendientes = computed(() =>
  permisosModulos.value.filter((modulo) => !modulo.registroExistente),
)
const modulosConAccesoPendientes = computed(() =>
  modulosPendientes.value.filter((modulo) => modulo.hasAccess),
)
const permisosRegistradosModificados = computed(() =>
  permisosRegistrados.value.filter(
    (modulo) =>
      modulo.canCreate !== modulo.originalPermissions.canCreate ||
      modulo.canUpdate !== modulo.originalPermissions.canUpdate ||
      modulo.canDelete !== modulo.originalPermissions.canDelete ||
      modulo.canRead !== modulo.originalPermissions.canRead,
  ),
)
const accesosRegistradosModificados = computed(() =>
  permisosModulos.value.filter(
    (modulo) => modulo.accesoRegistrado && modulo.hasAccess !== modulo.originalHasAccess,
  ),
)
const accesosNuevosSeleccionados = computed(() =>
  permisosModulos.value.filter((modulo) => !modulo.accesoRegistrado && modulo.hasAccess),
)
const hayCambiosPermisosModulos = computed(
  () =>
    permisosRegistradosModificados.value.length > 0 ||
    accesosRegistradosModificados.value.length > 0 ||
    accesosNuevosSeleccionados.value.length > 0,
)

const formBase = () => ({
  name: '',
  description: '',
})

const form = ref(formBase())
const formRelacionBase = () => ({ systemId: null, hasAccess: true })
const formRelacion = ref(formRelacionBase())

const columnas = [
  { name: 'perfil', label: 'Perfil', field: 'nombre', align: 'left' },
  { name: 'descripcion', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'sistemas', label: 'Sistemas con acceso', field: 'sistemasConAcceso', align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'right' },
]

const sistemasOptions = computed(() =>
  sistemas.value.map((sistema) => ({ label: sistema.name, value: sistema.id })),
)

const relacionesPerfilSeleccionado = computed(() => {
  if (!perfilSeleccionado.value) return []
  return permisos.value.filter(
    (permiso) => String(permiso.profileId) === String(perfilSeleccionado.value.id),
  )
})
const perfilDeRelacion = computed(() => perfilSeleccionado.value)
const sistemaSeleccionadoNombre = computed(() =>
  relacionSistemaSeleccionada.value
    ? nombreSistema(relacionSistemaSeleccionada.value.systemId)
    : '',
)

const perfilesFiltrados = computed(() => {
  const q = filtro.value?.trim().toLowerCase()

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
      if (!q) return true

      const nombresSistemas = perfil.relaciones
        .map((relacion) => nombreSistema(relacion.systemId))
        .join(' ')
      return [perfil.name, perfil.description, nombresSistemas]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(q))
    })
})

onMounted(() => {
  if (authStore.tienePermiso('PER', 'canRead')) cargarTodo()
})

async function cargarTodo() {
  if (!authStore.tienePermiso('PER', 'canRead')) return
  loading.value = true
  try {
    const [perfilesResponse, permisosResponse, sistemasResponse] = await Promise.all([
      perfilesApi.obtenerPerfiles(),
      permisosApi.obtenerPermisos(),
      sistemasApi.obtenerSistemas(),
    ])
    perfiles.value = perfilesResponse.data.data || perfilesResponse.data || []
    permisos.value = permisosResponse.data.data || permisosResponse.data || []
    sistemas.value = sistemasResponse.data.data || sistemasResponse.data || []
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar perfiles y sistemas.',
    })
  } finally {
    loading.value = false
  }
}

function nombreSistema(systemId) {
  return (
    sistemas.value.find((sistema) => String(sistema.id) === String(systemId))?.name ||
    'Sistema no encontrado'
  )
}

function abrirSistemasPerfil(perfil) {
  if (!authStore.tienePermiso('PER', 'canRead')) return
  perfilSeleccionado.value = perfil
  dialogoSistemas.value = true
}

async function abrirPermisosModulos(relacion) {
  if (!authStore.tienePermiso('PER', 'canRead')) return
  perfilSeleccionado.value = perfiles.value.find(
    (perfil) => String(perfil.id) === String(relacion.profileId),
  )
  relacionSistemaSeleccionada.value = relacion
  dialogoModulos.value = true
  await cargarPermisosModulos(relacion)
}

async function cargarPermisosModulos(relacion) {
  loadingModules.value = true
  permisosModulos.value = []

  try {
    const [modulosResponse, permisosResponse, accesosResponse] = await Promise.all([
      modulosApi.obtenerModulosPorSistema(relacion.systemId),
      permisosApi.obtenerPermisosModulosPorPerfil(perfilSeleccionado.value.id),
      permisosApi.obtenerAccesosModulosPorPerfil(perfilSeleccionado.value.id),
    ])
    const modulos = modulosResponse.data.data || modulosResponse.data || []
    const registros = permisosResponse.data.data || permisosResponse.data || []
    const accesos = accesosResponse.data.data || accesosResponse.data || []
    const permisosPorModulo = new Map(
      registros.map((permiso) => [String(permiso.moduleId), permiso]),
    )
    const accesosPorModulo = new Map(accesos.map((acceso) => [String(acceso.moduleId), acceso]))

    permisosModulos.value = modulos.map((modulo) => {
      const permiso = permisosPorModulo.get(String(modulo.id))
      const acceso = accesosPorModulo.get(String(modulo.id))
      return {
        ...modulo,
        permisoId: permiso?.id,
        accesoId: acceso?.id,
        registroExistente: Boolean(permiso),
        accesoRegistrado: Boolean(acceso),
        hasAccess: Boolean(acceso?.hasAccess),
        originalHasAccess: Boolean(acceso?.hasAccess),
        canCreate: Boolean(permiso?.canCreate),
        canUpdate: Boolean(permiso?.canUpdate),
        canDelete: Boolean(permiso?.canDelete),
        canRead: Boolean(permiso?.canRead),
        originalPermissions: {
          canCreate: Boolean(permiso?.canCreate),
          canUpdate: Boolean(permiso?.canUpdate),
          canDelete: Boolean(permiso?.canDelete),
          canRead: Boolean(permiso?.canRead),
        },
      }
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error.response?.data?.message || 'No se pudieron actualizar los módulos y sus permisos.',
    })
  } finally {
    loadingModules.value = false
  }
}

async function guardarPermisosModulos() {
  const requiereCrear =
    accesosNuevosSeleccionados.value.length > 0 || modulosConAccesoPendientes.value.length > 0
  const requiereActualizar =
    accesosRegistradosModificados.value.length > 0 || permisosRegistradosModificados.value.length > 0
  if (
    (requiereCrear && !authStore.tienePermiso('PER', 'canCreate')) ||
    (requiereActualizar && !authStore.tienePermiso('PER', 'canUpdate'))
  ) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para guardar estos cambios.' })
    return
  }
  const profileId = perfilSeleccionado.value?.id
  if (!profileId || !relacionSistemaSeleccionada.value?.systemId) {
    $q.notify({ type: 'warning', message: 'No se encontró el perfil o sistema seleccionado.' })
    return
  }

  savingModulePermissions.value = true
  let accesosGuardados = 0
  let permisosGuardados = 0
  let permisosActualizados = 0
  let accesosActualizados = 0
  try {
    for (const modulo of accesosRegistradosModificados.value) {
      await permisosApi.actualizarAccesoModuloPerfil(modulo.accesoId, {
        hasAccess: Boolean(modulo.hasAccess),
      })
      modulo.originalHasAccess = Boolean(modulo.hasAccess)
      accesosActualizados += 1
    }

    for (const modulo of accesosNuevosSeleccionados.value) {
      await permisosApi.crearAccesoModuloPerfil({
        moduleId: modulo.id,
        profileId,
        hasAccess: true,
      })
      modulo.accesoRegistrado = true
      modulo.originalHasAccess = true
      accesosGuardados += 1
    }

    for (const modulo of permisosRegistradosModificados.value) {
      await permisosApi.actualizarPermisoModuloPerfil(modulo.permisoId, {
        canCreate: Boolean(modulo.canCreate),
        canUpdate: Boolean(modulo.canUpdate),
        canDelete: Boolean(modulo.canDelete),
        canRead: Boolean(modulo.canRead),
      })
      permisosActualizados += 1
    }

    for (const modulo of modulosConAccesoPendientes.value) {
      await permisosApi.crearPermisoModuloPerfil({
        moduleId: modulo.id,
        profileId,
        canCreate: Boolean(modulo.canCreate),
        canUpdate: Boolean(modulo.canUpdate),
        canDelete: Boolean(modulo.canDelete),
        canRead: Boolean(modulo.canRead),
      })
      permisosGuardados += 1
      modulo.registroExistente = true
    }

    $q.notify({
      type: 'positive',
      message: `Accesos actualizados: ${accesosActualizados}. Permisos actualizados: ${permisosActualizados}. Accesos creados: ${accesosGuardados}. Permisos nuevos: ${permisosGuardados}.`,
    })
    await cargarPermisosModulos(relacionSistemaSeleccionada.value)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        accesosGuardados > 0 ||
        permisosGuardados > 0 ||
        permisosActualizados > 0 ||
        accesosActualizados > 0
          ? `Accesos actualizados: ${accesosActualizados}; permisos actualizados: ${permisosActualizados}; accesos creados: ${accesosGuardados}; permisos nuevos: ${permisosGuardados}. Error: ${error.response?.data?.message || 'no se pudo completar el resto.'}`
          : error.response?.data?.message || 'No se pudieron guardar los permisos de módulos.',
    })
    if (
      accesosGuardados > 0 ||
      permisosGuardados > 0 ||
      permisosActualizados > 0 ||
      accesosActualizados > 0
    ) {
      await cargarPermisosModulos(relacionSistemaSeleccionada.value)
    }
  } finally {
    savingModulePermissions.value = false
  }
}

function abrirAsignarSistema(perfil) {
  if (!authStore.tienePermiso('PER', 'canCreate')) return
  if (!sistemas.value.length) {
    $q.notify({ type: 'warning', message: 'Primero registra al menos un sistema.' })
    return
  }
  perfilSeleccionado.value = perfil
  modoEdicionRelacion.value = false
  relacionEditandoId.value = null
  formRelacion.value = formRelacionBase()
  dialogoRelacion.value = true
}

function asignarSistemaSeleccionado() {
  const perfil = perfilSeleccionado.value
  dialogoSistemas.value = false
  if (perfil) abrirAsignarSistema(perfil)
}

function editarRelacion(relacion) {
  if (!authStore.tienePermiso('PER', 'canUpdate')) return
  modoEdicionRelacion.value = true
  relacionEditandoId.value = relacion.id
  formRelacion.value = {
    systemId: relacion.systemId,
    hasAccess: Boolean(relacion.hasAccess),
  }
  dialogoSistemas.value = false
  dialogoRelacion.value = true
}

function cerrarDialogoRelacion() {
  dialogoRelacion.value = false
  formRelacion.value = formRelacionBase()
}

async function guardarRelacion() {
  const permisoNecesario = modoEdicionRelacion.value ? 'canUpdate' : 'canCreate'
  if (!authStore.tienePermiso('PER', permisoNecesario)) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para guardar esta asignación.' })
    return
  }
  if (!perfilSeleccionado.value?.id || !formRelacion.value.systemId) {
    $q.notify({ type: 'warning', message: 'Selecciona un sistema para este perfil.' })
    return
  }

  const existente = permisos.value.find(
    (permiso) =>
      String(permiso.profileId) === String(perfilSeleccionado.value.id) &&
      String(permiso.systemId) === String(formRelacion.value.systemId) &&
      String(permiso.id) !== String(relacionEditandoId.value),
  )
  if (!modoEdicionRelacion.value && existente) {
    $q.notify({ type: 'warning', message: 'Este sistema ya está asignado al perfil.' })
    return
  }

  savingRelacion.value = true
  try {
    const payload = {
      profileId: perfilSeleccionado.value.id,
      systemId: formRelacion.value.systemId,
      hasAccess: Boolean(formRelacion.value.hasAccess),
    }
    if (modoEdicionRelacion.value) {
      await permisosApi.actualizarPermiso(relacionEditandoId.value, payload)
      $q.notify({ type: 'positive', message: 'Acceso actualizado correctamente.' })
    } else {
      await permisosApi.crearPermiso(payload)
      $q.notify({ type: 'positive', message: 'Sistema asignado correctamente.' })
    }
    cerrarDialogoRelacion()
    await cargarTodo()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudo guardar la asignación.',
    })
  } finally {
    savingRelacion.value = false
  }
}

function eliminarRelacion(relacion) {
  if (!authStore.tienePermiso('PER', 'canDelete')) return
  $q.dialog({
    title: 'Eliminar asignación',
    message: `¿Deseas quitar ${nombreSistema(relacion.systemId)} del perfil "${perfilSeleccionado.value?.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await permisosApi.eliminarPermiso(relacion.id)
      $q.notify({ type: 'positive', message: 'Asignación eliminada correctamente.' })
      await cargarTodo()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'No se pudo eliminar la asignación.',
      })
    }
  })
}

function abrirCrear() {
  if (!authStore.tienePermiso('PER', 'canCreate')) return
  modoEdicion.value = false
  perfilEditandoId.value = null
  form.value = formBase()
  dialogo.value = true
}

function abrirEditar(perfil) {
  if (!authStore.tienePermiso('PER', 'canUpdate')) return
  modoEdicion.value = true
  perfilEditandoId.value = perfil.id
  form.value = {
    name: perfil.name || '',
    description: perfil.description || '',
  }
  dialogo.value = true
}

function cerrarDialogo() {
  dialogo.value = false
}

async function guardar() {
  const permisoNecesario = modoEdicion.value ? 'canUpdate' : 'canCreate'
  if (!authStore.tienePermiso('PER', permisoNecesario)) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para guardar este perfil.' })
    return
  }
  if (!form.value.name?.trim()) {
    $q.notify({ type: 'warning', message: 'El nombre del perfil es obligatorio.' })
    return
  }

  saving.value = true

  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description?.trim() || '',
    }

    if (modoEdicion.value) {
      await perfilesApi.actualizarPerfil(perfilEditandoId.value, payload)
      $q.notify({ type: 'positive', message: 'Perfil actualizado correctamente.' })
    } else {
      await perfilesApi.crearPerfil(payload)
      $q.notify({ type: 'positive', message: 'Perfil creado correctamente.' })
    }

    dialogo.value = false
    await cargarTodo()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudo guardar el perfil.',
    })
  } finally {
    saving.value = false
  }
}

function eliminarPerfil(perfil) {
  if (!authStore.tienePermiso('PER', 'canDelete')) return
  $q.dialog({
    title: 'Eliminar perfil',
    message: `¿Deseas eliminar el perfil "${perfil.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await perfilesApi.eliminarPerfil(perfil.id)
      $q.notify({ type: 'positive', message: 'Perfil eliminado correctamente.' })
      await cargarTodo()
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'No se pudo eliminar el perfil.',
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

.perfiles-page {
  min-height: 100%;
  padding: 28px;
  display: grid;
  gap: 22px;
  background:
    radial-gradient(circle at top left, rgba(173, 128, 255, 0.12), transparent 20%),
    linear-gradient(180deg, #f7f5fb 0%, #f2f4fb 100%);
}

.perfiles-hero {
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

.perfiles-hero::before {
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

.hero-actions {
  position: relative;
  z-index: 1;

  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Solo móviles */
@media (max-width: 600px) {
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
.hero-copy h1 {
  color: rgba(84, 37, 131, 0.82);
}
.hero-chip {
  background: rgba(255, 255, 255, 0.12);
  color: #532680;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.hero-chip :deep(.q-icon) {
  color: #532680 !important;
}

.perfiles-hero h1 {
  margin: 10px 0 8px;
  font-size: clamp(2.2rem, 4vw, 3.8rem);
  line-height: 0.95;
  font-weight: 950;
  letter-spacing: -0.06em;
}

.perfiles-hero p {
  margin: 0;
  max-width: 700px;
  color: rgba(83, 4, 4, 0.82);
  font-size: 1rem;
}

.hero-actions {
  display: flex;
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

.perfiles-table {
  margin: 12px 12px 12px;
  background: transparent;
  border: 2px solid #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(76, 40, 111, 0.08);
}

.perfiles-table :deep(thead tr) {
  background: #4c286f;
}

.perfiles-table :deep(thead th) {
  height: 52px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  border-bottom: 0;
}

.perfiles-table :deep(thead th:last-child) {
  text-align: right;
}

.perfiles-table :deep(tbody td) {
  height: 78px;
  padding-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(76, 40, 111, 0.06);
}

.perfiles-table :deep(tbody tr:hover) {
  background: #fcf7fd;
}

.perfiles-table :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.table-perfil {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-perfil > div:last-child {
  display: grid;
  gap: 3px;
}

.table-perfil strong {
  color: var(--text-strong);
  font-weight: 900;
}

.table-perfil span {
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

.table-perfil-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(111, 68, 181, 0.12), rgba(166, 77, 216, 0.15));
  color: #5d2f88;
  font-size: 22px;
}

.actions-cell {
  white-space: nowrap;
}

.mobile-perfil-card {
  border-radius: 22px;
}

.mobile-perfil-card__head,
.mobile-perfil-card__body {
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

.profile-system-summary {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--text-muted);
}

.profile-system-summary strong {
  color: var(--text-strong);
  font-size: 18px;
}

.systems-dialog {
  width: min(760px, 96vw);
  max-width: 760px;
  overflow: hidden;
  border-radius: 12px;
}

.systems-dialog__body {
  max-height: min(60vh, 560px);
  overflow-y: auto;
  padding: 18px 22px;
}

.systems-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 34px 16px;
  color: var(--text-muted);
  text-align: center;
}

.systems-empty .q-icon {
  color: #5d2f88;
  font-size: 32px;
}

.systems-empty strong {
  color: var(--text-strong);
}

.profile-system-list {
  display: grid;
  gap: 10px;
}

.profile-system-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: #fff;
}

.relation-entity {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.entity-icon {
  display: grid;
  flex: 0 0 auto;
  width: 38px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 7px;
  background: #eef3f4;
  color: #386d75;
}

.relation-entity > div:last-child {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.relation-entity strong,
.relation-entity span {
  overflow-wrap: anywhere;
}

.relation-entity strong {
  color: var(--text-strong);
}

.relation-entity span {
  color: var(--text-muted);
  font-size: 12px;
}

.profile-system-row__actions {
  display: flex;
  gap: 2px;
}

.access-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: #faf8fc;
}

.access-control__icon {
  display: grid;
  flex: 0 0 auto;
  width: 40px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 7px;
  font-size: 20px;
}

.access-control__icon.is-granted {
  background: #e5f3e9;
  color: #32805a;
}

.access-control__icon.is-denied {
  background: #fbe9e8;
  color: #b4443d;
}

.access-control__copy {
  display: grid;
  flex: 1;
  gap: 3px;
}

.access-control__copy strong {
  color: var(--text-strong);
}

.access-control__copy span {
  color: var(--text-muted);
  font-size: 12px;
}

.module-permissions-dialog {
  width: min(920px, 96vw);
  max-width: 920px;
  overflow: hidden;
  border-radius: 12px;
}

.module-permissions-body {
  position: relative;
  min-height: 150px;
  max-height: min(65vh, 620px);
  overflow-y: auto;
  padding: 18px 22px;
}

.module-permission-section {
  display: grid;
  gap: 9px;
}

.module-permission-section + .module-permission-section {
  margin-top: 24px;
}

.module-permission-section h3 {
  margin: 0 0 2px;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 800;
}

.module-permission-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(420px, 1.7fr);
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: #fff;
}

.module-permission-row--registered {
  background: #f5faf6;
  border-color: rgba(50, 128, 90, 0.2);
}

.all-modules-registered {
  margin-top: 18px;
  padding: 14px;
  border-radius: 7px;
  background: #eaf5ed;
  color: #286d49;
  font-weight: 650;
}

.module-permission-row__name {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.module-permission-row__name strong,
.module-permission-row__name span {
  overflow-wrap: anywhere;
}

.module-permission-row__name strong {
  color: var(--text-strong);
}

.module-permission-row__name span {
  color: var(--text-muted);
  font-size: 12px;
}

.module-permission-row__checks {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
}

.perfil-dialog {
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
  .perfiles-hero,
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
  .perfiles-page {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .profile-system-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .profile-system-row > .q-badge {
    grid-column: 1;
    justify-self: start;
  }

  .profile-system-row__actions {
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  .module-permission-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }

  .module-permission-row__checks {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
