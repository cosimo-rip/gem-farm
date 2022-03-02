<template>
  <div class="bg-white">
    <h2 class="pt-5 text-left ml-4" style="margin-bottom:2px">{{ title }}</h2>
    <slot />
    <div class="py-5 px-4 overflow-x-auto overflow-y-hidden whitespace-nowrap" style="-webkit-scrollbar: display: none;">
      <div v-if="nfts.length > 0">
        <NFTCard
          class="inline-block"
          v-for="nft in nfts"
          :key="nft"
          :nft="nft"
          @selected="handleSelected"
        />
      </div>
      <div v-else>
        <p class="pt-14 pb-20 text-sm text-gray-500 text-center">{{ emptyMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import NFTCard from '@/components/gem-bank/NFTCard.vue';

export default defineComponent({
  components: { NFTCard },
  emits: ['selected'],
  props: {
    title: String,
    emptyMessage: String,
    nfts: Array,
  },
  setup(props, ctx) {
    const handleSelected = (e: any) => {
      ctx.emit('selected', e);
    };
    return {
      handleSelected,
    };
  },
});
</script>

<style scoped></style>
