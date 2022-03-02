const log = console.log;
const allow = true;
console.log = (...params: any) => {
  if (allow) log(params);
};

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './index.css';

createApp(App).use(router).mount('#app');
