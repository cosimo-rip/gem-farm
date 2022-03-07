const log = console.log;
const allow = false;
console.log = (...params: any) => {
  if (allow) log(params);
};

import { createApp } from 'vue';
import App from './App.vue';
import SolanaWallets from 'solana-wallets-vue';
import VueToast from 'vue-toast-notification';
import router from './router';

import 'solana-wallets-vue/styles.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import './index.css';

import {
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SlopeWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
  ],
  autoConnect: true,
};

createApp(App)
  .use(SolanaWallets, walletOptions)
  .use(VueToast)
  .use(router)
  .mount('#app');
