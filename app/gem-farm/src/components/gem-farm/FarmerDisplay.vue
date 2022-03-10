<template>
<div>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-center mb-4">

    <div class="bg-white p-3 rounded-xl">
      <span class="text-gray-600">
        <label class="text-sm">
        {{NFT_SHORT_NAME}} {{STAKED_NAME.toLowerCase()}}
        </label><br />
        <span class="font-semibold text-indigo-600 text-3xl">{{ Math.ceil(100 * (farmAcc.gemsStaked ?? 0) / TOTAL_NFTS_COUNT) }}%</span><br />
        <span class="text-xs italic text-gray-400">{{ (farmAcc.gemsStaked ?? 0) }} of {{TOTAL_NFTS_COUNT}} possible</span>
      </span>
    </div>

    <div class="bg-white p-3 rounded-xl">
      <span class="text-gray-600">
        <label class="text-sm">
        Total Minimum Value Locked
        </label><br />
        <span v-if="farmAcc && magicEdenFloor && solPrice" class="font-semibold text-indigo-600 text-3xl">${{ Math.floor((((parseInt(farmAcc.gemsStaked) * magicEdenFloor * solPrice) * 100))/100).toLocaleString() }}</span>
        <span v-else class="font-semibold text-indigo-600 text-3xl">–</span><br />
        <span v-if="farmAcc && magicEdenFloor && solPrice" class="text-xs italic text-gray-400">based on {{magicEdenFloor}} SOL floor</span>
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
        ${{SPL_TOKEN_NAME}} Redeemed
        </label><br />
        <span class="font-semibold text-indigo-600 text-3xl">{{ parseInt(farmAcc.rewardA.funds.totalAccruedToStakers ?? 0).toLocaleString() }}</span><br />
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
import { parseDate } from '@/common/util';
import { NFT_SHORT_NAME, NFT_SHORT_NAME_SINGULAR, STAKED_NAME, VAULT_NAME, SPL_TOKEN_NAME, TOTAL_NFTS_COUNT } from '@/common/config'
import axios from 'axios';

export default defineComponent({
  components: { FarmerRewardDisplay },
  props: {
    farm: String,
    farmAcc: Object,
    farmer: String,
    farmerAcc: Object,
  },
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
      if (wallet.value && getConnection()) {
        gf = await initGemFarm(getConnection(), wallet.value as any);
      }

      const meRes = (await axios.get('https://api-dot-treat-toolbox.uc.r.appspot.com/magic-eden')).data
      const solPriceRes = (await axios.get('https://data.messari.io/api/v1/assets/solana/metrics')).data
      magicEdenFloor.value = meRes.floorPrice/1000000000
      solPrice.value = solPriceRes.data.market_data.price_usd
    });

    // --------------------------------------- display farmer
    // todo ideally should be using one from client, but n/a during render
    const parseFarmerState = (farmer: any): string => {
      return Object.keys(farmer.state)[0];
    };

    return {
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
