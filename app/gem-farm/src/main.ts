const log = console.log;
const allow = true;
console.log = (...params: any) => {
  if (allow) log(params);
};

import { createApp } from 'vue';
import App from './App.vue';
import SolanaWallets from 'solana-wallets-vue';
import router from './router';
import Toast from 'vue-toastification';
import VueLoading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';
import 'vue-toastification/dist/index.css';

import 'solana-wallets-vue/styles.css';
import './index.css';

import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  SolletWalletAdapter,
  SolletExtensionWalletAdapter,
} from '@solana/wallet-adapter-wallets';

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SlopeWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new SolletWalletAdapter(),
    new SolletExtensionWalletAdapter(),
  ],
  autoConnect: true,
};

createApp(App)
  .use(SolanaWallets, walletOptions)
  .use(VueLoading)
  .use(Toast, {
    transition: 'Vue-Toastification__fade',
    maxToasts: 10,
    newestOnTop: false,
    position: 'bottom-right',
    timeout: 4000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: false,
    draggablePercent: 0.34,
    showCloseButtonOnHover: true,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false,
  })
  .use(router)
  .mount('#app');
