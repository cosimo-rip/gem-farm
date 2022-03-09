<template>
  <div>
    <h1 class="mb-4 w-60 md:w-auto h-8 md:h-4 text-xl md:text-4xl">{{PAGE_TITLE}}</h1>

    <div v-if="wallet" class="absolute top-8 right-10 desktop">
      <ConfigPane />
    </div>

    <div class="desktop">
      <div v-if="!wallet">
        <div class="text-center h-full flex bg-gray-200" style="min-height: calc(100vh - 150px)">
          <div class="m-auto">
            <div class="text-center mb-5">Connect your wallet to begin</div>

            <div class="text-center mx-auto inline-block">
              <ConfigPane />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="relative">
        <div v-if="farmerAcc">
          <div class="h-full bg-gray-200 p-5" style="min-height: calc(100vh - 150px)">
            <FarmerRewardDisplay
              :key="farmerAcc.rewardA"
              :farmReward="farmAcc.rewardA"
              :farmAcc="farmAcc"
              :eventIsActive="farmAcc.rewardA.times.rewardEndTs > (this.currentTS / 1000)"
            />
            <FarmerDisplay
              :key="farmerAcc"
              :farm="farm"
              :farmAcc="farmAcc"
              :farmer="farmer"
              :farmerAcc="farmerAcc"
            />
            <Vault
              :key="farmerAcc"
              class="mb-10"
              :vault="farmerAcc.vault.toBase58()"
              :farmerState="farmerState"
              :farmAcc="farmAcc"
              :farmerAcc="farmerAcc"
              :cooldownEndsTs="farmerAcc.cooldownEndsTs"
              :eventIsActive="farmAcc.rewardA.times.rewardEndTs > (this.currentTS / 1000)"
              @begin-staking="beginStaking"
              @end-staking="endStaking"
              @claim-rewards="claimRewards"
            />
          </div>


        </div>
        <div v-else>
          <div class="text-center h-full flex bg-gray-200 p-5" style="min-height: calc(100vh - 150px)">
            <div class="m-auto">
              <div v-if="fetchingFarmFailed">
                Connection Issues. Please reload and try again.
              </div>
              <div v-else-if="loading">
                Loading...
              </div>
              <div v-else>
                <div class="w-full text-center mb-5">
                  Before you can {{STAKE_NAME.toLowerCase()}} {{NFT_SHORT_NAME}}, you'll need a {{VAULT_NAME.toLowerCase()}}.
                </div>
                <div class="w-full text-center">
                  <button class="is-primary primary text-center" @click="initFarmer">
                    New {{VAULT_NAME}}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile">
      <div class="text-center h-full flex bg-gray-200" style="min-height: calc(100vh - 150px)">
        <p class="max-w-xs mx-auto mt-40">We're Sorry!<br /><br />Staking is not currently supported<br />on mobile devices.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue';
import { useWallet } from 'solana-wallets-vue'
import useCluster from '@/composables/cluster';
import { initGemFarm } from '@/common/gem-farm';
import { PublicKey } from '@solana/web3.js';
import ConfigPane from '@/components/ConfigPane.vue';
import FarmerDisplay from '@/components/gem-farm/FarmerDisplay.vue';
import FarmerRewardDisplay from '@/components/gem-farm/FarmerRewardDisplay.vue'
import Vault from '@/components/gem-bank/Vault.vue';
import { findFarmerPDA, stringifyPKsAndBNs } from '@gemworks/gem-farm-ts';
import { useToast } from "vue-toastification";
import { useLoading } from 'vue-loading-overlay';
import { PAGE_TITLE, VAULT_NAME, SPL_TOKEN_NAME, STAKE_NAME, STAKED_NAME, UNSTAKE_NAME, UNSTAKED_NAME, NFT_SHORT_NAME, ACTIVE_FARM_ID } from '@/common/config';

