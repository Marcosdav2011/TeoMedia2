<template>
  <q-header class="teo-header">
    <DialogAbout
      v-model="aboutModal"
      :dialog-id="dialogId"
      @hide="aboutModal = false"
    />

    <div class="teo-header__top">
      <button
        aria-label="TM2"
        class="teo-brand-btn"
        type="button"
        @click="aboutModal = true"
      >
        <TeoBrand />
        <q-tooltip anchor="center right" :delay="800" self="center left">
          {{ t('about') }}
        </q-tooltip>
      </button>

      <q-btn
        v-if="updatesAreDisabled"
        class="teo-header__warning"
        color="warning"
        flat
        round
        size="sm"
        @click="openUpdateSettings"
      >
        <q-icon name="mmm-updates-disabled" />
        <q-tooltip :delay="500">{{ t('updates-disabled-warning') }}</q-tooltip>
      </q-btn>

      <div class="teo-header__spacer" />

      <div class="teo-header__status">
        <q-badge v-if="cameraOnlyMode" class="teo-mode-badge" outline>
          <q-icon class="q-mr-xs" name="mmm-video" size="xs" />
          <span class="no-wrap">{{ t('teo-camera-only') }}</span>
          <q-tooltip :delay="500">{{ t('cameraOnlyMode-explain') }}</q-tooltip>
        </q-badge>

        <q-badge
          v-if="showDemoBadge"
          class="teo-demo-badge"
          color="warning"
          outline
        >
          <q-icon class="q-mr-xs" name="mmm-warning" size="xs" />
          <span class="no-wrap">{{ t('demo-mode-active') }}</span>
          <span v-if="stageLabel" class="no-wrap">· {{ stageLabel }}</span>
          <span v-if="virtualClock" class="no-wrap">
            · {{ virtualClock }}
          </span>
          <q-tooltip :delay="500">
            {{ t('demo-mode-active-tooltip') }}
          </q-tooltip>
        </q-badge>

        <q-btn
          class="teo-profile"
          color="white-transparent"
          :disable="mediaIsPlaying"
          no-caps
          rounded
          unelevated
          @click="openProfileSwitcher"
        >
          <q-icon class="q-mr-sm" name="mmm-groups" size="xs" />
          <span class="teo-profile__name">
            {{ congregationName || t('titles.profileSelection') }}
          </span>
          <q-tooltip :delay="600">
            {{
              mediaIsPlaying
                ? t('stop-playing-media-first')
                : t('teo-profile-switch')
            }}
          </q-tooltip>
        </q-btn>

        <HeaderScreens />
      </div>
    </div>

    <div class="teo-header__nav">
      <nav class="teo-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.path"
          :aria-current="tab.active ? 'page' : undefined"
          class="teo-tab"
          :class="{
            'teo-tab--active': tab.active,
            'teo-tab--disabled': tab.disabled && !tab.active,
          }"
          type="button"
          @click="goTo(tab)"
        >
          <q-icon :name="tab.icon" size="18px" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <div class="teo-header__actions">
        <HeaderCalendar v-if="route.fullPath.includes('/media-calendar')" />
        <HeaderSettings v-else-if="route.fullPath.includes('/settings')" />
        <HeaderWebsite
          v-else-if="route.fullPath.includes('/present-website')"
        />
      </div>
    </div>
  </q-header>
</template>

<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import DialogAbout from 'components/dialog/DialogAbout.vue';
import TeoBrand from 'components/teo/TeoBrand.vue';
import { storeToRefs } from 'pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { updatesDisabled } from 'src/utils/fs';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { type DemoMeetingStage, useDemoModeStore } from 'stores/demo-mode';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import HeaderCalendar from './HeaderCalendar.vue';
import HeaderScreens from './HeaderScreens.vue';
import HeaderSettings from './HeaderSettings.vue';
import HeaderWebsite from './HeaderWebsite.vue';

