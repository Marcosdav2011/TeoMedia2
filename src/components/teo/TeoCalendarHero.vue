<template>
  <section v-if="dateObject" class="teo-hero teo-calendar-hero">
    <div class="teo-hero__body">
      <div class="teo-eyebrow">
        <q-icon name="mmm-calendar-month" size="16px" />
        {{ meetingLabel }}
      </div>
      <h1 class="teo-hero__title">{{ longDate }}</h1>
      <div class="teo-hero__chips">
        <span v-if="congregationName" class="teo-chip">
          <q-icon name="mmm-groups" size="15px" />
          {{ congregationName }}
        </span>
        <span class="teo-chip">
          <q-icon name="mmm-local-media" size="15px" />
          {{ t('teo-calendar-items', { count: itemCount }) }}
        </span>
        <span class="teo-chip">
          <q-icon name="mmm-media" size="15px" />
          {{ t('teo-calendar-sections', { count: sectionCount }) }}
        </span>
        <span v-if="isToday" class="teo-chip teo-chip--live">
          <span class="teo-chip__dot" />
          {{ t('teo-calendar-today') }}
        </span>
      </div>
    </div>

    <div class="teo-calendar-hero__aside">
      <div class="teo-calendar-hero__side">
        <q-btn
          v-if="isTesting"
          class="teo-hero__test"
          flat
          no-caps
          @click="stopTest"
        >
          <q-icon class="q-mr-sm" name="mmm-stop" size="18px" />
          {{ t('teo-test-stop') }}
        </q-btn>
        <q-btn
          v-else-if="!mediaIsPlaying"
          class="teo-hero__test"
          :disable="!hasOutputScreen"
          flat
          no-caps
          @click="startTest"
        >
          <q-icon class="q-mr-sm" name="mmm-play" size="18px" />
          {{ t('teo-test-output') }}
          <q-tooltip :delay="500">{{ t('teo-test-hint') }}</q-tooltip>
        </q-btn>
      </div>

      <div class="teo-date-card">
        <span class="teo-date-card__day">{{ dayNumber }}</span>
        <span class="teo-date-card__month">{{ monthShort }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useTeoPlaybackTest } from 'src/composables/useTeoPlaybackTest';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

const currentState = useCurrentStateStore();
const congregationSettings = useCongregationSettingsStore();
const { mediaIsPlaying } = storeToRefs(currentState);

const { hasOutputScreen, isTesting, startTest, stopTest } =
  useTeoPlaybackTest();

const congregationName = computed(() => {
  const id = currentState.currentCongregation;
  return id
    ? (congregationSettings.congregations[id]?.congregationName ?? '')
    : '';
});

const dateObject = computed(() => {
  const rawDate = currentState.selectedDateObject?.date;
  if (!rawDate) return null;
  return rawDate instanceof Date ? rawDate : new Date(rawDate);
});

const sectionCount = computed(
  () => currentState.selectedDateObject?.mediaSections?.length ?? 0,
);

const itemCount = computed(() => currentState.countItemsForSelectedDate);

const isToday = computed(() => currentState.isSelectedDayToday);

const meetingLabel = computed(() => {
  if (currentState.selectedDayMeetingType === 'mw') return t('midweek-meeting');
  if (currentState.selectedDayMeetingType === 'we') return t('weekend-meeting');
  return t('titles.meetingMedia');
});

const longDate = computed(() => {
  if (!dateObject.value) return '';
  const formatted = new Intl.DateTimeFormat(locale.value, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(dateObject.value);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});

const dayNumber = computed(() =>
  dateObject.value ? String(dateObject.value.getDate()).padStart(2, '0') : '',
);

const monthShort = computed(() => {
  if (!dateObject.value) return '';
  return new Intl.DateTimeFormat(locale.value, { month: 'short' })
    .format(dateObject.value)
    .replace('.', '');
});
</script>

<style scoped>
.teo-calendar-hero__side {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 760px) {
  .teo-calendar-hero__side {
    align-items: flex-start;
  }
}
</style>
