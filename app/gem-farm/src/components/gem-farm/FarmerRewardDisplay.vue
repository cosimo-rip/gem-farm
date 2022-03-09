<template>
    <div>
      <FixedScheduleDisplay
        :key="farmReward"
        :schedule="farmReward.fixedRate.schedule"
        :farmAcc="farmAcc"
        :isFrontend="true"
        :eventIsActive="eventIsActive"
      />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FixedScheduleDisplay from '@/components/gem-farm/FixedScheduleDisplay.vue';

export default defineComponent({
  components: { FixedScheduleDisplay },
  props: {
    reward: Object,
    farmReward: Object,
    title: String,
    farmAcc: Object,
    eventIsActive: Boolean
  }
});
</script>

<style scoped></style>
