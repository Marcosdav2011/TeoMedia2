<template>
  <q-btn color="white-transparent" :disable="!screens.length" unelevated>
    <q-icon
      :class="{ 'q-mr-sm': $q.screen.gt.sm }"
      name="mmm-fullscreen"
      size="xs"
    />
    <span v-if="$q.screen.gt.sm">{{ currentScreenLabel }}</span>
    <q-tooltip v-if="!$q.screen.gt.sm" :delay="1000">
      {{ t('teo-output-screen') }}
    </q-tooltip>
    <q-menu :offset="[0, 11]">
      <q-list class="list-primary" role="menu">
        <q-item-label header>{{ t('teo-output-screen') }}</q-item-label>
        <q-item
          v-for="(screen, index) in screens"
          :key="screen.id"
          v-close-popup
          clickable
          :disable="screen.mainWindow"
          @click="activateOutput(index)"
        >
          <q-item-section avatar>
            <q-icon
              :color="preferredScreenIndex === index ? 'primary' : ''"
              name="mmm-fullscreen"
            />
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
          <q-tooltip v-if="screen.mainWindow" :delay="1000">
            {{ t('main-window-is-on-this-screen') }}
          </q-tooltip>
        </q-item>
        <q-item v-if="!screens.length">
          <q-item-section class="text-caption text-grey-7">
            {{ t('teo-no-output-screen') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { useTeoScreens } from 'src/composables/useTeoScreens';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const {
  activateOutput,
  preferredScreenIndex,
  screenDetails,
  screenLabel,
  screens,
} = useTeoScreens();

const currentScreenLabel = computed(() =>
  preferredScreenIndex.value === null
    ? t('teo-output-screen')
    : screenLabel(preferredScreenIndex.value),
);
</script>
