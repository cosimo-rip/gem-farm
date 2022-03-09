<template>
    <div>
      <FixedScheduleDisplay
        :key="farmerReward"
        :farmerReward="farmerReward"
        :schedule="farmerReward.fixedRate.promisedSchedule"
        :farmAcc="farmAcc"
        :isFrontend="true"
        :eventIsActive="eventIsActive"
      />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FixedScheduleDisplay from '@/components/gem-farm/FixedScheduleDisplay.vue';
import { SPL_TOKEN_NAME } from '@/common/config'
import numeral from 'numeral';

export default defineComponent({
  components: { FixedScheduleDisplay },
  props: {
    reward: Object,
    farmerReward: Object,
    title: String,
    farmAcc: Object,
    eventIsActive: Boolean
  },
  setup() {
    return {
      numeral,
      SPL_TOKEN_NAME
    };
  },
});
</script>

<style scoped></style>