interface TeoTab {
  active: boolean;
  disabled: boolean;
  icon: string;
  label: string;
  path: string;
}

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// Live demo-mode flag (M3_DEMO_MODE launch or runtime Demo-menu enable), so
// the beta logo swaps back in the moment demo mode is turned off.
const demoMode = useDemoModeStore();
const isDemoMode = computed(() => demoMode.enabled);
// Demo-mode badge: dev builds only, so packaged-build screenshots (launched
// with M3_DEMO_MODE) stay clean; tracks the live store so the badge appears
// and disappears the moment demo mode is toggled at runtime.
const showDemoBadge = computed(() => import.meta.env.DEV && isDemoMode.value);
// The badge doubles as a status chip: it shows the current simulated meeting
// stage and the virtual clock time (only meaningful while demo mode is on).
const stageLabels: Record<DemoMeetingStage, string> = {
  'after-song': t('demo-mode-stage-after-song'),
  'last-song': t('demo-mode-stage-last-song'),
  'pre-meeting': t('demo-mode-stage-pre-meeting'),
  reset: t('demo-mode-stage-reset'),
};
const stageLabel = computed(() =>
  isDemoMode.value ? stageLabels[demoMode.stage] : '',
);
const virtualClock = ref('');
const updateVirtualClock = () => {
  virtualClock.value = isDemoMode.value
    ? new Date(demoMode.now).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
};
const { pause, resume } = useIntervalFn(updateVirtualClock, 1000, {
  immediate: false,
});

const updatesAreDisabled = ref(false);

const congregationSettings = useCongregationSettingsStore();

const currentState = useCurrentStateStore();
const { currentCongregation, currentSettings, mediaIsPlaying } =
  storeToRefs(currentState);

const congregationName = computed(() => {
  const id = currentCongregation.value;
  return id
    ? (congregationSettings.congregations[id]?.congregationName ?? '')
    : '';
});

const requiresCongregation = computed(
  () => !currentSettings.value || currentState.invalidSettings(),
);

// Camera-only profiles deliberately hide the meeting media and website sides;
// only the live studio and settings stay reachable.
const cameraOnlyMode = computed(() => !!currentSettings.value?.cameraOnlyMode);

const tabs = computed<TeoTab[]>(() => {
  const allTabs: TeoTab[] = [
    {
      active: route.path.startsWith('/media-calendar'),
      disabled: requiresCongregation.value,
      icon: 'mmm-media',
      label: t('teo-nav-meeting'),
      path: '/media-calendar',
    },
    {
      active: route.path.startsWith('/cameras'),
      disabled: requiresCongregation.value,
      icon: 'mmm-video',
      label: t('teo-nav-cameras'),
      path: '/cameras',
    },
    {
      active: route.path.startsWith('/present-website'),
      disabled: requiresCongregation.value,
      icon: 'mmm-open-web',
      label: t('teo-nav-website'),
      path: '/present-website',
    },
    {
      active: route.path.startsWith('/settings'),
      disabled: !currentSettings.value || route.fullPath.includes('wizard'),
      icon: 'mmm-settings',
      label: t('teo-nav-settings'),
      path: '/settings',
    },
  ];

  if (!cameraOnlyMode.value) return allTabs;

  return allTabs.filter(
    (tab) =>
      tab.path.startsWith('/cameras') || tab.path.startsWith('/settings'),
  );
});

const aboutModal = ref(false);
const dialogId = 'about-dialog';

const notifyPlaybackBeforeNavigating = () => {
  createTemporaryNotification({
    caption: t('stop-playing-media-first-explain'),
    group: 'stop-playing-media',
    icon: 'mmm-media',
    message: t('stop-playing-media-first'),
    type: 'warning',
  });
};

const goTo = (tab: TeoTab) => {
  if (tab.active) return;
  if (mediaIsPlaying.value) {
    notifyPlaybackBeforeNavigating();
    return;
  }
  if (tab.disabled) return;
  void router.push(tab.path);
};