export default defineComponent({
  components: { Vault, FarmerDisplay, FarmerRewardDisplay, ConfigPane },

  created() {
    const interval = setInterval(() => {
      this.currentTS = Date.now()
    }, 5000)
    onUnmounted(() => clearInterval(interval))
  },

  setup() {
    const { wallet, connecting, connected } = useWallet();
    const { cluster, getConnection } = useCluster();
    const toast = useToast();
    const loader = useLoading({ color: '#4f46e5', loader: 'bars'});

    let gf: any;
    watch([wallet, connected, cluster], async () => {
      if (wallet.value && getConnection()) {
        console.log("wallet updated with wallet and connection")
        await freshStart(wallet.value, cluster.value, getConnection());
      }
    });

    //needed in case we switch in from another window
    onMounted(async () => {
      if (wallet.value && wallet.value.publicKey && cluster.value && getConnection()) {
        console.log("mounted with wallet and connection")
        await freshStart(wallet.value, cluster.value, getConnection());
      }
    });

    // --------------------------------------- farmer details
    const farm = ref<string>(ACTIVE_FARM_ID);
    const farmAcc = ref<any>();

    const farmerIdentity = ref<string>();
    const farmerAcc = ref<any>();
    const farmerState = ref<string>();

    const availableA = ref<string>();
    const availableB = ref<string>();

    const fetchingFarmFailed = ref<boolean>(false);

    const loading = ref<boolean>(true);
    const loadedWallet = ref<any>(null);
    const loadedCluster = ref<any>(null);

    const updateAvailableRewards = async () => {
      availableA.value = farmerAcc.value.rewardA.accruedReward
        .sub(farmerAcc.value.rewardA.paidOutReward)
        .toString();
      availableB.value = farmerAcc.value.rewardB.accruedReward
        .sub(farmerAcc.value.rewardB.paidOutReward)
        .toString();
    };

    const fetchFarn = async () => {
      farmAcc.value = await gf.fetchFarmAcc(new PublicKey(farm.value!));
      console.log(
        `farm found at ${farm.value}:`,
        stringifyPKsAndBNs(farmAcc.value)
      );
    };

    const fetchFarmer = async (wallet: any) => {
      console.log("fetching farmer wallet:", wallet);
      const [farmerPDA] = await findFarmerPDA(
        new PublicKey(farm.value!),
        wallet.publicKey!
      );
      farmerIdentity.value = wallet.publicKey?.toBase58();
      farmerAcc.value = await gf.fetchFarmerAcc(farmerPDA);
      farmerState.value = gf.parseFarmerState(farmerAcc.value);
      await updateAvailableRewards();
      console.log(
        `farmer found at ${farmerIdentity.value}:`,
        stringifyPKsAndBNs(farmerAcc.value)
      );
    };

    const freshStart = async (wallet: any, cluster: String, connection: any) => {
      if (wallet.publicKey.toString() == loadedWallet.value 
          && cluster == loadedCluster.value) {
        // duplicate request
        console.log("suppressed duplicate request");
        return;
      }

      console.log(loadedWallet.value + " vs " + wallet.publicKey.toString());
      console.log(loadedCluster.value + " vs " + cluster);

      loading.value = true;
      loadedWallet.value = wallet.publicKey.toString();
      loadedCluster.value = cluster;

      gf = await initGemFarm(connection, wallet);
      farmerIdentity.value = wallet.publicKey?.toBase58();

      // debugging code to capture snapshot of all wallets w/plots

      // const farmerPDAs = await fetchAllFarmerPDAs(new PublicKey(ACTIVE_FARM_ID), undefined);
      // console.log(farmerPDAs);
      // const idPromises = farmerPDAs.map(async f => gf.fetchFarmerAcc(f.publicKey));
      // Promise.all(idPromises).then(function(results) {
      //   const ids = results.map((r: any) => r.identity.toString());
      //   console.log(ids)
      // })

      //reset stuff
      farmAcc.value = undefined;
      farmerAcc.value = undefined;
      farmerState.value = undefined;
      availableA.value = undefined;
      availableB.value = undefined;

      try {
        await fetchFarn();
        fetchingFarmFailed.value = false;
      } catch (e) {
        toast.error("Failed to load app. Please try again later.");
        console.log(e);
        fetchingFarmFailed.value = true;
      }

      try {
        await fetchFarmer(wallet);
      } catch (e) {
        console.log(`no farmer found with public key: ${wallet.publicKey}`);
      }

      setTimeout(function() {
        loading.value = false;
      }, 500)
    };

    const initFarmer = async () => {
      try {
        await gf.initFarmerWallet(new PublicKey(farm.value));
        await fetchFarmer(wallet.value as any);
      } catch (error) {
        toast.error(`Failed to create ${VAULT_NAME}: ${error.message}`);
      }
    };

    // --------------------------------------- staking
    const beginStaking = async () => {
      const ld = loader.show();
      try {
        await gf.stakeWallet(new PublicKey(farm.value));
        await fetchFarmer(wallet.value as any);

        toast.success(`${NFT_SHORT_NAME} ${STAKED_NAME}`);
      } catch (error) {
        toast.error(`${STAKE_NAME} Failed: ${error.message}`);
      }
      ld.hide()
    };

    const endStaking = async () => {
      const ld = loader.show();
      try {
        await gf.unstakeWallet(new PublicKey(farm.value!));
        await fetchFarmer(wallet.value as any);

        toast.success(`${NFT_SHORT_NAME} ${UNSTAKED_NAME}`);
      } catch (error) {
        toast.error(`${UNSTAKE_NAME} Failed: ${error.message}`);
      }
      ld.hide();
    };
    
    const claimRewards = async () => {
      const ld = loader.show();
      try {
        await gf.claimWallet(
          new PublicKey(farm.value!),
          new PublicKey(farmAcc.value.rewardA.rewardMint!),
          new PublicKey(farmAcc.value.rewardB.rewardMint!)
        );
        await fetchFarmer(wallet.value as any);
        toast.success(`$${SPL_TOKEN_NAME} Claimed`);
      } catch (error) {
        toast.error(`Claiming $${SPL_TOKEN_NAME} Failed: ${error.message}`);
      }
      ld.hide();
    };

    const fetchAllFarmerPDAs = async (farm?: PublicKey, identity?: PublicKey) => {
        const filter: any = [];

        if (farm) {
            filter.push({
                memcmp: {
                    offset: 8, //need to prepend 8 bytes for anchor's disc
                    bytes: farm.toBase58(),
                },
            });
        }

        if (identity) {
            filter.push({
                memcmp: {
                    offset: 40, // need to prepend 8 bytes for anchor's disc
                    bytes: identity.toBase58(),
                },
            });
        }

        return gf.farmProgram.account.farmer.all(filter);
    }

    return {
      currentTS: Date.now(),
      wallet,
      connecting,
      loading,
      farm,
      farmAcc,
      farmer: farmerIdentity,
      farmerAcc,
      farmerState,
      availableA,
      availableB,
      initFarmer,
      beginStaking,
      endStaking,
      claimRewards,
      fetchingFarmFailed,
      // addGems,
      PAGE_TITLE,
      VAULT_NAME, 
      SPL_TOKEN_NAME,
      STAKE_NAME,
      NFT_SHORT_NAME,
      UNSTAKE_NAME
    };
  },
});
</script>

<style scoped></style>
