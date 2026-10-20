<template>
  <q-page class="usuarios-page">
    <section class="usuarios-hero">
      <div class="hero-copy">
        <q-chip class="hero-chip" icon="manage_accounts" label="Administración de cuentas" />
        <h1>Usuarios</h1>
        <p>Consulta el directorio de empleados y administra sus cuentas de acceso.</p>
      </div>
    </section>
    <div class="hero-actions">
      <q-btn
        v-if="authStore.tienePermiso('USER', 'canRead')"
        rounded
        class="secondary-action"
        icon="refresh"
        label="Actualizar directorio"
        :loading="loading"
        @click="cargarTodo"
      />
    </div>

    <section v-if="authStore.tienePermiso('USER', 'canRead')" class="stats-grid">
      <article class="stat-card accent-blue">
        <div class="stat-icon"><q-icon name="badge" /></div>
        <div class="stat-text">
          <strong>{{ empleados.length }}</strong>
          <span>Empleados</span>
        </div>
      </article>
      <article class="stat-card accent-green">
        <div class="stat-icon"><q-icon name="verified_user" /></div>
        <div class="stat-text">
          <strong>{{ usuariosRegistrados }}</strong>
          <span>Con usuario</span>
        </div>
      </article>
      <article class="stat-card accent-orange">
        <div class="stat-icon"><q-icon name="person_add" /></div>
        <div class="stat-text">
          <strong>{{ empleadosSinUsuario }}</strong>
          <span>Sin usuario</span>
        </div>
      </article>
    </section>

    <q-card flat bordered class="content-card">
      <div class="panel-header">
        <div>
          <h2>Directorio de usuarios</h2>
          <p>{{ tipoUsuarioSeleccionado }}</p>
        </div>
        <div class="directory-filters">
          <q-select
            v-model="tipoUsuarioFiltro"
            :options="tiposUsuario"
            outlined
            dense
            emit-value
            map-options
            label="Tipo de usuario"
            class="type-filter"
          >
            <template #prepend><q-icon name="manage_accounts" /></template>
          </q-select>
          <q-input
            v-model="filtro"
            outlined
            dense
            clearable
            class="search-input"
            placeholder="Buscar usuario, puesto o correo..."
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </div>
      </div>

      <q-inner-loading :showing="loading">
        <q-spinner color="primary" size="42px" />
      </q-inner-loading>

      <div
        v-if="!loading && authStore.tienePermiso('USER', 'canRead') && !usuariosFiltrados.length"
        class="empty-state"
      >
        <div class="empty-icon"><q-icon name="manage_accounts" /></div>
        <strong>Sin usuarios para mostrar</strong>
        <span>{{
          filtro
            ? 'Prueba con otro nombre, puesto o correo.'
            : `No hay registros para ${tipoUsuarioSeleccionado.toLowerCase()}.`
        }}</span>
      </div>

      <q-table
        v-else-if="authStore.tienePermiso('USER', 'canRead')"
        flat
        :rows="usuariosFiltrados"
        :columns="columnas"
        row-key="id"
        class="usuarios-table"
        :grid="$q.screen.lt.md"
        :pagination="{ sortBy: 'displayName', descending: false, rowsPerPage: 10 }"
        no-data-label="Sin empleados para mostrar"
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-empleado="props">
          <q-td :props="props">
            <div class="employee-cell">
              <q-avatar size="38px" class="employee-avatar">
                <q-icon name="person" />
              </q-avatar>
              <div>
                <strong>{{ props.row.displayName }}</strong>
                <span>{{ props.row.secondaryLabel }}</span>
              </div>
            </div>
          </q-td>
        </template>

        <template #body-cell-puesto="props">
          <q-td :props="props">{{ props.row.positionName }}</q-td>
        </template>

        <template #body-cell-cuenta="props">
          <q-td :props="props">
            <div v-if="props.row.account" class="account-cell">
              <span>{{ props.row.account.userName || props.row.account.email }}</span>
            </div>
            <q-badge v-else color="grey-7" outline label="Sin usuario" />
          </q-td>
        </template>

        <template #body-cell-estatus="props">
          <q-td :props="props">
            <q-badge
              v-if="props.row.account"
              :color="props.row.account.status ? 'positive' : 'grey-7'"
              :label="props.row.account.status ? 'Activo' : 'Inactivo'"
            />
            <span v-else class="text-grey-7">Sin cuenta</span>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <q-btn
              v-if="props.row.employee && !props.row.account && authStore.tienePermiso('USER', 'canCreate')"
              unelevated
              dense
              no-caps
              icon="person_add"
              label="Crear usuario"
              color="primary"
              @click="abrirCrear(props.row.employee)"
            />
            <template v-else-if="props.row.account">
              <q-btn
                v-if="authStore.tienePermiso('USER', 'canRead')"
                flat
                round
                icon="print"
                color="secondary"
                aria-label="Generar acuse de usuario"
                @click="generarAcuse(props.row)"
              >
                <q-tooltip>Generar acuse</q-tooltip>
              </q-btn>
              <q-btn
                v-if="authStore.tienePermiso('USER', 'canRead') || authStore.tienePermiso('USER', 'canCreate') || authStore.tienePermiso('USER', 'canUpdate')"
                flat
                round
                icon="admin_panel_settings"
                color="primary"
                aria-label="Configurar accesos y permisos"
                @click="abrirPermisosUsuario(props.row.account)"
              >
                <q-tooltip>Configurar accesos y permisos</q-tooltip>
              </q-btn>
              <q-btn
                v-if="authStore.tienePermiso('USER', 'canUpdate')"
                flat
                round
                :icon="props.row.account.status ? 'person_off' : 'how_to_reg'"
                :aria-label="props.row.account.status ? 'Desactivar usuario' : 'Activar usuario'"
                :color="props.row.account.status ? 'negative' : 'positive'"
                :loading="actualizandoEstadoId === props.row.account.id"
                @click="confirmarCambioEstado(props.row.account)"
              >
                <q-tooltip>{{
                  props.row.account.status ? 'Desactivar usuario' : 'Activar usuario'
                }}</q-tooltip>
              </q-btn>
            </template>
          </q-td>
        </template>

        <template #item="props">
          <div class="q-pa-xs col-12">
            <q-card flat bordered class="employee-mobile-card">
              <q-card-section class="employee-mobile-card__head">
                <div class="employee-cell">
                  <q-avatar size="40px" class="employee-avatar"><q-icon name="person" /></q-avatar>
                  <div>
                    <strong>{{ props.row.displayName }}</strong>
                    <span>{{ props.row.positionName }}</span>
                  </div>
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section class="employee-mobile-card__body">
                <div class="mobile-field">
                  <span>{{ props.row.employee ? 'Área' : 'Correo' }}</span>
                  <strong>{{ props.row.secondaryLabel }}</strong>
                </div>
                <div class="mobile-field">
                  <span>{{ props.row.employee ? 'Correo' : 'Tipo de usuario' }}</span>
                  <strong>{{
                    props.row.employee ? props.row.email : tipoUsuarioSeleccionado
                  }}</strong>
                </div>
                <div class="mobile-field mobile-field--full">
                  <span>Cuenta</span>
                  <strong v-if="props.row.account">
                    {{ props.row.account.userName || props.row.account.email }}
                  </strong>
                  <strong v-else>Sin usuario</strong>
                </div>
                <div v-if="props.row.account" class="mobile-field mobile-field--full">
                  <span>Estado</span>
                  <q-badge
                    :color="props.row.account.status ? 'positive' : 'grey-7'"
                    :label="props.row.account.status ? 'Activo' : 'Inactivo'"
                  />
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  v-if="props.row.employee && !props.row.account && authStore.tienePermiso('USER', 'canCreate')"
                  unelevated
                  dense
                  no-caps
                  icon="person_add"
                  label="Crear usuario"
                  color="primary"
                  @click="abrirCrear(props.row.employee)"
                />
                <template v-else-if="props.row.account">
                  <q-btn
                    v-if="authStore.tienePermiso('USER', 'canRead')"
                    flat
                    round
                    icon="print"
                    color="secondary"
                    aria-label="Generar acuse de usuario"
                    @click="generarAcuse(props.row)"
                  >
                    <q-tooltip>Generar acuse</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="authStore.tienePermiso('USER', 'canRead') || authStore.tienePermiso('USER', 'canCreate') || authStore.tienePermiso('USER', 'canUpdate')"
                    flat
                    round
                    icon="admin_panel_settings"
                    color="primary"
                    aria-label="Configurar accesos y permisos"
                    @click="abrirPermisosUsuario(props.row.account)"
                  >
                    <q-tooltip>Configurar accesos y permisos</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="authStore.tienePermiso('USER', 'canUpdate')"
                    flat
                    round
                    :icon="props.row.account.status ? 'person_off' : 'how_to_reg'"
                    :aria-label="
                      props.row.account.status ? 'Desactivar usuario' : 'Activar usuario'
                    "
                    :color="props.row.account.status ? 'negative' : 'positive'"
                    :loading="actualizandoEstadoId === props.row.account.id"
                    @click="confirmarCambioEstado(props.row.account)"
                  />
                </template>
                <q-badge v-else color="grey-7" outline label="Sin cuenta" />
              </q-card-actions>
            </q-card>
          </div>
        </template>
      </q-table>
      <div v-else class="empty-state">
        <strong>No tienes permiso para consultar usuarios.</strong>
      </div>
    </q-card>

    <q-dialog v-model="dialogo" persistent>
      <q-card class="usuario-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip dense class="hero-chip" label="Nuevo usuario" />
            <h2>Crear cuenta</h2>
            <p>La cuenta quedará vinculada al empleado seleccionado.</p>
          </div>
          <q-btn flat round icon="close" color="white" aria-label="Cerrar" @click="cerrarDialogo" />
        </div>

        <q-card-section class="dialog-body">
          <div v-if="empleadoSeleccionado" class="selected-employee">
            <q-icon name="badge" />
            <div>
              <strong>{{ nombreEmpleado(empleadoSeleccionado) }}</strong>
              <span>{{ empleadoSeleccionado.positionName || 'Sin puesto registrado' }}</span>
            </div>
          </div>

          <q-input
            v-model="form.userName"
            outlined
            label="Nombre de usuario *"
            autocomplete="username"
            :rules="[(value) => !!value?.trim() || 'El nombre de usuario es requerido']"
          >
            <template #prepend><q-icon name="person" /></template>
          </q-input>
          <q-input
            v-model="form.email"
            outlined
            type="email"
            label="Correo electrónico *"
            autocomplete="email"
            :rules="[
              (value) => !!value?.trim() || 'El correo es requerido',
              (value) => /.+@.+\..+/.test(value) || 'Ingresa un correo válido',
            ]"
          >
            <template #prepend><q-icon name="mail" /></template>
          </q-input>
          <q-input
            v-model="form.phoneNumber"
            outlined
            type="tel"
            label="Teléfono *"
            autocomplete="tel"
            :rules="[(value) => !!value?.trim() || 'El teléfono es requerido']"
          >
            <template #prepend><q-icon name="call" /></template>
          </q-input>
          <q-select
            v-model="form.userType"
            :options="tiposUsuario"
            outlined
            emit-value
            map-options
            label="Tipo de usuario *"
            :rules="[(value) => value !== null || 'Selecciona un tipo de usuario']"
          >
            <template #prepend><q-icon name="manage_accounts" /></template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat color="grey-7" label="Cancelar" @click="cerrarDialogo" />
          <q-btn
            unelevated
            color="primary"
            icon="person_add"
            label="Crear usuario"
            :loading="saving"
            @click="guardar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoPermisos" persistent>
      <q-card class="usuario-dialog permissions-dialog">
        <div class="dialog-hero">
          <div>
            <q-chip dense class="hero-chip" icon="admin_panel_settings" label="Acceso de usuario" />
            <h2>Configurar permisos</h2>
            <p>{{ usuarioPermisosSeleccionado?.userName || usuarioPermisosSeleccionado?.email }}</p>
          </div>
          <q-btn
            flat
            round
            icon="close"
            color="white"
            aria-label="Cerrar"
            :disable="savingPermisosUsuario"
            @click="cerrarPermisosUsuario"
          />
        </div>

        <q-card-section class="dialog-body permissions-dialog__body">
          <q-select
            v-model="formPermisos.systemId"
            :options="sistemasOptions"
            outlined
            emit-value
            map-options
            label="Sistema *"
            :loading="loadingCatalogosPermisos"
            :disable="loadingCatalogosPermisos || savingPermisosUsuario"
            :rules="[(value) => !!value || 'Selecciona un sistema']"
            @update:model-value="cambiarSistemaPermisosUsuario"
          >
            <template #prepend><q-icon name="apps" /></template>
          </q-select>
          <q-select
            v-model="formPermisos.profileId"
            :options="perfilesOptions"
            outlined
            emit-value
            map-options
            label="Perfil *"
            :loading="loadingCatalogosPermisos || loadingAccesoSistemaUsuario"
            :disable="
              loadingCatalogosPermisos ||
              loadingAccesoSistemaUsuario ||
              savingPermisosUsuario ||
              !formPermisos.systemId ||
              (systemUserAccessSaved && formPermisos.profileId)
            "
            :rules="[(value) => !!value || 'Selecciona un perfil']"
            @update:model-value="cargarPermisosPerfilUsuario"
          >
            <template #prepend><q-icon name="badge" /></template>
          </q-select>

          <div v-if="formPermisos.systemId" class="module-permissions-section">
            <q-inner-loading :showing="loadingModulosPermisos || loadingPermisosPerfil">
              <q-spinner color="primary" size="38px" />
            </q-inner-loading>

            <div
              v-if="!loadingModulosPermisos && !modulosPermisosUsuario.length"
              class="systems-empty"
            >
              <q-icon name="account_tree" />
              <strong>El sistema no tiene módulos</strong>
            </div>

            <div v-if="modulosPermisosUsuario.length" class="user-module-groups">
              <p v-if="!formPermisos.profileId" class="module-profile-hint">
                Selecciona un perfil para habilitar los permisos de los módulos.
              </p>
              <section
                v-for="grupo in gruposPermisosUsuario"
                :key="grupo.key"
                class="user-module-group"
              >
                <header class="user-module-group__header">
                  <h3>{{ grupo.title }}</h3>
                  <q-badge :label="grupo.modulos.length" color="primary" />
                </header>
                <article v-for="modulo in grupo.modulos" :key="modulo.id" class="user-module-row">
                  <div class="user-module-row__name">
                    <strong>{{ modulo.name }}</strong>
                    <span>{{ modulo.acronym || modulo.description || 'Módulo' }}</span>
                    <span v-if="grupo.key === 'pending'" class="module-save-status">
                      {{ modulo.accessSaved ? 'Acceso registrado' : 'Acceso pendiente' }}
                      ·
                      {{ modulo.permissionsSaved ? 'Permisos registrados' : 'Permisos pendientes' }}
                    </span>
                  </div>
                  <div class="user-module-row__checks">
                    <q-checkbox
                      v-model="modulo.hasAccess"
                      dense
                      label="Acceder"
                      :disable="
                        !formPermisos.profileId ||
                        savingPermisosUsuario ||
                        (modulo.accessSaved
                          ? !authStore.tienePermiso('USER', 'canUpdate')
                          : !authStore.tienePermiso('USER', 'canCreate'))
                      "
                    />
                    <q-checkbox
                      v-model="modulo.canCreate"
                      dense
                      label="Registrar"
                      :disable="
                        !formPermisos.profileId ||
                        !modulo.hasAccess ||
                        savingPermisosUsuario ||
                        (modulo.permissionsSaved
                          ? !authStore.tienePermiso('USER', 'canUpdate')
                          : !authStore.tienePermiso('USER', 'canCreate'))
                      "
                    />
                    <q-checkbox
                      v-model="modulo.canUpdate"
                      dense
                      label="Editar"
                      :disable="
                        !formPermisos.profileId ||
                        !modulo.hasAccess ||
                        savingPermisosUsuario ||
                        (modulo.permissionsSaved
                          ? !authStore.tienePermiso('USER', 'canUpdate')
                          : !authStore.tienePermiso('USER', 'canCreate'))
                      "
                    />
                    <q-checkbox
                      v-model="modulo.canDelete"
                      dense
                      label="Eliminar"
                      :disable="
                        !formPermisos.profileId ||
                        !modulo.hasAccess ||
                        savingPermisosUsuario ||
                        (modulo.permissionsSaved
                          ? !authStore.tienePermiso('USER', 'canUpdate')
                          : !authStore.tienePermiso('USER', 'canCreate'))
                      "
                    />
                    <q-checkbox
                      v-model="modulo.canRead"
                      dense
                      label="Lectura"
                      :disable="
                        !formPermisos.profileId ||
                        !modulo.hasAccess ||
                        savingPermisosUsuario ||
                        (modulo.permissionsSaved
                          ? !authStore.tienePermiso('USER', 'canUpdate')
                          : !authStore.tienePermiso('USER', 'canCreate'))
                      "
                    />
                  </div>
                </article>
              </section>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn
            flat
            color="grey-7"
            label="Cancelar"
            :disable="savingPermisosUsuario"
            @click="cerrarPermisosUsuario"
          />
          <q-btn
            unelevated
            color="primary"
            icon="save"
            label="Guardar permisos"
            :loading="savingPermisosUsuario"
            :disable="!puedeGuardarPermisosUsuario || savingPermisosUsuario"
            @click="guardarPermisosUsuario"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
