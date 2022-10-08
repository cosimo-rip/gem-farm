import { readonly, ref } from 'vue';
import { Commitment, Connection, ConnectionConfig } from '@solana/web3.js';
import { tokenAuthFetchMiddleware } from '@strata-foundation/web3-token-auth';

export enum Cluster {
  Mainnet = 'mainnet',
  Devnet = 'devnet',
  Testnet = 'testnet',
  Localnet = 'localnet',
}

const clusterURLMapping = {
  mainnet:
    process.env.VUE_APP_MAINNET_URL ||
    'https://solana-mainnet.g.alchemy.com/v2/IY_yNxGy-g_cDohTGukiw4v3RPv0oZvg',
  devnet: process.env.VUE_APP_DEVNET_URL || 'https://api.devnet.solana.com',
  testnet: process.env.VUE_APP_TESTNET_URL || 'https://api.testnet.solana.com',
  localnet: process.env.VUE_APP_LOCALNET_URL || 'http://localhost:8899',
};

const cluster = ref<Cluster>(Cluster.Mainnet);

export default function useCluster() {
  const getToken = async (): Promise<string> => {
    const response = await fetch(process.env.VUE_APP_TOKEN_API_URL || '');
    const json = await response.json();
    return json.token;
  };

  const getClusterURL = (): string => clusterURLMapping[cluster.value];

  const getConnection = (commitment?: Commitment): Connection => {
    return new Connection(getClusterURL(), {
      commitment: commitment ?? 'processed',
      confirmTransactionInitialTimeout: 90 * 1000,
      fetchMiddleware: tokenAuthFetchMiddleware({
        tokenExpiry: 60 * 60 * 1000, // 1 hr
        getToken,
      }),
    });
  };

  const setCluster = (newCluster: Cluster) => {
    cluster.value = newCluster;
    // capping at 10 chars due to security (not to expose the token)
    console.log(
      `Cluster updated, now ${newCluster} (${getClusterURL().substr(0, 10)})`
    );
  };

  return {
    cluster: readonly(cluster),
    getClusterURL,
    getConnection,
    setCluster,
  };
}
