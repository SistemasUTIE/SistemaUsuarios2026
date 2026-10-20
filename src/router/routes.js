

const routes = [
  // ---------------------------------------
  // Sistema principal
  // ---------------------------------------
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),

    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/home.vue'),
      },
      {
        path: 'perfiles',
        name: 'perfiles',
        component: () => import('@/pages/perfiles.vue'),
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/pages/usuarios.vue'),
      },
      {
        path: 'asignacion-masiva',
        name: 'asignacion-masiva',
        component: () => import('@/pages/asignacion-masiva.vue'),
      },
      {
        path: 'sistemas',
        name: 'sistemas',
        component: () => import('@/pages/sistemas.vue'),
      },
      {
        path: 'sistemas/:systemId/modulos',
        name: 'modulos',
        component: () => import('@/pages/modulos.vue'),
        props: true,
      },
      {
        path: 'permisos',
        redirect: { name: 'perfiles' },
      },
    ],
  },


  // {
  //   path: '/:catchAll(.*)*',
  //   component: () => import('@/pages/ErrorNotFound.vue'),
  // },
]

export default routes