import { descargarAcuseUsuario } from '../utils/acuseUsuario'
import { useAuthStore } from '../stores/auth.store'

const $q = useQuasar()
const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const actualizandoEstadoId = ref(null)
const dialogo = ref(false)
const dialogoPermisos = ref(false)
const loadingCatalogosPermisos = ref(false)
const loadingModulosPermisos = ref(false)
const loadingPermisosPerfil = ref(false)
const loadingAccesoSistemaUsuario = ref(false)
const savingPermisosUsuario = ref(false)
const permisosPerfilCargados = ref(false)
const usuarioPermisosSeleccionado = ref(null)
const sistemasPermisos = ref([])
const perfilesPermisos = ref([])
const modulosPermisosUsuario = ref([])
const systemUserAccessSaved = ref(false)
const filtro = ref('')
const tipoUsuarioFiltro = ref(1)
const empleados = ref([])
const usuarios = ref([])
const empleadoSeleccionado = ref(null)
const tiposUsuario = [
  { label: 'Empleado IEEN', value: 1 },
  { label: 'Partido Político', value: 2 },
  { label: 'Ciudadanía', value: 3 },
]

const formBase = () => ({ userName: '', email: '', phoneNumber: '', userType: null })
const form = ref(formBase())
const formPermisosBase = () => ({ systemId: null, profileId: null })
const formPermisos = ref(formPermisosBase())