const openProfileSwitcher = () => {
  if (mediaIsPlaying.value) {
    notifyPlaybackBeforeNavigating();
    return;
  }
  currentState.openCongregationSwitcher();
};

const openUpdateSettings = () => {
  void router.push('/settings/autoUpdateApp');
};

const handleAutoUpdatesToggled = (event: Event) => {
  updatesAreDisabled.value = !(event as CustomEvent<boolean>).detail;
};

// Only tick the clock while demo mode is on (nothing to show otherwise).
watch(
  isDemoMode,
  (enabled) => {
    if (enabled) {
      updateVirtualClock();
      resume();
    } else {
      pause();
    }
  },
  { immediate: true },
);

onMounted(async () => {
  updatesAreDisabled.value = await updatesDisabled();
  globalThis.addEventListener('autoUpdatesToggled', handleAutoUpdatesToggled);
});

onBeforeUnmount(() => {
  globalThis.removeEventListener(
    'autoUpdatesToggled',
    handleAutoUpdatesToggled,
  );
});
</script>

<style lang="scss" scoped>
// Midnight chrome with a faint teal edge: TEO's own identity, distinct from
// the flat blue bar of the original app.
.teo-header {
  background: linear-gradient(115deg, #081120 0%, #0d1b2e 55%, #0b2530 100%);
  border-bottom: 1px solid rgba(94, 234, 212, 0.16);
  box-shadow: 0 12px 30px rgba(3, 12, 24, 0.35);
  color: #fff;
}

.teo-header__top {
  align-items: center;
  display: flex;
  gap: 10px;
  height: 66px;
  padding: 0 18px;
}

.teo-brand-btn {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  padding: 4px 6px;
  transition: background 0.18s ease;
}

.teo-brand-btn:hover {
  background: rgba(94, 234, 212, 0.08);
}

.teo-brand-btn:focus-visible {
  outline: 2px solid #5eead4;
  outline-offset: 2px;
}

.teo-header__warning {
  color: #fbbf24;
}

.teo-header__spacer {
  flex: 1 1 auto;
}

.teo-header__status {
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.teo-profile {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
}

.teo-profile__name {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teo-demo-badge {
  font-size: 0.68rem;
}

.teo-mode-badge {
  background: rgba(94, 234, 212, 0.1);
  border: 1px solid rgba(94, 234, 212, 0.35);
  color: #99f6e4;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.teo-header__nav {
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  gap: 16px;
  height: 54px;
  padding: 0 14px;
}

.teo-tabs {
  align-items: center;
  display: flex;
  gap: 4px;
  min-width: 0;
}

.teo-tab {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 650;
  gap: 7px;
  height: 38px;
  letter-spacing: 0.08em;
  padding: 0 14px;
  text-transform: uppercase;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.teo-tab:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.teo-tab--active {
  background: rgba(94, 234, 212, 0.12);
  box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.22);
  color: #fff;
}

.teo-tab--active .q-icon {
  color: #5eead4;
}

.teo-tab--disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.teo-tab--disabled:hover {
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
}

.teo-tab:focus-visible {
  outline: 2px solid #5eead4;
  outline-offset: 2px;
}

.teo-header__actions {
  align-items: center;
  display: flex;
  gap: 6px;
  margin-left: auto;
  overflow-x: auto;
  scrollbar-width: none;
}

.teo-header__actions::-webkit-scrollbar {
  display: none;
}

@media (max-width: 720px) {
  .teo-header__top {
    gap: 6px;
    padding: 0 10px;
  }

  .teo-header__nav {
    gap: 8px;
    padding: 0 8px;
  }

  .teo-tab {
    padding: 0 10px;
  }

  .teo-profile__name {
    display: none;
  }

  .teo-brand-btn :deep(.teo-brand__text) {
    display: none;
  }
}
</style>
