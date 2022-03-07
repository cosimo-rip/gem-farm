import { PublicKey } from '@solana/web3.js';

export * from './gem-bank';
export * from './gem-farm';
export * from './gem-common';

export const GEM_BANK_PROG_ID = new PublicKey(
  'bankHHdqMuaaST4qQk6mkzxGeKPHWmqdgor6Gs8r88m'
);
export const GEM_FARM_PROG_ID = new PublicKey(
  'farmL4xeBFVXJqtfxCzU9b28QACM7E2W2ctT6epAjvE'
);
export const WALLET_NFT_CREATOR_FILTER = new PublicKey(
  'Bhr9iWx7vAZ4JDD5DVSdHxQLqG9RvCLCSXvu6yC4TF6c'
);

export const ACTIVE_FARM_ID = 'EcikR7zeJXpTFH6kAhGr8qvF1NKWZsK25u7fmbjDcinA';

export const PAGE_TITLE = 'SKULL STAKING';
export const NFT_SHORT_NAME = 'SKULLS';
export const NFT_SHORT_NAME_SINGULAR = 'SKULL';
export const SPL_TOKEN_NAME = 'SKULL';
export const VAULT_NAME = 'Plot';
export const VAULT_ICON = '🪦';
export const COOLING_DOWN_NAME = 'Reanimating';
export const STAKE_NAME = 'Bury';
export const STAKED_NAME = 'Buried';
export const UNSTAKE_NAME = 'Exhume';
export const WELCOME_MSG = 'Welcome to the graveyard.';
export const UNSTAKE_CHARACTER = 'Gravedigger';
export const UNSTAKE_CHARACTER_PRONOUN = 'He';
export const TOTAL_NFTS_COUNT = 6666;

// ** DONT forget to update the page title in index.html **