const sistemasOptions = computed(() =>
  sistemasPermisos.value.map((sistema) => ({ label: sistema.name, value: sistema.id })),
)
const perfilesOptions = computed(() =>
  perfilesPermisos.value.map((perfil) => ({ label: perfil.name, value: perfil.id })),
)
const gruposPermisosUsuario = computed(() => {
  const registrados = modulosPermisosUsuario.value.filter(
    (modulo) => modulo.accessSaved && modulo.permissionsSaved,
  )
  const pendientes = modulosPermisosUsuario.value.filter(
    (modulo) => !modulo.accessSaved || !modulo.permissionsSaved,
  )

  return [
    { key: 'registered', title: 'Permisos registrados', modulos: registrados },
    { key: 'pending', title: 'Permisos pendientes de agregar', modulos: pendientes },
  ].filter((grupo) => grupo.modulos.length)
})
const puedeGuardarPermisosUsuario = computed(
  () =>
    !loadingCatalogosPermisos.value &&
    !loadingModulosPermisos.value &&
    !loadingPermisosPerfil.value &&
    Boolean(formPermisos.value.systemId) &&
    Boolean(formPermisos.value.profileId) &&
    permisosPerfilCargados.value &&
    ((!systemUserAccessSaved.value && authStore.tienePermiso('USER', 'canCreate')) ||
      modulosPermisosUsuario.value.some((modulo) =>
        modulo.hasAccess
          ? (!modulo.accessSaved || !modulo.permissionsSaved)
              ? authStore.tienePermiso('USER', 'canCreate')
              : authStore.tienePermiso('USER', 'canUpdate') && moduloTieneCambios(modulo)
          : authStore.tienePermiso('USER', 'canUpdate') && moduloTieneCambios(modulo),
      )),
)

