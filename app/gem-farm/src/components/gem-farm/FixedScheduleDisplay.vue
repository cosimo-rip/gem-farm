<template>
  <div>
    <div v-if="isFrontend" class="text-left text-gray-600 mb-6" style="max-width: 640px">
      {{WELCOME_MSG}} Earn <strong>{{ (86400 / schedule.denominator) * schedule.baseRate }} ${{SPL_TOKEN_NAME}} per day</strong> for each item {{STAKED_NAME.toLowerCase()}} in this {{VAULT_NAME.toLowerCase()}}.<br />
      <span class="italic text-xs">Rules &amp; Disclaimers: ${{SPL_TOKEN_NAME}} has no monetary value. Stake at your own risk. Unstaking: It takes the {{UNSTAKE_CHARACTER.toLowerCase()}} {{ parseTime(farmAcc.config.cooldownPeriodSec) }} to {{UNSTAKE_NAME.toLowerCase()}} {{STAKED_NAME.toLowerCase()}} {{NFT_SHORT_NAME}}, and {{UNSTAKE_CHARACTER_PRONOUN.toLowerCase()}} charges a {{ farmAcc.config.unstakingFeeLamp / LAMPORTS_PER_SOL }} SOL fee.</span><br />
      <br />
      <div v-if="eventIsActive"><strong>Current Staking Event Ends:</strong> {{parseDate( parseInt(farmerReward.fixedRate.beginScheduleTs) > 0 ? parseInt(farmerReward.fixedRate.beginScheduleTs) + parseInt(farmerReward.fixedRate.promisedDuration) : farmAcc.rewardA.times.rewardEndTs)}}</div>
      <div v-else><strong>Current Staking Event Has Ended</strong></div>
    </div>
    <div v-else>
      <div class="mb-2">Base rate: {{ schedule.baseRate }} tokens/nft/s</div>
      <div class="mb-2" v-if="schedule.tier1">
        T1 reward rate:
        {{ schedule.tier1.rewardRate }} tokens/nft/s
      </div>
      <div class="mb-2" v-if="schedule.tier1">
        T1 required tenure:
        {{ schedule.tier1.requiredTenure }} sec
      </div>
      <div class="mb-2" v-if="schedule.tier2">
        T2 reward rate:
        {{ schedule.tier2.rewardRate }} tokens/nft/s
      </div>
      <div class="mb-2" v-if="schedule.tier2">
        T2 required tenure:
        {{ schedule.tier2.requiredTenure }} sec
      </div>
      <div class="mb-2" v-if="schedule.tier3">
        T3 reward rate:
        {{ schedule.tier3.rewardRate }} tokens/nft/s
      </div>
      <div class="mb-2" v-if="schedule.tier3">
        T3 required tenure:
        {{ schedule.tier3.requiredTenure }} sec
      </div>
      <div class="mb-2">
        Denominator:
        {{ schedule.denominator }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { parseDate } from '@/common/util';
import { WELCOME_MSG, VAULT_NAME, SPL_TOKEN_NAME, NFT_SHORT_NAME, STAKED_NAME, UNSTAKE_CHARACTER, UNSTAKE_CHARACTER_PRONOUN, UNSTAKE_NAME } from '@/common/config';

export default defineComponent({
  props: {
    farmReward: Object,
    farmerReward: Object,
    schedule: Object,
    farmAcc: Object,
    isFrontend: Boolean,
    eventIsActive: Boolean
  },
  setup() {

    const parseTime = (seconds: number) => {
      const MINS_IN_SECS = 60;
      const HOURS_IN_SECS = 60 * MINS_IN_SECS;
      const DAYS_IN_SECS = 24 * HOURS_IN_SECS;
      
      if (seconds < MINS_IN_SECS) {
        return seconds + ' seconds';
      }
      if (seconds < HOURS_IN_SECS) {
        return (seconds / MINS_IN_SECS) + ' minutes';
      }
      if (seconds < DAYS_IN_SECS) {
        return (seconds / HOURS_IN_SECS) + ' hours';
      }
      return (seconds / DAYS_IN_SECS) + ' days';
    };

    return {
      parseTime,
      parseDate,
      LAMPORTS_PER_SOL,
      WELCOME_MSG, 
      VAULT_NAME,
      STAKED_NAME,
      UNSTAKE_NAME,
      SPL_TOKEN_NAME,
      UNSTAKE_CHARACTER,
      NFT_SHORT_NAME,
      UNSTAKE_CHARACTER_PRONOUN
    };
  },
});

</script>

<style scoped></style>
