<template>
<div class="bg-white px-2 py-2 m-1 rounded-xl card cursor-pointer"
    :class="{ 'card-selected': selected }"
    @click="toggleSelect">
  <div
    class="flex justify-center h-4/5"
  >
    <img
    class="mt-2"
      :src="nft.externalMetadata.image"
      :alt="(nft.onchainMetadata as any).data.name"
    />
  </div>
    <div class="text-xs text-center h-1/5 truncate mt-2">
    {{nft.externalMetadata.name}}
    </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
export default defineComponent({
  props: {
    nft: { type: Object, required: true },
  },
  emits: ['selected'],
  setup(props, ctx) {
    const selected = ref<boolean>(false);

    const toggleSelect = () => {
      selected.value = !selected.value;
      console.log('selected', props.nft.mint.toBase58());
      ctx.emit('selected', {
        nft: props.nft,
        selected: selected.value,
      });
    };

    return {
      selected,
      toggleSelect,
    };
  },
});
</script>

<style scoped>
img {
  max-width: 100%;
  max-height: 100%;
  height: auto;
  width: auto;
}

.card {
  @apply border-2 border-solid border-transparent;
  width: 180px;
  height: 180px;
}

.card:hover {
  @apply border-2 border-solid border-gray-200;
}

.card-selected {
  @apply border-2 border-solid;
  border-color: black !important;
}
</style>
