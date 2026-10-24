<template>
  <q-drawer
    ref="navigationDrawer"
    v-model="drawer"
    bordered
    :breakpoint="5"
    class="column justify-between no-wrap bg-secondary-contrast text-weight-medium text-dark-grey"
    :mini="miniState"
    :mini-to-overlay="$q.screen.lt.md"
  >
    <q-slide-transition>
      <div v-if="$q.screen.gt.sm">
        <q-item v-ripple clickable @click="miniState = !miniState">
          <q-tooltip
            v-if="miniState"
            anchor="center right"
            :delay="1000"
            self="center left"
          >
            {{ t('expand') }}
          </q-tooltip>
          <q-item-section avatar>
            <q-icon name="mmm-menu" />
          </q-item-section>
          <q-item-section>{{ t('collapse') }}</q-item-section>
        </q-item>
      </div>
    </q-slide-transition>
    <q-item
      v-ripple
      :class="route.path.startsWith('/media-calendar') ? navActiveClass : ''"
      clickable
      :disable="!currentSettings || invalidSettings() || mediaIsPlaying"
      :to="mediaIsPlaying ? undefined : { path: '/media-calendar' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{
          !currentSettings
            ? t('select-a-congregation-to-enable')
            : t('titles.meetingMedia')
        }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-media" />
      </q-item-section>
      <q-item-section>{{ t('titles.meetingMedia') }}</q-item-section>
    </q-item>
    <q-item
      v-ripple
      :class="route.path.startsWith('/present-website') ? navActiveClass : ''"
      clickable
      :disable="!currentSettings || invalidSettings() || mediaIsPlaying"
      :to="mediaIsPlaying ? undefined : { path: '/present-website' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState && !mediaIsPlaying"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ t('titles.presentWebsite') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-open-web" />
      </q-item-section>
      <q-item-section>{{ t('titles.presentWebsite') }}</q-item-section>
    </q-item>
    <q-item
      v-ripple
      :class="route.path.startsWith('/cameras') ? navActiveClass : ''"
      clickable
      :disable="!currentSettings || invalidSettings() || mediaIsPlaying"
      :to="mediaIsPlaying ? undefined : { path: '/cameras' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState && !mediaIsPlaying"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ t('teo-cameras') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-video" />
      </q-item-section>
      <q-item-section>{{ t('teo-cameras') }}</q-item-section>
    </q-item>

    <!-- Output screen selection -->
    <q-item-label
      v-if="screens.length && !miniState"
      class="text-caption text-grey-6 text-uppercase"
      header
    >
      {{ t('teo-output-screen') }}
    </q-item-label>
    <q-item
      v-for="(screen, index) in screens"
      :key="screen.id"
      v-ripple
      clickable
      :disable="screen.mainWindow"
      @click="selectScreen(index)"
    >
      <q-tooltip
        v-if="miniState"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{
          screen.mainWindow
            ? t('main-window-is-on-this-screen')
            : `${screenLabel(index)} · ${screenDetails(screen)}`
        }}
      </q-tooltip>
      <q-tooltip v-else-if="screen.mainWindow" :delay="1000">
        {{ t('main-window-is-on-this-screen') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-fullscreen" />
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ screenLabel(index) }}</q-item-label>
        <q-item-label caption>
          {{ screenDetails(screen) }}
          <template v-if="screen.mainWindow">
            · {{ t('teo-main-screen') }}
          </template>
        </q-item-label>
      </q-item-section>
      <q-item-section v-if="preferredScreenIndex === index" side>
        <q-icon color="primary" name="mmm-check" />
      </q-item-section>
    </q-item>
    <q-item
      v-if="teoCamera.activeCameraId"
      v-ripple
      clickable
      @click="stopCamera"
    >
      <q-tooltip
        v-if="miniState"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ t('teo-stop-camera') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-video-off" />
      </q-item-section>
      <q-item-section>{{ t('teo-stop-camera') }}</q-item-section>
    </q-item>
    <q-space />
    <q-item
      v-ripple
      :class="congregationSwitcherOpen ? navActiveClass : ''"
      clickable
      :disable="mediaIsPlaying"
      @click="
        stopPlayingMediaFirst();
        !mediaIsPlaying && currentState.openCongregationSwitcher();
      "
    >
      <q-tooltip
        v-if="miniState && !mediaIsPlaying"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ t('titles.profileSelection') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon name="mmm-groups" />
      </q-item-section>
      <q-item-section>
        {{ t('titles.profileSelection') }}
      </q-item-section>
    </q-item>
    <q-item
      v-ripple
      :class="route.path.startsWith('/settings') ? navActiveClass : ''"
      clickable
      :disable="
        !currentSettings || route.fullPath.includes('wizard') || mediaIsPlaying
      "
      :to="mediaIsPlaying ? undefined : { path: '/settings' }"
      @click="stopPlayingMediaFirst()"
    >
      <q-tooltip
        v-if="miniState && !mediaIsPlaying"
        anchor="center right"
        :delay="1000"
        self="center left"
      >
        {{ t('settings') }}
      </q-tooltip>
      <q-item-section avatar>
        <q-icon
          :color="invalidSettings() ? 'negative' : ''"
          name="mmm-settings"
        />
      </q-item-section>
      <q-item-section :class="invalidSettings() ? 'text-negative' : ''">
        {{ t('settings') }}
      </q-item-section>
    </q-item>
  </q-drawer>