const columnas = computed(() => [
  {
    name: 'empleado',
    label: Number(tipoUsuarioFiltro.value) === 1 ? 'Empleado' : 'Usuario',
    field: 'displayName',
    align: 'left',
  },
  {
    name: 'puesto',
    label: Number(tipoUsuarioFiltro.value) === 1 ? 'Puesto' : 'Correo',
    field: 'positionName',
    align: 'left',
  },
  { name: 'cuenta', label: 'Usuario', field: 'userName', align: 'left' },
  { name: 'estatus', label: 'Estatus', field: (row) => row.account?.status, align: 'left' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'right' },
])

const empleadosConUsuario = computed(() =>
  empleados.value.filter((empleado) => usuarioDeEmpleado(empleado)),
)
const usuariosRegistrados = computed(() => empleadosConUsuario.value.length)
const empleadosSinUsuario = computed(() => empleados.value.length - usuariosRegistrados.value)

const tipoUsuarioSeleccionado = computed(
  () => tiposUsuario.find((tipo) => tipo.value === Number(tipoUsuarioFiltro.value))?.label || '',
)

const usuariosFiltrados = computed(() => {
  const tipoUsuario = Number(tipoUsuarioFiltro.value)
  const filas =
    tipoUsuario === 1
      ? empleados.value
          .map((empleado) => {
            const account = usuarioDeEmpleado(empleado)
            return {
              id: empleado.id,
              displayName: nombreEmpleado(empleado),
              secondaryLabel: empleado.areaName || 'Área no especificada',
              positionName: empleado.positionName || 'Sin puesto registrado',
              email: empleado.email || 'Sin correo registrado',
              employee: empleado,
              account,
            }
          })
          .filter((fila) => !fila.account || Number(fila.account.userType) === 1)
      : usuarios.value
          .filter((usuario) => Number(usuario.userType) === tipoUsuario)
          .map((usuario) => ({
            id: usuario.id,
            displayName: usuario.userName || usuario.email || 'Usuario sin nombre',
            secondaryLabel: usuario.email || 'Sin correo registrado',
            positionName: usuario.email || 'Sin correo registrado',
            email: usuario.email || 'Sin correo registrado',
            employee: null,
            account: usuario,
          }))

  const query = filtro.value?.trim().toLowerCase()
  if (!query) return filas

  return filas.filter((fila) =>
    [fila.displayName, fila.positionName, fila.secondaryLabel, fila.account?.userName, fila.email]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(query)),
  )
})

onMounted(() => {
  if (authStore.tienePermiso('USER', 'canRead')) cargarTodo()
})

function listaDesdeRespuesta(response) {
  const data = response.data?.data ?? response.data
  return Array.isArray(data) ? data : []
}

function nombreEmpleado(empleado) {
  return (
    empleado.fullName ||
    [empleado.name, empleado.paternalSurname, empleado.maternalSurname].filter(Boolean).join(' ') ||
    'Empleado sin nombre'
  )
}

function normalizarSegmentoUsuario(valor) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function usuarioDeEmpleado(empleado) {
  return usuarios.value.find(
    (usuario) =>
      String(usuario.referenceId || '').toLowerCase() === String(empleado.id).toLowerCase(),
  )
}

async function cargarTodo() {
  if (!authStore.tienePermiso('USER', 'canRead')) return
  loading.value = true
  try {
    const [empleadosResponse, usuariosResponse] = await Promise.all([
      usuariosApi.obtenerEmpleados(),
      usuariosApi.obtenerUsuarios(),
    ])
    empleados.value = listaDesdeRespuesta(empleadosResponse)
    usuarios.value = listaDesdeRespuesta(usuariosResponse)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar empleados y usuarios.',
    })
  } finally {
    loading.value = false
  }
}

async function abrirPermisosUsuario(usuario) {
  if (
    !authStore.tienePermiso('USER', 'canRead') &&
    !authStore.tienePermiso('USER', 'canCreate') &&
    !authStore.tienePermiso('USER', 'canUpdate')
  ) return
  usuarioPermisosSeleccionado.value = usuario
  formPermisos.value = formPermisosBase()
  modulosPermisosUsuario.value = []
  systemUserAccessSaved.value = false
  dialogoPermisos.value = true

  if (sistemasPermisos.value.length && perfilesPermisos.value.length) return

  loadingCatalogosPermisos.value = true
  try {
    const [sistemasResponse, perfilesResponse] = await Promise.all([
      sistemasApi.obtenerSistemas(),
      perfilesApi.obtenerPerfiles(),
    ])
    sistemasPermisos.value = listaDesdeRespuesta(sistemasResponse)
    perfilesPermisos.value = listaDesdeRespuesta(perfilesResponse)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar sistemas y perfiles.',
    })
  } finally {
    loadingCatalogosPermisos.value = false
  }
}

