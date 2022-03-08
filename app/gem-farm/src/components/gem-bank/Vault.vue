<template>
  <div>
    <!--control buttons-->
    <div class="mb-5 flex justify-center">
      <button
        v-if="farmerState === 'unstaked' && farmAcc.rewardA.times.rewardEndTs > (this.currentTS / 1000) && currentVaultNFTs.length > 0"
        class="is-success mr-5 primary"
        @click="beginStaking"
      >
        {{STAKE_NAME}} {{NFT_SHORT_NAME}}
      </button>
      <button
        v-if="farmerState === 'staked'"
        class="is-error mr-5 primary"
        @click="endStaking"
      >
        {{UNSTAKE_NAME}} {{NFT_SHORT_NAME}}
      </button>
      <button
        v-if="farmerState === 'pendingCooldown' && farmerAcc.cooldownEndsTs < this.currentTS / 1000"
        class="is-error mr-5 primary"
        @click="endStaking"
      >
        Retrieve {{NFT_SHORT_NAME}}
      </button>
      <button class="primary claim" @click="claimRewards" :disabled="farmerAcc.rewardA.accruedReward - farmerAcc.rewardA.paidOutReward + (parseInt(farmerAcc.gemsStaked) * (Math.round(currentTS/1000) - farmerAcc.rewardA.fixedRate.lastUpdatedTs) * farmAcc.rewardA.fixedRate.schedule.baseRate / farmAcc.rewardA.fixedRate.schedule.denominator) < 1">
        Claim {{Math.floor(farmerAcc.rewardA.accruedReward - farmerAcc.rewardA.paidOutReward + (parseInt(farmerAcc.gemsStaked) * (Math.round(this.currentTS/1000) - farmerAcc.rewardA.fixedRate.lastUpdatedTs) * farmAcc.rewardA.fixedRate.schedule.baseRate / farmAcc.rewardA.fixedRate.schedule.denominator) > 0 ? Math.floor(farmerAcc.rewardA.accruedReward - farmerAcc.rewardA.paidOutReward + (parseInt(farmerAcc.gemsStaked) * (Math.round(this.currentTS/1000) - farmerAcc.rewardA.fixedRate.lastUpdatedTs) * farmAcc.rewardA.fixedRate.schedule.baseRate / farmAcc.rewardA.fixedRate.schedule.denominator)) : "")}} ${{SPL_TOKEN_NAME}}
      </button>
    </div>

    <!--Vault-->
    <NFTGrid
      v-if="bank && vault"
      :title="VAULT_NAME"
      :loading="vaultLoading"
      :emptyMessage="'Your ' + VAULT_NAME.toLowerCase() + ' is empty'"
      class="mb-4 relative"
      :nfts="currentVaultNFTs"
      :disabled="vaultLocked"
      @selected="handleVaultNFTSelected"
    >
      <div
        v-if="vaultLocked"
        class="locked flex-col justify-center items-center align-center"
      >
        <p class="mt-5 text-indigo-200" style="text-shadow: 1px 1px 1px black">

          <span v-if="farmerState == 'staked'">
            <span v-if="eventIsActive">{{VAULT_ICON}} This {{VAULT_NAME.toLowerCase()}} is earning ${{SPL_TOKEN_NAME}}!</span>
            <span v-else>{{VAULT_ICON}} The event has ended. You may {{UNSTAKE_NAME.toLowerCase()}} your {{NFT_SHORT_NAME}} or wait for the next event to begin.</span>
          </span>
          <span v-else-if="farmerState == 'pendingCooldown'">
            <span v-if="(this.currentTS / 1000) < cooldownEndsTs">{{COOLING_DOWN_NAME}} until {{parseDate(cooldownEndsTs)}}</span>
            <span v-else>{{COOLING_DOWN_NAME}} complete. You may retrieve your {{NFT_SHORT_NAME}}.</span>
          </span>
        </p>
      </div>
    </NFTGrid>

    <!--mid-->
    <div class="mb-5 flex justify-center">
      <button :disabled="vaultLocked || currentWalletNFTs.length == 0" class="my-2 mr-2 inline-block primary" @click="moveNFTsToVault(true)">
        <span class="inline-block">Move All</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      </button>
      <button :disabled="vaultLocked || selectedWalletNFTs.length == 0" class="my-2 mr-2 inline-block primary" @click="moveNFTsToVault(false)">
        <span class="inline-block">Move Selected</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      </button>
      <button :disabled="vaultLocked || selectedVaultNFTs.length == 0" class="my-2 mr-2 inline-block primary" :left="true" @click="moveNFTsBackToWallet(false)">
        <span class="inline-block">Return Selected</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      </button> 
      <button :disabled="vaultLocked || currentVaultNFTs.length == 0" class="my-2 inline-block primary" :left="true" @click="moveNFTsBackToWallet(true)">
        <span class="inline-block">Return All</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      </button> 
    </div>

    <!--Wallet-->
    <NFTGrid
      v-if="bank && vault"
      title="Wallet"
      :loading="walletLoading"
      :emptyMessage="'Your wallet contains no ' + NFT_SHORT_NAME"
      class="relative"
      :nfts="currentWalletNFTs"
      :disabled="vaultLocked"
      @selected="handleWalletNFTSelected"
    >
      <div
        v-if="vaultLocked && farmerState == 'staked'"
        class="locked flex-col justify-center items-center align-center"
      >
        <p class="mt-5 text-indigo-200" style="text-shadow: 1px 1px 1px black">
          <span>You must {{UNSTAKE_NAME.toLowerCase()}} your {{NFT_SHORT_NAME}} before you can {{STAKE_NAME.toLowerCase()}} more.</span>
        </p>
      </div>
    </NFTGrid>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import NFTGrid from '@/components/gem-bank/NFTGrid.vue';