</template>
<script setup lang="ts">
import { useElementHover, whenever } from '@vueuse/core';
// Packages
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useTeoScreens } from 'src/composables/useTeoScreens';
import { createTemporaryNotification } from 'src/helpers/notifications';
// Stores
import { useCurrentStateStore } from 'stores/current-state';
import { useTeoCameraStore } from 'stores/teo-camera';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const drawerElement = useTemplateRef<HTMLDivElement>('navigationDrawer');
const isHovered = useElementHover(drawerElement, {
  delayEnter: 200,
  delayLeave: 200,
});

const currentState = useCurrentStateStore();
const { invalidSettings } = currentState;
const { congregationSwitcherOpen, currentSettings, mediaIsPlaying } =
  storeToRefs(currentState);

const $q = useQuasar();
const route = useRoute();

const drawer = ref(true);
const miniState = defineModel<boolean>({ required: true });

const navActiveClass = computed(() =>
  $q.dark.isActive
    ? 'bg-accent-400 text-primary-emphasis blue-bar'
    : 'bg-accent-100 text-primary blue-bar',
);

const { t } = useI18n();

const teoCamera = useTeoCameraStore();
const {
  activateOutput,
  fetchScreens,
  preferredScreenIndex,
  screenDetails,
  screenLabel,
  screens,
  selectScreen,
} = useTeoScreens();

const stopPlayingMediaFirst = () => {
  if (mediaIsPlaying.value) {
    createTemporaryNotification({
      caption: ref(t('stop-playing-media-first')).value,
      group: 'stop-playing-media',
      icon: 'mmm-media',
      message: ref(t('stop-playing-media-first-explain')).value,
      type: 'warning',
    });
  }
};

const stopCamera = () => {
  teoCamera.stopCameraProjection();
};

const screenLayoutSignature = (list: (typeof screens)['value']) =>
  list
    .map(
      (screen) =>
        `${screen.id}:${screen.bounds.x},${screen.bounds.y},${screen.bounds.width},${screen.bounds.height}`,
    )
    .join('|');

let lastScreenLayout = '';
const activationTimers: ReturnType<typeof setTimeout>[] = [];

/**
 * Refreshes the screen list before activating, because `mediaWindowVisible`
 * and the window bounds are reported by the main process. `force` shows the
 * window even when a cached snapshot still reports it as visible.
 */
const scheduleActivation = (
  delay: number,
  options: { force?: boolean } = {},
) => {
  const timer = setTimeout(() => {
    void (async () => {
      await fetchScreens();
      activateOutput(undefined, options);
    })();
  }, delay);
  activationTimers.push(timer);
};

// TEO keeps the output window active from startup on the selected screen, and
// follows monitor additions/removals without reacting to ordinary refreshes
// (moving the window itself triggers those refreshes).
watch(
  screens,
  (list) => {
    if (!list.length) return;
    const layout = screenLayoutSignature(list);
    if (layout === lastScreenLayout) return;
    lastScreenLayout = layout;
    activateOutput();
  },
  { immediate: true },
);

watch(mediaIsPlaying, (playing, wasPlaying) => {
  if (playing && !wasPlaying) {
    // The camera must not cover projected media; keep the assignment so it
    // can come back when playback ends.
    teoCamera.suspendCameraProjection();
    // Pin the output after MMM's own start-of-playback placement pass.
    scheduleActivation(0);
    scheduleActivation(600);
    return;
  }

  if (wasPlaying && !playing) {
    scheduleActivation(0);
    teoCamera.resumeCameraProjection();
  }
});

// MMM hides the output after playback, when no congregation is active, or from
// its own display dialog. TEO keeps it showing the yeartext instead.
watch(
  () => currentState.mediaWindowVisible,
  (visible) => {
    if (visible) return;
    scheduleActivation(300, { force: true });
  },
);

onMounted(() => {
  // The media window can be created slightly after this drawer mounts; retry
  // so the output is actually shown at startup, not just requested too early.
  scheduleActivation(0);
  scheduleActivation(750);
  scheduleActivation(2000);
  scheduleActivation(5000);
});

onBeforeUnmount(() => {
  activationTimers.forEach((timer) => clearTimeout(timer));
});

watch(isHovered, (hovered) => {
  if (!$q.screen.lt.md) return;
  miniState.value = !hovered;
});

whenever(
  () => $q.screen.lt.md,
  () => {
    miniState.value = true;
  },
);
</script>