async function cambiarSistemaPermisosUsuario(systemId) {
  formPermisos.value.profileId = null
  systemUserAccessSaved.value = false
  permisosPerfilCargados.value = false
  modulosPermisosUsuario.value = []
  if (!systemId) return

  const usuario = usuarioPermisosSeleccionado.value
  await cargarModulosPermisosUsuario(systemId)
  if (!usuario?.id || String(formPermisos.value.systemId) !== String(systemId)) return

  loadingAccesoSistemaUsuario.value = true
  try {
    const response = await permisosApi.obtenerAccesosSistemas()
    const accesoSistema = listaDesdeRespuesta(response).find(
      (acceso) =>
        String(acceso.userId) === String(usuario.id) &&
        String(acceso.systemId) === String(systemId),
    )
    if (String(formPermisos.value.systemId) !== String(systemId)) return
    if (!accesoSistema) return

    systemUserAccessSaved.value = true
    const perfilAsignado = perfilesPermisos.value.find(
      (perfil) => String(perfil.id) === String(accesoSistema.profileId),
    )
    if (!perfilAsignado) return

    formPermisos.value.profileId = perfilAsignado.id
    await cargarPermisosPerfilUsuario(perfilAsignado.id)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error.response?.data?.message || 'No se pudo consultar el perfil asignado al usuario.',
    })
  } finally {
    loadingAccesoSistemaUsuario.value = false
  }
}

async function cargarModulosPermisosUsuario(systemId) {
  modulosPermisosUsuario.value = []
  systemUserAccessSaved.value = false
  permisosPerfilCargados.value = false
  if (!systemId) return

  loadingModulosPermisos.value = true
  try {
    const response = await modulosApi.obtenerModulosPorSistema(systemId)
    modulosPermisosUsuario.value = listaDesdeRespuesta(response).map((modulo) => ({
      ...modulo,
      hasAccess: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canRead: false,
      accessSaved: false,
      accessRecordId: null,
      originalHasAccess: false,
      permissionsSaved: false,
      permissionRecordId: null,
      originalPermissions: {
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canRead: false,
      },
    }))
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudieron cargar los módulos del sistema.',
    })
  } finally {
    loadingModulosPermisos.value = false
  }
}

function listaORegistroDesdeRespuesta(response) {
  const data = response.data?.data ?? response.data
  if (Array.isArray(data)) return data
  return data && typeof data === 'object' ? [data] : []
}

function moduloTieneCambios(modulo) {
  const cambioAcceso = Boolean(modulo.hasAccess) !== Boolean(modulo.originalHasAccess)
  const cambioPermisos = ['canCreate', 'canUpdate', 'canDelete', 'canRead'].some(
    (permiso) => Boolean(modulo[permiso]) !== Boolean(modulo.originalPermissions?.[permiso]),
  )
  return cambioAcceso || cambioPermisos
}

async function cargarPermisosPerfilUsuario(profileId) {
  const usuario = usuarioPermisosSeleccionado.value
  const { systemId } = formPermisos.value
  permisosPerfilCargados.value = false

  if (!usuario?.id || !systemId || !profileId) return

  loadingPermisosPerfil.value = true
  try {
    const [
      accesosPerfilResponse,
      permisosPerfilResponse,
      accesosUsuarioResponse,
      permisosUsuarioResponse,
    ] = await Promise.all([
      permisosApi.obtenerAccesosModulosPorPerfil(profileId),
      permisosApi.obtenerPermisosModulosPorPerfil(profileId),
      permisosApi.obtenerAccesosModulosUsuario(usuario.id),
      permisosApi.obtenerPermisosModulosUsuario(usuario.id),
    ])

    const accesosPerfil = listaORegistroDesdeRespuesta(accesosPerfilResponse)
    const permisosPerfil = listaORegistroDesdeRespuesta(permisosPerfilResponse)
    const accesosUsuario = listaORegistroDesdeRespuesta(accesosUsuarioResponse)
    const permisosUsuario = listaORegistroDesdeRespuesta(permisosUsuarioResponse)
    const modulosSistemaIds = new Set(
      modulosPermisosUsuario.value.map((modulo) => String(modulo.id)),
    )
    const accesosPerfilPorModulo = new Map(
      accesosPerfil
        .filter((acceso) => modulosSistemaIds.has(String(acceso.moduleId)))
        .map((acceso) => [String(acceso.moduleId), acceso]),
    )
    const permisosPerfilPorModulo = new Map(
      permisosPerfil
        .filter((permiso) => modulosSistemaIds.has(String(permiso.moduleId)))
        .map((permiso) => [String(permiso.moduleId), permiso]),
    )
    const accesosUsuarioPorModulo = new Map(
      accesosUsuario
        .filter((acceso) => modulosSistemaIds.has(String(acceso.moduleId)))
        .map((acceso) => [String(acceso.moduleId), acceso]),
    )
    const permisosUsuarioPorModulo = new Map(
      permisosUsuario
        .filter((permiso) => modulosSistemaIds.has(String(permiso.moduleId)))
        .map((permiso) => [String(permiso.moduleId), permiso]),
    )

    modulosPermisosUsuario.value = modulosPermisosUsuario.value.map((modulo) => {
      const moduleId = String(modulo.id)
      const accesoPerfil = accesosPerfilPorModulo.get(moduleId)
      const permisoPerfil = permisosPerfilPorModulo.get(moduleId)
      const accesoUsuario = accesosUsuarioPorModulo.get(moduleId)
      const permisoUsuario = permisosUsuarioPorModulo.get(moduleId)
      const hasAccess = Boolean(accesoUsuario?.hasAccess ?? accesoPerfil?.hasAccess)
      const permissions = {
        canCreate: Boolean(permisoUsuario?.canCreate ?? permisoPerfil?.canCreate),
        canUpdate: Boolean(permisoUsuario?.canUpdate ?? permisoPerfil?.canUpdate),
        canDelete: Boolean(permisoUsuario?.canDelete ?? permisoPerfil?.canDelete),
        canRead: Boolean(permisoUsuario?.canRead ?? permisoPerfil?.canRead),
      }
      return {
        ...modulo,
        hasAccess,
        accessSaved: Boolean(accesoUsuario),
        accessRecordId: accesoUsuario?.id ?? null,
        originalHasAccess: hasAccess,
        permissionsSaved: Boolean(permisoUsuario),
        permissionRecordId: permisoUsuario?.id ?? null,
        ...permissions,
        originalPermissions: { ...permissions },
      }
    })
    permisosPerfilCargados.value = true
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error.response?.data?.message || 'No se pudieron cargar los accesos y permisos del perfil.',
    })
  } finally {
    loadingPermisosPerfil.value = false
  }
}

