import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Farmer from '@/views/Farmer.vue';
import Manager from '@/views/Manager.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Farmer',
    component: Farmer,
  },
  {
    path: '/admin',
    name: 'Farm Manager',
    component: Manager,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
