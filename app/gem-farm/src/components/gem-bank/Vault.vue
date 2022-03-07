<template>
  <div>
    <!--control buttons-->
    <div class="mb-5 flex justify-center">
      <button
        v-if="
          (toWalletNFTs && toWalletNFTs.length) ||
          (toVaultNFTs && toVaultNFTs.length)
          "
        class="is-primary mr-5 primary"
        @click="moveNFTsOnChain"
      >
        Save Changes
      </button>
      <slot />
    </div>

    <!--Vault-->
    <NFTGrid
      v-if="bank && vault"
      :title="VAULT_NAME"
      :emptyMessage="'Your ' + VAULT_NAME.toLowerCase() + ' is empty'"
      class="mb-4 relative"
      :nfts="desiredVaultNFTs"
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
      <button :disabled="vaultLocked" class="my-2 mr-2 inline-block primary" @click="moveNFTsToVault(true)">
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
      <button :disabled="vaultLocked" class="my-2 inline-block primary" :left="true" @click="moveNFTsBackToWallet(true)">
        <span class="inline-block">Return All</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      </button> 
    </div>

    <!--Wallet-->
    <NFTGrid
      title="Wallet"
      :emptyMessage="'Your wallet contains no ' + NFT_SHORT_NAME"
      class="flex-1"
      :nfts="desiredWalletNFTs"
      :disabled="false"
      @selected="handleWalletNFTSelected"
    />
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
import { getListDiffBasedOnMints, removeManyFromList } from '@/common/util';
import { BN } from '@project-serum/anchor';
import { parseDate } from '@/common/util';
import { VAULT_NAME, VAULT_ICON, WALLET_NFT_CREATOR_FILTER, NFT_SHORT_NAME, COOLING_DOWN_NAME, SPL_TOKEN_NAME, UNSTAKE_NAME } from '@/common/config'

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
    cooldownEndsTs: Object,
    eventIsActive: Boolean
  },
  emits: ['selected-wallet-nft'],
  setup(props, ctx) {
    const { wallet } = useWallet();
    const { cluster, getConnection } = useCluster();

    // --------------------------------------- state

    //current walet/vault state
    const currentWalletNFTs = ref<INFT[]>([]);
    const currentVaultNFTs = ref<INFT[]>([]);
    //selected but not yet moved over in FE
    const selectedWalletNFTs = ref<INFT[]>([]);
    const selectedVaultNFTs = ref<INFT[]>([]);
    //moved over in FE but not yet onchain
    const desiredWalletNFTs = ref<INFT[]>([]);
    const desiredVaultNFTs = ref<INFT[]>([]);
    //moved over onchain
    const toWalletNFTs = ref<INFT[]>([]);
    const toVaultNFTs = ref<INFT[]>([]);

    // --------------------------------------- populate initial nfts

    const populateWalletNFTs = async () => {
      // zero out to begin with
      currentWalletNFTs.value = [];
      selectedWalletNFTs.value = [];
      desiredWalletNFTs.value = [];

      if (wallet) {
        const allWalletNFTs = await getNFTsByOwner(
          wallet.value!.publicKey!,
          getConnection()
        )
        console.log("wallet nfts: ", allWalletNFTs);
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
        console.log("filtered nfts: ", filteredNFTs);
        currentWalletNFTs.value = filteredNFTs
        desiredWalletNFTs.value = [...currentWalletNFTs.value];
      }
    };

    const populateVaultNFTs = async () => {
      // zero out to begin with
      currentVaultNFTs.value = [];
      selectedVaultNFTs.value = [];
      desiredVaultNFTs.value = [];

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
        console.log("vault nfts:", vaultNFTs);
        const sortedVaultNFTs = vaultNFTs.sort((nftA: INFT, nftB: INFT) => { 
          const nameA = (nftA.externalMetadata as any).name;
          const nameB = (nftB.externalMetadata as any).name;
          return nameA.localeCompare(nameB)
        });
        console.log("vault nfts:", sortedVaultNFTs);
        currentVaultNFTs.value = sortedVaultNFTs
        desiredVaultNFTs.value = [...currentVaultNFTs.value];
        console.log(
          `populated a total of ${currentVaultNFTs.value.length} vault NFTs`
        );
      }
    };

    const updateVaultState = async () => {
      vaultAcc.value = await gb.fetchVaultAcc(vault.value);
      bank.value = vaultAcc.value.bank;
      console.log(vaultAcc.value);
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
        //push all wallet nfts into desired vault
        desiredVaultNFTs.value.push(...currentWalletNFTs.value);
        desiredVaultNFTs.value.push(...desiredWalletNFTs.value);
        //remove current wallet nfts from desired wallet
        removeManyFromList(currentWalletNFTs.value, desiredWalletNFTs.value);
        removeManyFromList(desiredVaultNFTs.value, desiredWalletNFTs.value);
      } else {
        //push selected wallet nfts into desired vault
        desiredVaultNFTs.value.push(...selectedWalletNFTs.value);
        //remove selected wallet nfts from desired wallet
        removeManyFromList(selectedWalletNFTs.value, desiredWalletNFTs.value);
      }
      //empty selected wallet
      selectedWalletNFTs.value = [];
    };

    const moveNFTsBackToWallet = (all: boolean) => {
      if (all) {
        //push selected vault nfts into desired wallet
        desiredWalletNFTs.value.push(...currentVaultNFTs.value);
        desiredWalletNFTs.value.push(...desiredVaultNFTs.value);
        //remove selected vault nfts from desired vault
        removeManyFromList(currentVaultNFTs.value, desiredVaultNFTs.value);
        removeManyFromList(desiredWalletNFTs.value, desiredVaultNFTs.value);
      } else {
        //push selected vault nfts into desired wallet
        desiredWalletNFTs.value.push(...selectedVaultNFTs.value);
        //remove selected vault nfts from desired vault
        removeManyFromList(selectedVaultNFTs.value, desiredVaultNFTs.value);
      }
      //empty selection list
      selectedVaultNFTs.value = [];
    };

    //todo jam into single tx
    const moveNFTsOnChain = async () => {
      for (const nft of toVaultNFTs.value) {
        console.log(nft);
        const creator = new PublicKey(
          //todo currently simply taking the 1st creator
          (nft.onchainMetadata as any).data.creators[0].address
        );
        console.log('creator is', creator.toBase58());
        await depositGem(nft.mint, creator, nft.pubkey!);
      }
      for (const nft of toWalletNFTs.value) {
        await withdrawGem(nft.mint);
      }
      await Promise.all([populateWalletNFTs(), populateVaultNFTs()]);
    };

    //to vault = vault desired - vault current
    watch(
      desiredVaultNFTs,
      () => {
        toVaultNFTs.value = getListDiffBasedOnMints(
          desiredVaultNFTs.value,
          currentVaultNFTs.value
        );
        console.log('to vault nfts are', toVaultNFTs.value);
      },
      { deep: true }
    );

    //to wallet = wallet desired - wallet current
    watch(
      desiredWalletNFTs,
      () => {
        toWalletNFTs.value = getListDiffBasedOnMints(
          desiredWalletNFTs.value,
          currentWalletNFTs.value
        );
        console.log('to wallet nfts are', toWalletNFTs.value);
      },
      { deep: true }
    );

    // --------------------------------------- gem bank

    let gb: any;
    const bank = ref<PublicKey>();
    const vault = ref<PublicKey>();
    const vaultAcc = ref<any>();
    const gdrs = ref<PublicKey[]>([]);
    const vaultLocked = ref<boolean>(false);

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
      desiredWalletNFTs,
      desiredVaultNFTs,
      toVaultNFTs,
      toWalletNFTs,
      handleWalletNFTSelected,
      handleVaultNFTSelected,
      moveNFTsToVault,
      moveNFTsBackToWallet,
      moveNFTsOnChain,
      bank,
      // eslint-disable-next-line vue/no-dupe-keys
      vault,
      vaultLocked,
      selectedWalletNFTs,
      selectedVaultNFTs,
      parseDate,
      VAULT_NAME,
      VAULT_ICON,
      NFT_SHORT_NAME,
      COOLING_DOWN_NAME,
      SPL_TOKEN_NAME,
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
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.65;
  z-index: 10;
  padding: 10px 15px;
  border-radius: 30px;
}
.locked p {
  margin-top: 0;
}
</style>