function cerrarPermisosUsuario() {
  if (savingPermisosUsuario.value) return
  dialogoPermisos.value = false
  usuarioPermisosSeleccionado.value = null
  formPermisos.value = formPermisosBase()
  modulosPermisosUsuario.value = []
  systemUserAccessSaved.value = false
  permisosPerfilCargados.value = false
}

async function guardarPermisosUsuario() {
  const usuario = usuarioPermisosSeleccionado.value
  const { systemId, profileId } = formPermisos.value
  if (!usuario?.id || !systemId || !profileId) {
    $q.notify({ type: 'warning', message: 'Selecciona el sistema y el perfil.' })
    return
  }

  const requiereCrear = modulosPermisosUsuario.value.some(
    (modulo) => modulo.hasAccess && (!modulo.accessSaved || !modulo.permissionsSaved),
  )
  const requiereActualizar = modulosPermisosUsuario.value.some(
    (modulo) =>
      (modulo.accessSaved || modulo.permissionsSaved) && moduloTieneCambios(modulo),
  )
  const requiereCrearSistema = !systemUserAccessSaved.value
  if (
    ((requiereCrear || requiereCrearSistema) && !authStore.tienePermiso('USER', 'canCreate')) ||
    (requiereActualizar && !authStore.tienePermiso('USER', 'canUpdate'))
  ) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para guardar estos permisos.' })
    return
  }

  const modulosParaGuardar = modulosPermisosUsuario.value.filter(
    (modulo) => modulo.hasAccess || modulo.accessSaved || modulo.permissionsSaved,
  )
  savingPermisosUsuario.value = true
  let accesoSistemaGuardado = false
  let accesosModuloGuardados = 0
  let permisosModuloGuardados = 0

  try {
    if (!systemUserAccessSaved.value) {
      await permisosApi.crearAccesoSistemaUsuario({
        systemId,
        userId: usuario.id,
        profileId,
        hasAccess: true,
      })
      systemUserAccessSaved.value = true
      accesoSistemaGuardado = true
    }

    for (const modulo of modulosParaGuardar) {
      const accesoPayload = {
        moduleId: modulo.id,
        userId: usuario.id,
        hasAccess: Boolean(modulo.hasAccess),
      }

      if (modulo.accessSaved) {
        if (Boolean(modulo.hasAccess) !== Boolean(modulo.originalHasAccess)) {
          if (!modulo.accessRecordId) {
            throw new Error(`No se encontró el identificador del acceso para ${modulo.name}.`)
          }
          await permisosApi.actualizarAccesoModuloUsuario(modulo.accessRecordId, accesoPayload)
          modulo.originalHasAccess = Boolean(modulo.hasAccess)
          accesosModuloGuardados += 1
        }
      } else if (modulo.hasAccess) {
        const response = await permisosApi.crearAccesoModuloUsuario(accesoPayload)
        modulo.accessSaved = true
        modulo.accessRecordId = response.data?.data?.id ?? response.data?.id ?? null
        modulo.originalHasAccess = true
        accesosModuloGuardados += 1
      }

      const permisosPayload = {
        moduleId: modulo.id,
        userId: usuario.id,
        canCreate: Boolean(modulo.canCreate),
        canUpdate: Boolean(modulo.canUpdate),
        canDelete: Boolean(modulo.canDelete),
        canRead: Boolean(modulo.canRead),
      }

      if (modulo.permissionsSaved) {
        const cambioPermisos = ['canCreate', 'canUpdate', 'canDelete', 'canRead'].some(
          (permiso) => Boolean(modulo[permiso]) !== Boolean(modulo.originalPermissions?.[permiso]),
        )
        if (cambioPermisos) {
          if (!modulo.permissionRecordId) {
            throw new Error(`No se encontró el identificador de los permisos para ${modulo.name}.`)
          }
          await permisosApi.actualizarPermisoModuloUsuario(
            modulo.permissionRecordId,
            permisosPayload,
          )
          modulo.originalPermissions = {
            canCreate: Boolean(modulo.canCreate),
            canUpdate: Boolean(modulo.canUpdate),
            canDelete: Boolean(modulo.canDelete),
            canRead: Boolean(modulo.canRead),
          }
          permisosModuloGuardados += 1
        }
      } else if (modulo.hasAccess) {
        const response = await permisosApi.crearPermisoModuloUsuario(permisosPayload)
        modulo.permissionsSaved = true
        modulo.permissionRecordId = response.data?.data?.id ?? response.data?.id ?? null
        modulo.originalPermissions = {
          canCreate: Boolean(modulo.canCreate),
          canUpdate: Boolean(modulo.canUpdate),
          canDelete: Boolean(modulo.canDelete),
          canRead: Boolean(modulo.canRead),
        }
        permisosModuloGuardados += 1
      }
    }

    await cargarPermisosPerfilUsuario(profileId)

    $q.notify({
      type: 'positive',
      message: `Acceso al sistema ${accesoSistemaGuardado ? 'registrado' : 'ya registrado'}. Módulos: ${accesosModuloGuardados} accesos y ${permisosModuloGuardados} permisos guardados.`,
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        accesoSistemaGuardado || accesosModuloGuardados || permisosModuloGuardados
          ? `Guardado parcial. Sistema: ${accesoSistemaGuardado ? 'registrado' : 'sin cambios'}; módulos: ${accesosModuloGuardados} accesos y ${permisosModuloGuardados} permisos. Reintenta para continuar. ${error.response?.data?.message || ''}`
          : error.response?.data?.message || 'No se pudieron guardar los permisos del usuario.',
    })
  } finally {
    savingPermisosUsuario.value = false
  }
}

