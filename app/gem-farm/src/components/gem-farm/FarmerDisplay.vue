<template>
<div>
  <div class="absolute top-5 right-5 primary px-4 py-2 rounded-full bg-indigo-500 cursor-pointer" @click="refreshFarmer">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-5 -mt-1 inline-block text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    <span class="text-white inline-block ml-1">Refresh</span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-center mb-4">

    <div class="bg-white p-3 rounded-xl">
      <span class="text-gray-600">
        <label class="text-sm">
        {{NFT_SHORT_NAME}} {{STAKED_NAME.toLowerCase()}}
        </label><br />
        <span class="font-semibold text-indigo-600 text-3xl">{{ Math.ceil((farmAcc.gemsStaked ?? 0) / TOTAL_NFTS_COUNT) }}%</span><br />
        <span class="text-xs italic text-gray-400">{{ (farmAcc.gemsStaked ?? 0) }} of {{TOTAL_NFTS_COUNT}} possible</span>
      </span>
    </div>

    <div v-if="farmAcc && magicEdenFloor && solPrice" class="bg-white p-3 rounded-xl">
      <span class="text-gray-600">
        <label class="text-sm">
        Total Minimum Value Locked
        </label><br />
        <span class="font-semibold text-indigo-600 text-3xl">${{ (Math.floor((parseInt(farmAcc.gemsStaked) * magicEdenFloor * solPrice) * 100))/100 }}</span><br />
        <span class="text-xs italic text-gray-400">based on {{magicEdenFloor}} SOL floor</span>
      </span>
    </div>

    <div class="bg-white p-3 rounded-xl">
      <span class="text-gray-600">
        <label class="text-sm">
        You have
        </label><br />
        <span class="font-semibold text-indigo-600 text-3xl">{{ farmerAcc.gemsStaked ?? 0 }} {{farmerAcc.gemsStaked == 1 ? NFT_SHORT_NAME_SINGULAR : NFT_SHORT_NAME }}</span><br />
        <span class="text-xs italic text-gray-400">{{STAKED_NAME.toLowerCase()}} in this {{VAULT_NAME.toLowerCase()}}</span>
      </span>
    </div>

    <div class="bg-white p-3 rounded-xl">
      <span class="text-gray-600">
        <label class="text-sm">
        ${{SPL_TOKEN_NAME}} Earned
        </label><br />
        <span class="font-semibold text-indigo-600 text-3xl">{{ farmAcc.rewardA.funds.totalAccruedToStakers }}</span><br />
        <span class="text-xs italic text-gray-400">by all {{NFT_SHORT_NAME_SINGULAR}} holders to date</span>
      </span>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import FarmerRewardDisplay from '@/components/gem-farm/FarmerRewardDisplay.vue';
import { useWallet } from 'solana-wallets-vue'
import useCluster from '@/composables/cluster';
import { initGemFarm } from '@/common/gem-farm';
import { PublicKey } from '@solana/web3.js';
import { parseDate } from '@/common/util';
import { NFT_SHORT_NAME, NFT_SHORT_NAME_SINGULAR, STAKED_NAME, VAULT_NAME, SPL_TOKEN_NAME, TOTAL_NFTS_COUNT } from '../../../../../src'
import axios from 'axios';

export default defineComponent({
  components: { FarmerRewardDisplay },
  props: {
    farm: String,
    farmAcc: Object,
    farmer: String,
    farmerAcc: Object,
  },
  emits: ['refresh-farmer'],
  setup(props, ctx) {
    const { wallet } = useWallet();
    const { cluster, getConnection } = useCluster();

    const magicEdenFloor = ref<Number>();
    const solPrice = ref<Number>();

    let gf: any;
    watch([wallet, cluster], async () => {
      gf = await initGemFarm(getConnection(), wallet.value as any);
    });

    //need an onmounted hook because this component isn't yet mounted when wallet/cluster are set
    onMounted(async () => {
      if (wallet && getConnection()) {
        gf = await initGemFarm(getConnection(), wallet.value as any);
      }

      const meRes = (await axios.get('http://localhost:8081/magic-eden')).data
      const solPriceRes = (await axios.get('https://data.messari.io/api/v1/assets/solana/metrics')).data
      magicEdenFloor.value = meRes.floorPrice/1000000000
      solPrice.value = solPriceRes.data.market_data.price_usd
    });

    // --------------------------------------- display farmer
    // todo ideally should be using one from client, but n/a during render
    const parseFarmerState = (farmer: any): string => {
      return Object.keys(farmer.state)[0];
    };

    const refreshFarmer = async () => {
      await gf.refreshFarmerWallet(
        new PublicKey(props.farm!),
        new PublicKey(props.farmer!)
      );
      ctx.emit('refresh-farmer');
    };

    return {
      refreshFarmer,
      parseFarmerState,
      magicEdenFloor,
      solPrice,
      parseDate,
      NFT_SHORT_NAME, 
      NFT_SHORT_NAME_SINGULAR,
      STAKED_NAME,
      VAULT_NAME,
      SPL_TOKEN_NAME,
      TOTAL_NFTS_COUNT
    };
  },
});
</script>

<style scoped></style>