import { useWallet } from 'solana-wallets-vue'
import useCluster from '@/composables/cluster';
import {
  getNFTMetadataForMany,
  getNFTsByOwner,
  INFT,
} from '@/common/web3/NFTget';
import { initGemBank } from '@/common/gem-bank';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { parseDate } from '@/common/util';
import { useToast } from 'vue-toastification';
import { useLoading } from 'vue-loading-overlay';
import { VAULT_NAME, VAULT_ICON, WALLET_NFT_CREATOR_FILTER, NFT_SHORT_NAME, NFT_SHORT_NAME_SINGULAR, COOLING_DOWN_NAME, SPL_TOKEN_NAME, STAKE_NAME, UNSTAKE_NAME } from '@/common/config'

export default defineComponent({
  components: { NFTGrid },

  created() {
    setInterval(() => {
      this.currentTS = Date.now()
    }, 1000)
  },

  props: {
    vault: String,
    farmerState: String,
    farmAcc: Object,
    farmerAcc: Object,
    cooldownEndsTs: Object,
    eventIsActive: Boolean
  },
  emits: ['selected-wallet-nft', 'begin-staking', 'end-staking', 'claim-rewards'],
  setup(props, ctx) {
    const { wallet } = useWallet();
    const { cluster, getConnection } = useCluster();
    const toast = useToast();
    const loader = useLoading({ color: '#4f46e5', loader: 'bars'});

    // --------------------------------------- state

    //current walet/vault state
    const currentWalletNFTs = ref<INFT[]>([]);
    const currentVaultNFTs = ref<INFT[]>([]);
    
    //selected but not yet moved over in FE
    const selectedWalletNFTs = ref<INFT[]>([]);
    const selectedVaultNFTs = ref<INFT[]>([]);

    // --------------------------------------- populate initial nfts

    const populateWalletNFTs = async () => {
      walletLoading.value = true;

      // zero out to begin with
      currentWalletNFTs.value = [];
      selectedWalletNFTs.value = [];

      if (wallet) {
        const allWalletNFTs = await getNFTsByOwner(
          wallet.value!.publicKey!,
          getConnection()
        )
        const filteredNFTs = allWalletNFTs
          .filter((nft: INFT) => 
            (nft.onchainMetadata as any).data
            && (nft.onchainMetadata as any).data.creators
            && (nft.onchainMetadata as any).data.creators.length > 0 
            && (nft.onchainMetadata as any).data.creators[0].address == WALLET_NFT_CREATOR_FILTER.toString()
          )
          .sort((nftA: INFT, nftB: INFT) => { 
            const nameA = (nftA.externalMetadata as any).name;
            const nameB = (nftB.externalMetadata as any).name;
            return nameA.localeCompare(nameB)
          })
        console.log("filtered wallet nfts: ", filteredNFTs);
        currentWalletNFTs.value = filteredNFTs
      }
      walletLoading.value = false;
    };

    const populateVaultNFTs = async () => {
      vaultLoading.value = true;

      // zero out to begin with
      currentVaultNFTs.value = [];
      selectedVaultNFTs.value = [];

      const foundGDRs = await gb.fetchAllGdrPDAs(vault.value);
      if (foundGDRs && foundGDRs.length) {
        gdrs.value = foundGDRs;
        console.log(`found a total of ${foundGDRs.length} gdrs`);

        const mints = foundGDRs.map((gdr: any) => {
          return { mint: gdr.account.gemMint };
        });
        const vaultNFTs = await getNFTMetadataForMany(
          mints,
          getConnection()
        );
        const sortedVaultNFTs = vaultNFTs.sort((nftA: INFT, nftB: INFT) => { 
          const nameA = (nftA.externalMetadata as any).name;
          const nameB = (nftB.externalMetadata as any).name;
          return nameA.localeCompare(nameB)
        });
        currentVaultNFTs.value = sortedVaultNFTs
        console.log("sorted vault NFTs", sortedVaultNFTs);
      }
      vaultLoading.value = false;
    };

    const updateVaultState = async () => {
      vaultAcc.value = await gb.fetchVaultAcc(vault.value);
      bank.value = vaultAcc.value.bank;
      vaultLocked.value = vaultAcc.value.locked;
    };

    watch([wallet, cluster], async () => {
      gb = await initGemBank(getConnection(), wallet.value as any);

      //populate wallet + vault nfts
      await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
    });

    onMounted(async () => {
      gb = await initGemBank(getConnection(), wallet.value as any);

      //prep vault + bank variables
      vault.value = new PublicKey(props.vault!);
      await updateVaultState();

      //populate wallet + vault nfts
      await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
    });

    // --------------------------------------- moving nfts

    const handleWalletNFTSelected = (e: any) => {
      if (e.selected) {
        selectedWalletNFTs.value.push(e.nft);
      } else {
        const index = selectedWalletNFTs.value.indexOf(e.nft);
        selectedWalletNFTs.value.splice(index, 1);
      }
      ctx.emit('selected-wallet-nft', selectedWalletNFTs.value);
    };
    
    const beginStaking = (e: any) => {
      ctx.emit('begin-staking');
    }
    
    const endStaking = (e: any) => {
      ctx.emit('end-staking');
    }

    const claimRewards = (e: any) => {
      ctx.emit('claim-rewards');
    }

    const handleVaultNFTSelected = (e: any) => {
      if (e.selected) {
        selectedVaultNFTs.value.push(e.nft);
      } else {
        const index = selectedVaultNFTs.value.indexOf(e.nft);
        selectedVaultNFTs.value.splice(index, 1);
      }
    };

    const moveNFTsToVault = (all: boolean) => {
      if (all) {
        //push all wallet nfts into vault
        moveNFTsOnChain(currentWalletNFTs.value, []);
      } else {
        //push selected wallet nfts into vault
        moveNFTsOnChain(selectedWalletNFTs.value, []);
      }
      //empty selected wallet
      selectedWalletNFTs.value = [];
    };

    const moveNFTsBackToWallet = (all: boolean) => {
      if (all) {
        //push selected vault nfts into wallet
        moveNFTsOnChain([], currentVaultNFTs.value);
      } else {
        //push selected vault nfts into wallet
        moveNFTsOnChain([], selectedVaultNFTs.value);
      }
      //empty selection list
      selectedVaultNFTs.value = [];
    };

    //todo jam into single tx
    const moveNFTsOnChain = async (toVaultNFTs: INFT[], toWalletNFTs: INFT[]) => {
      const ld = loader.show();
      let allSucceeded = true;
      for (const nft of toVaultNFTs) {
        console.log(nft);
        const creator = new PublicKey(
          //todo currently simply taking the 1st creator
          (nft.onchainMetadata as any).data.creators[0].address
        );
        console.log('creator is', creator.toBase58());
        try {
          await depositGem(nft.mint, creator, nft.pubkey!);
        } catch (error) {
          allSucceeded = false;
          toast.error(`Failed to move ${NFT_SHORT_NAME_SINGULAR} to ${VAULT_NAME}: ${error.message}`);
        }
      }
      if (toVaultNFTs.length > 0 && allSucceeded) {
        toast.success(`${NFT_SHORT_NAME_SINGULAR} moved to ${VAULT_NAME}`);
      }
      allSucceeded = true
      for (const nft of toWalletNFTs) {
        try {
          await withdrawGem(nft.mint);
        } catch (error) {
          allSucceeded = false;
          toast.error(`Failed to move ${NFT_SHORT_NAME_SINGULAR} to wallet: ${error.message}`);
        }
      }
      if (toWalletNFTs.length > 0 && allSucceeded) {
        toast.success(`${NFT_SHORT_NAME_SINGULAR} returned to wallet`);
      }
      ld.hide()
      
      setTimeout(async function() {
        await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
      }, 2000)
    };

    // --------------------------------------- gem bank

    let gb: any;
    const bank = ref<PublicKey>();
    const vault = ref<PublicKey>();
    const vaultAcc = ref<any>();
    const gdrs = ref<PublicKey[]>([]);
    const vaultLocked = ref(false);
    const vaultLoading = ref(true);
    const walletLoading = ref(true);

    const depositGem = async (
      mint: PublicKey,
      creator: PublicKey,
      source: PublicKey
    ) => {
      const { txSig } = await gb.depositGemWallet(
        bank.value,
        vault.value,
        new BN(1),
        mint,
        source,
        creator
      );
      console.log('deposit done', txSig);
    };

    const withdrawGem = async (mint: PublicKey) => {
      const { txSig } = await gb.withdrawGemWallet(
        bank.value,
        vault.value,
        new BN(1),
        mint
      );
      console.log('withdrawal done', txSig);
    };

    // --------------------------------------- return

    return {
      currentTS: Date.now(),
      wallet,
      handleWalletNFTSelected,
      handleVaultNFTSelected,
      moveNFTsToVault,
      moveNFTsBackToWallet,
      beginStaking,
      endStaking,
      claimRewards,
      bank,
      // eslint-disable-next-line vue/no-dupe-keys
      vault,
      vaultLocked,
      vaultLoading,
      walletLoading,
      currentWalletNFTs,
      currentVaultNFTs,
      selectedWalletNFTs,
      selectedVaultNFTs,
      parseDate,
      VAULT_NAME,
      VAULT_ICON,
      NFT_SHORT_NAME,
      COOLING_DOWN_NAME,
      SPL_TOKEN_NAME,
      STAKE_NAME,
      UNSTAKE_NAME
    };
  },
});
</script>

<style scoped>
.locked {
  @apply text-center bg-black text-white;
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0.65;
  z-index: 10;
  padding: 10px 15px;
  border-radius: 30px;
}
.locked p {
  margin-top: 0;
}
</style>
