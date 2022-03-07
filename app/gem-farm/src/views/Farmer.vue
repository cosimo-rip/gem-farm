<template>
  <div>
    <h1 class="mb-4 w-60 md:w-auto h-8 md:h-4 text-xl md:text-4xl">{{PAGE_TITLE}}</h1>

    <div v-if="wallet" class="absolute top-8 right-10">
      <ConfigPane />
    </div>

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
import { PAGE_TITLE, VAULT_NAME, SPL_TOKEN_NAME, STAKE_NAME, UNSTAKE_NAME, NFT_SHORT_NAME, ACTIVE_FARM_ID } from '@/common/config';
import App from '../App.vue'
import VueToast from 'vue-toast-notification';

export default defineComponent({
  components: { Vault, FarmerDisplay, FarmerRewardDisplay, ConfigPane },

  created() {
    const interval = setInterval(() => {
      this.currentTS = Date.now()
    }, 5000)
    onUnmounted(() => clearInterval(interval))
  },

  setup() {
    const { wallet } = useWallet();
    const { cluster, getConnection } = useCluster();

    let gf: any;
    watch([wallet, cluster], async () => {
      await freshStart();
    });

    //needed in case we switch in from another window
    onMounted(async () => {
      await freshStart();
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

    const fetchFarmer = async () => {
      const [farmerPDA] = await findFarmerPDA(
        new PublicKey(farm.value!),
        wallet.value!.publicKey!
      );
      farmerIdentity.value = wallet.value!.publicKey?.toBase58();
      farmerAcc.value = await gf.fetchFarmerAcc(farmerPDA);
      farmerState.value = gf.parseFarmerState(farmerAcc.value);
      await updateAvailableRewards();
      console.log(
        `farmer found at ${farmerIdentity.value}:`,
        stringifyPKsAndBNs(farmerAcc.value)
      );
    };

    const freshStart = async () => {
      if (wallet.value && getConnection()) {
        gf = await initGemFarm(getConnection(), wallet.value as any);
        farmerIdentity.value = wallet.value!.publicKey?.toBase58();

        //reset stuff
        farmAcc.value = undefined;
        farmerAcc.value = undefined;
        farmerState.value = undefined;
        availableA.value = undefined;
        availableB.value = undefined;

        try {
          await fetchFarn();
          await fetchFarmer();
          fetchingFarmFailed.value = false;
        } catch (e) {
          console.log(`farm with PK ${farm.value} not found :(`);
          console.log(e);
          fetchingFarmFailed.value = true;
        }
      }
    };

    const initFarmer = async () => {
      try {
        await gf.initFarmerWallet(new PublicKey(farm.value));
        await fetchFarmer();
      } catch (error) {
        App.$toast.open("Failed to create " + VAULT_NAME + ".");
      }
    };

    // --------------------------------------- staking
    const beginStaking = async () => {
      try {
        await gf.stakeWallet(new PublicKey(farm.value));
        await fetchFarmer();
      } catch (error) {

        App.$toast.open("Staking Failed");
      }
    };

    const endStaking = async () => {
      try {
        await gf.unstakeWallet(new PublicKey(farm.value!));
        await fetchFarmer();
      } catch (error) {
        console.log("end staking failed")
        App.$toast.open("End Staking Failed.");
      }
    };

    const claimRewards = async () => {
      await gf.claimWallet(
        new PublicKey(farm.value!),
        new PublicKey(farmAcc.value.rewardA.rewardMint!),
        new PublicKey(farmAcc.value.rewardB.rewardMint!)
      );
      await fetchFarmer();
    };

    return {
      currentTS: Date.now(),
      wallet,
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