async function generarAcuse(fila) {
  const usuario = fila.account
  if (!usuario) return

  try {
    await descargarAcuseUsuario({
      nombre: fila.displayName,
      userName: usuario.userName || usuario.email,
      email: usuario.email,
      phoneNumber: usuario.phoneNumber || usuario.phone,
      userType:
        tiposUsuario.find((tipo) => tipo.value === Number(usuario.userType))?.label ||
        `Tipo ${usuario.userType}`,
      status: Boolean(usuario.status),
    })
    $q.notify({
      type: 'positive',
      message: 'Acuse descargado. La contraseña no se incluye porque no está disponible.',
    })
  } catch (error) {
    console.error('No se pudo generar el acuse del usuario:', error)
    $q.notify({ type: 'negative', message: 'No se pudo generar el acuse PDF.' })
  }
}

async function cambiarEstado(usuario) {
  if (!authStore.tienePermiso('USER', 'canUpdate')) return
  const nuevoEstado = !usuario.status
  actualizandoEstadoId.value = usuario.id

  try {
    await usuariosApi.actualizarEstadoUsuario(usuario.id, nuevoEstado)
    $q.notify({
      type: 'positive',
      message: `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`,
    })
    await cargarTodo()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudo cambiar el estado del usuario.',
    })
  } finally {
    actualizandoEstadoId.value = null
  }
}

function confirmarCambioEstado(usuario) {
  if (!authStore.tienePermiso('USER', 'canUpdate')) return
  const accion = usuario.status ? 'desactivar' : 'activar'
  const nombreUsuario = usuario.userName || usuario.email || 'este usuario'

  $q.dialog({
    title: `${accion.charAt(0).toUpperCase()}${accion.slice(1)} usuario`,
    message: `¿Estás seguro de que deseas ${accion} a "${nombreUsuario}"?`,
    cancel: {
      label: 'Cancelar',
      flat: true,
    },
    ok: {
      label: `Sí, ${accion}`,
      color: usuario.status ? 'negative' : 'positive',
    },
    persistent: true,
  }).onOk(() => cambiarEstado(usuario))
}

function abrirCrear(empleado) {
  if (!authStore.tienePermiso('USER', 'canCreate')) return
  empleadoSeleccionado.value = empleado
  const primerNombre = empleado.name?.trim().split(/\s+/)[0] || 'usuario'
  const apellidoPaterno = empleado.paternalSurname || 'empleado'
  const siguienteNumero = usuarios.value.length + 1

  form.value = {
    userName: `${normalizarSegmentoUsuario(primerNombre)}.${normalizarSegmentoUsuario(apellidoPaterno)}.${siguienteNumero}`,
    email: empleado.email || '',
    phoneNumber: empleado.phone || '',
    userType: null,
  }
  dialogo.value = true
}

function cerrarDialogo() {
  dialogo.value = false
  empleadoSeleccionado.value = null
  form.value = formBase()
}

function generarPassword(longitud = 16) {
  const grupos = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*_-']
  const caracteres = grupos.map(
    (grupo) => grupo[crypto.getRandomValues(new Uint32Array(1))[0] % grupo.length],
  )
  const conjunto = grupos.join('')

  while (caracteres.length < longitud) {
    caracteres.push(conjunto[crypto.getRandomValues(new Uint32Array(1))[0] % conjunto.length])
  }

  for (let indice = caracteres.length - 1; indice > 0; indice -= 1) {
    const aleatorio = crypto.getRandomValues(new Uint32Array(1))[0] % (indice + 1)
    ;[caracteres[indice], caracteres[aleatorio]] = [caracteres[aleatorio], caracteres[indice]]
  }

  return caracteres.join('')
}

