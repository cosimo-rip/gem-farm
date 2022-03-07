<template>
  <div>
    <h1 class="mb-4 w-60 md:w-auto h-8 md:h-4 text-xl md:text-4xl">{{PAGE_TITLE}} MGMT</h1>
    
    <div v-if="wallet" class="absolute top-8 right-8">
      <ConfigPane />
    </div>

    <div v-if="!wallet" class="text-center h-full bg-gray-200 flex" style="min-height: calc(100vh - 150px)">
      <div class="m-auto">
        <div class="text-center mb-5">Connect your wallet to begin</div>

        <div class="text-center mx-auto inline-block">
          <ConfigPane />
        </div>
      </div>
    </div>
    <div v-else>
      <div class="flex mb-10 w-full justify-center">
        <button
          class="is-primary mr-5 primary"
          @click="showNewFarm = !showNewFarm"
        >
          New farm
        </button>
        <button class="primary" @click="refreshFarms">Refetch farms</button>
      </div>

      <!--new farm-->
      <div v-if="showNewFarm">
        <TestMint class="mb-10" />
        <InitFarm class="mb-10" @new-farm="handleNewFarm" />
      </div>

      <!--existing farms-->
      <div v-if="foundFarms && foundFarms.length">
        <!--farm selector-->
        <div class="mb-10 border-black border p-5">
          <p class="title">Farm Details</p>
          <p class="mb-2">Choose farm:</p>
          <div class="mb-5">
            <select v-model="farm">
              <option v-for="f in foundFarms" :key="f.publicKey.toBase58()">
                {{ f.publicKey.toBase58() }}
              </option>
            </select>
          </div>
          (Front-end uses: {{ACTIVE_FARM_ID}})<br /><br />
          <FarmDisplay :key="farmAcc" :farmAcc="farmAcc" :eventIsActive="true" />
        </div>
        <!--update farm-->
        <div class="mb-10 border-black border p-5">
          <UpdateFarm :farm="farm" @update-farm="handleUpdateFarm" />
        </div>
        <!--manage NFT types-->
        <div class="mb-10 border-black border p-5">
        <TheWhitelist
          :key="farmAcc.bank"
          :farm="farm"
          :bank="farmAcc.bank.toBase58()"
        />
        </div>
        <!--manage funders-->
        <div class="mb-10 border-black border p-5">
        <AuthorizeFunder :key="farm" :farm="farm" />
        </div>
        <!--manage funding-->
        <div class="mb-10 border-black border p-5">
        <FundCancelLock
          :farm="farm"
          :farmAcc="farmAcc"
          @update-farm="handleUpdateFarm"
        />
        </div>
        <!--refresh farmer-->
        <!-- <div class="mb-10 border-black border p-5">
        <RefreshFarmer :farm="farm" class="mb-10" />
        </div> -->
        <!--treasury payout-->
        <div class="mb-10 border-black border p-5">
        <TreasuryPayout :key="farmAcc" :farm="farm" />
        </div>
      </div>
      <div v-else-if="isLoading" class="text-center">Loading...</div>
      <div v-else class="text-center">No farms found :( Start a new one?</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import ConfigPane from '@/components/ConfigPane.vue';
import { useWallet } from 'solana-wallets-vue'
import useCluster from '@/composables/cluster';
import TestMint from '@/components/gem-farm/TestMint.vue';
import { initGemFarm } from '@/common/gem-farm';
import InitFarm from '@/components/gem-farm/InitFarm.vue';
import { PublicKey } from '@solana/web3.js';
import { stringifyPKsAndBNs } from '@gemworks/gem-farm-ts';
import { PAGE_TITLE, ACTIVE_FARM_ID } from '@/common/config';
import AuthorizeFunder from '@/components/gem-farm/AuthorizeFunder.vue';
import FundCancelLock from '@/components/gem-farm/FundCancelLock.vue';
import RefreshFarmer from '@/components/gem-farm/RefreshFarmer.vue';
import TreasuryPayout from '@/components/gem-farm/TreasuryPayout.vue';
import TheWhitelist from '@/components/gem-farm/BankWhitelist.vue';
import UpdateFarm from '@/components/gem-farm/UpdateFarm.vue';
import FarmDisplay from '@/components/gem-farm/FarmDisplay.vue';

export default defineComponent({
  components: {
    FarmDisplay,
    UpdateFarm,
    TheWhitelist,
    TreasuryPayout,
    RefreshFarmer,
    FundCancelLock,
    AuthorizeFunder,
    InitFarm,
    TestMint,
    ConfigPane
  },
  setup() {
    const { wallet } = useWallet();
    const { cluster, getConnection } = useCluster();

    let gf: any;
    watch([wallet, cluster], async () => {
      gf = await initGemFarm(getConnection(), wallet.value as any);
      await findFarmsByManager(wallet.value!.publicKey!);
    });

    //needed in case we switch in from another window
    onMounted(async () => {
      if (wallet && getConnection()) {
        gf = await initGemFarm(getConnection(), wallet.value as any);
        await findFarmsByManager(wallet.value!.publicKey!);
      }
    });

    // --------------------------------------- farm locator
    const foundFarms = ref<any[]>([]);
    const farm = ref<string>();
    const farmAcc = ref<any>();
    const currentFarmIndex = ref<number>(0);
    const isLoading = ref<boolean>(true);

    //whenever we change the farm, we update the index/account
    watch(farm, (newFarm: any) => {
      updateFarmByPk(newFarm);
    });

    const updateFarmByPk = (newFarm: string) => {
      const idx = foundFarms.value.findIndex(
        (ff) => ff.publicKey.toBase58() === newFarm
      );
      currentFarmIndex.value = idx;
      farmAcc.value = foundFarms.value[idx].account;
    };

    const findFarmsByManager = async (manager: PublicKey) => {
      foundFarms.value = await gf.fetchAllFarmPDAs(manager);
      console.log('Found farms:', stringifyPKsAndBNs(foundFarms.value));

      if (foundFarms.value.length) {
        farm.value =
          foundFarms.value[currentFarmIndex.value].publicKey.toBase58();
        //yes this is needed here, as sometimes farm.value stays same, but we want to rerender anyway
        updateFarmByPk(farm.value!);
      }
      isLoading.value = false;
    };

    // --------------------------------------- rest
    const showNewFarm = ref<boolean>(false);

    const handleNewFarm = async (newFarm: string) => {
      showNewFarm.value = false;
      await findFarmsByManager(wallet.value!.publicKey!);
      farm.value = newFarm;
    };

    const handleUpdateFarm = async () => {
      await findFarmsByManager(wallet.value!.publicKey!);
    };

    const refreshFarms = async () => {
      await findFarmsByManager(wallet.value!.publicKey!);
    };

    return {
      isLoading,
      wallet,
      foundFarms,
      farm,
      farmAcc,
      handleNewFarm,
      handleUpdateFarm,
      showNewFarm,
      refreshFarms,
      PAGE_TITLE,
      ACTIVE_FARM_ID
    };
  },
});
</script>

<style scoped></style>
