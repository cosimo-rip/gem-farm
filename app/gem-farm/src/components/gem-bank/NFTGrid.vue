<template>
  <div class="bg-white">
    <h2 class="pt-5 text-left ml-4" style="margin-bottom:2px">{{ title }}</h2>
    <slot />
    <div class="py-5 px-4 overflow-x-auto overflow-y-hidden whitespace-nowrap" style="-webkit-scrollbar: display: none;">
      <div v-if="nfts.length > 0 && !loading">
        <NFTCard
          class="inline-block"
          v-for="nft in nfts"
          :key="nft"
          :nft="nft"
          :disabled="disabled"
          @selected="handleSelected"
        />
      </div>
      <div v-else>
        <p v-if="loading" class="pt-14 pb-20 text-sm text-gray-500 text-center">Loading...</p>
        <p v-else class="pt-14 pb-20 text-sm text-gray-500 text-center">{{ emptyMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRef } from 'vue';
import NFTCard from '@/components/gem-bank/NFTCard.vue';

export default defineComponent({
  components: { NFTCard },
  emits: ['selected'],
  props: {
    title: String,
    loading: Boolean,
    emptyMessage: String,
    nfts: Array,
    disabled: Boolean
  },
  setup(props, ctx) {
    const handleSelected = (e: any) => {
      if (props.disabled) {
        return;
      }
      ctx.emit('selected', e);
    };
    return {
      loading: toRef(props, "loading"),
      disabled: toRef(props, "disabled"),
      handleSelected,
    };
  },
});
</script>

<style scoped></style>