async function guardar() {
  if (!authStore.tienePermiso('USER', 'canCreate')) {
    $q.notify({ type: 'warning', message: 'No tienes permiso para crear usuarios.' })
    return
  }
  if (!empleadoSeleccionado.value?.id) {
    $q.notify({ type: 'warning', message: 'No se encontró el empleado que se va a vincular.' })
    return
  }

  if (!form.value.userName.trim() || !form.value.email.trim() || !form.value.phoneNumber.trim()) {
    $q.notify({ type: 'warning', message: 'Completa todos los campos requeridos.' })
    return
  }

  if (!/.+@.+\..+/.test(form.value.email.trim())) {
    $q.notify({ type: 'warning', message: 'Ingresa un correo electrónico válido.' })
    return
  }

  if (form.value.userType === null || form.value.userType === undefined) {
    $q.notify({ type: 'warning', message: 'Selecciona un tipo de usuario.' })
    return
  }

  saving.value = true
  const passwordTemporal = generarPassword()
  try {
    await usuariosApi.crearUsuario({
      userName: form.value.userName.trim(),
      email: form.value.email.trim(),
      phoneNumber: form.value.phoneNumber.trim(),
      referenceId: empleadoSeleccionado.value.id,
      userType: form.value.userType,
      password: passwordTemporal,
    })
    $q.notify({ type: 'positive', message: 'Usuario creado correctamente.' })

    try {
      await descargarAcuseUsuario({
        nombre: nombreEmpleado(empleadoSeleccionado.value),
        userName: form.value.userName.trim(),
        password: passwordTemporal,
        email: form.value.email.trim(),
        phoneNumber: form.value.phoneNumber.trim(),
        userType: tiposUsuario.find((tipo) => tipo.value === form.value.userType)?.label,
        status: true,
      })
    } catch (errorPdf) {
      console.error('No se pudo generar el acuse del usuario:', errorPdf)
      $q.notify({
        type: 'warning',
        message: 'La cuenta se creó, pero no se pudo descargar el acuse PDF.',
      })
    }

    cerrarDialogo()
    await cargarTodo()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'No se pudo crear el usuario.',
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.usuarios-page {
  --brand-gradient: linear-gradient(125deg, #4c286f 0%, #73509a 58%, #247f86 100%);
  --surface-soft: #f5f3f8;
  --surface-card: #fff;
  --border-soft: #e5deeb;
  --text-strong: #292333;
  --text-muted: #706a7b;
  min-height: 100%;
  padding: 28px;
  display: grid;
  align-content: start;
  gap: 22px;
  background:
    radial-gradient(circle at top left, rgba(111, 68, 181, 0.1), transparent 22%),
    linear-gradient(180deg, #f8f6fa 0%, #f1f3f7 100%);
}

.usuarios-hero {
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

.usuarios-hero::before {
  position: absolute;
  inset: 0;
  background-size: 24px 24px;
  content: '';
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 760px;
}

.hero-copy h1 {
  margin: 10px 0 8px;
  color: #fff;
  font-size: 40px;
  font-weight: 850;
  line-height: 1;
}

.hero-copy p {
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 15px;
}

.hero-chip {
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.13);
  color: #fff;
  font-weight: 700;
}

.hero-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.secondary-action {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--border-soft);
  background: #fff !important;
  color: #5b337f !important;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 100px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(55, 38, 72, 0.05);
}

.stat-icon {
  display: grid;
  width: 48px;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 12px;
  font-size: 22px;
}

.accent-blue .stat-icon {
  color: #176b83;
  background: #e2f1f4;
}

.accent-green .stat-icon {
  color: #32805a;
  background: #e5f3e9;
}

.accent-orange .stat-icon {
  color: #a46a28;
  background: #fbf0df;
}

.stat-text {
  display: grid;
  gap: 2px;
}

.stat-text strong {
  color: var(--text-strong);
  font-size: 26px;
  line-height: 1.1;
}

.stat-text span {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 650;
}

.content-card {
  position: relative;
  overflow: hidden;
  border-color: var(--border-soft);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(55, 38, 72, 0.05);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--border-soft);
}

.panel-header h2 {
  margin: 0;
  color: var(--text-strong);
  font-size: 18px;
  font-weight: 800;
}

.panel-header p {
  margin: 6px 0 0;
  color: var(--text-muted);
}

.search-input {
  width: min(100%, 350px);
  min-width: 280px;
}

.directory-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-filter {
  width: min(100%, 230px);
}

.usuarios-table {
  margin: 12px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  background: transparent;
}

.usuarios-table :deep(thead tr) {
  background: #4c286f;
}

.usuarios-table :deep(thead th) {
  height: 48px;
  border-bottom: 0;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  text-align: left;
  text-transform: uppercase;
}

.usuarios-table :deep(tbody td) {
  height: 70px;
  border-bottom: 1px solid #eee9f2;
}

.usuarios-table :deep(tbody tr:hover) {
  background: #faf8fc;
}

.usuarios-table :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.employee-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.employee-avatar {
  flex: 0 0 auto;
  color: #5b337f;
  background: #eee7f5;
}

.employee-cell > div:last-child,
.account-cell {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.employee-cell strong,
.account-cell span {
  overflow-wrap: anywhere;
  color: var(--text-strong);
}

.employee-cell span {
  color: var(--text-muted);
  font-size: 12px;
}

.account-cell {
  justify-items: start;
}

.employee-mobile-card {
  border-color: var(--border-soft);
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(55, 38, 72, 0.05);
}

.employee-mobile-card__head {
  padding: 14px;
}

.employee-mobile-card__body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.mobile-field {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.mobile-field--full {
  grid-column: 1 / -1;
}

.mobile-field span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.mobile-field strong {
  overflow-wrap: anywhere;
  color: var(--text-strong);
  font-size: 13px;
}

.usuario-dialog {
  width: min(100%, 520px);
  max-width: 520px;
  border-radius: 7px;
}

.permissions-dialog {
  width: min(100%, 860px);
  max-width: 860px;
}

.permissions-dialog__body {
  position: relative;
  display: grid;
  gap: 8px;
  max-height: min(65vh, 620px);
  overflow-y: auto;
}

.user-module-groups {
  display: grid;
  gap: 20px;
  margin-top: 4px;
}

.user-module-group {
  display: grid;
  gap: 9px;
}

.user-module-group__header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-soft);
}

.user-module-group__header h3 {
  margin: 0;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 800;
}

.module-profile-hint {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.user-module-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(400px, 1.7fr);
  align-items: center;
  gap: 14px;
  padding: 11px 13px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: #fff;
}

.user-module-row__name {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.user-module-row__name strong,
.user-module-row__name span {
  overflow-wrap: anywhere;
}

.user-module-row__name strong {
  color: #263c40;
}

.user-module-row__name span {
  color: #718184;
  font-size: 12px;
}

.user-module-row__name .module-save-status {
  color: #9b641f;
  font-weight: 700;
}

.user-module-row__checks {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 3px;
}

.dialog-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  color: #fff;
  background: var(--brand-gradient);
}

.dialog-hero h2 {
  margin: 12px 0 5px;
  font-size: 23px;
}

.dialog-hero p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
}

.dialog-hero .hero-chip {
  background: rgba(255, 255, 255, 0.17);
  color: #fff;
}

.dialog-body {
  display: grid;
  gap: 8px;
  padding: 22px 24px 8px;
}

.selected-employee {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 13px;
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  background: #f8f5fa;
  color: #5b337f;
  font-size: 22px;
}

.selected-employee div {
  display: grid;
  gap: 3px;
  color: var(--text-strong);
  font-size: 14px;
}

.selected-employee span {
  color: var(--text-muted);
  font-size: 12px;
}

.dialog-actions {
  padding: 12px 24px 20px;
}

@media (max-width: 900px) {
  .usuarios-hero,
  .panel-header {
    align-items: stretch;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .directory-filters {
    align-items: stretch;
  }

  .search-input {
    min-width: 0;
    width: 100%;
  }

  .user-module-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
}

@media (max-width: 700px) {
  .usuarios-page {
    padding: 16px;
    gap: 16px;
  }

  .usuarios-hero {
    min-height: 0;
    padding: 24px 20px;
  }

  .hero-copy h1 {
    font-size: 34px;
  }

  .hero-actions {
    justify-content: stretch;
  }

  .secondary-action {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .stat-card {
    min-height: 76px;
    padding: 12px;
  }

  .panel-header {
    padding: 18px 16px;
  }

  .directory-filters {
    align-items: stretch;
    flex-direction: column;
  }

  .type-filter {
    width: 100%;
  }

  .user-module-row__checks {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
