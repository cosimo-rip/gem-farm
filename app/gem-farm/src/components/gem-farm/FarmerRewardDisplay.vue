<template>
    <table v-if="parseRewardType(farmReward) === 'variable'">
      <tr>
        <td class="w-1/2 pr-4">Reward Pool</td>
        <td>
        {{
          numeral(
            reward.variableRate.lastRecordedAccruedRewardPerRarityPoint.n / 10 ** 15
          ).format('0,0')
        }} ${{SPL_TOKEN_NAME}}
        </td>
      </tr>
    </table>
    <div v-else>
      <!-- <div class="mb-2 w-full bg-black text-white">Fixed reward:</div>
      <div class="mb-2">
        Staking begins: {{ parseDate(reward.fixedRate.beginStakingTs) }}
      </div>
      <div class="mb-2">
        Schedule begins: {{ parseDate(reward.fixedRate.beginScheduleTs) }}
      </div>
      <div class="mb-2">
        Last updated: {{ parseDate(reward.fixedRate.lastUpdatedTs) }}
      </div>
      <div class="mb-2">
        Promised duration: {{ reward.fixedRate.promisedDuration }}
      </div>
      <div class="mb-2">Promised schedule:</div> -->
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
import { parseDate } from '@/common/util';
import { SPL_TOKEN_NAME } from '@/common/config'
import numeral from 'numeral';

export default defineComponent({
  components: { FixedScheduleDisplay },
  props: {
    reward: Object,
    farmReward: Object,
    title: String,
    farmAcc: Object,
    eventIsActive: Boolean
  },
  setup() {
    const parseRewardType = (reward: any): string => {
      console.log("reward: ", reward);
      //returns "variable" or "fixed"
      return Object.keys(reward.rewardType)[0];
    };

    return {
      parseRewardType,
      parseDate,
      numeral,
      SPL_TOKEN_NAME
    };
  },
});
</script>

<style scoped></style>
