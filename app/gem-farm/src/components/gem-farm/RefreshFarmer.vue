<template>
  <div class="nes-container with-title">
    <p class="title">Refresh Farmer</p>
    <form @submit.prevent="refreshFarmer">
      <div class="nes-field mb-5">
        <label for="farmer">Farmer to refresh:</label>
        <input type="text" id="farmer" v-model="farmer"  />
      </div>
      <button class="mb-5 is-primary primary" type="submit">Refresh</button>
    </form>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import { useWallet } from 'solana-wallets-vue'
import useCluster from '@/composables/cluster';
import { initGemFarm } from '@/common/gem-farm';
import { PublicKey } from '@solana/web3.js';

export default defineComponent({
  props: {
    farm: String,
  },
  setup(props, ctx) {
    const { wallet } = useWallet();
    const { cluster, getConnection } = useCluster();

    let gf: any;
    watch([wallet, cluster], async () => {
      gf = await initGemFarm(getConnection(), wallet.value as any);
    });

    //need an onmounted hook because this component isn't yet mounted when wallet/cluster are set
    onMounted(async () => {
      if (wallet && getConnection()) {
        gf = await initGemFarm(getConnection(), wallet.value as any);
      }
    });

    // --------------------------------------- refresh farmer
    const farmer = ref<string>();

    const refreshFarmer = async () => {
      return gf.refreshFarmerWallet(
        new PublicKey(props.farm!),
        new PublicKey(farmer.value!)
      );
    };

    return {
      farmer,
      refreshFarmer,
    };
  },
});
</script>

<style scoped></style>
