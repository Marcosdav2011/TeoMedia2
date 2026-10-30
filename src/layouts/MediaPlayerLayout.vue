<template>
  <div class="no-scroll fit-snugly">
    <q-layout class="bg-black text-white" style="align-content: center">
      <!-- This is where pages get injected -->
      <router-view />
    </q-layout>
  </div>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';
import { MEDIA_WINDOW_TITLE } from 'src/constants/zoom';
import { initializeElectronApi } from 'src/helpers/electron-api-manager';
import { onMounted } from 'vue';

void initializeElectronApi('MediaPlayerLayout');

// Zoom's helper finds this window by its exact title (the constant), so the
// page title must match it rather than build a title of its own.
useMeta({ title: MEDIA_WINDOW_TITLE });

onMounted(() => {
  document.body.style.overflow = 'hidden';
});
</script>
