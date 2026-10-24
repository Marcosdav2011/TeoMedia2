<template>
  <span class="teo-brand" :class="`teo-brand--${tone}`">
    <svg aria-hidden="true" class="teo-brand__mark" viewBox="0 0 48 48">
      <defs>
        <linearGradient
          id="teo-brand-gradient"
          gradientUnits="userSpaceOnUse"
          x1="4"
          x2="44"
          y1="2"
          y2="46"
        >
          <stop stop-color="#2dd4bf" />
          <stop offset=".55" stop-color="#0d9488" />
          <stop offset="1" stop-color="#4f46e5" />
        </linearGradient>
      </defs>
      <rect fill="url(#teo-brand-gradient)" height="48" rx="14" width="48" />
      <text
        dominant-baseline="central"
        fill="#fff"
        font-family="'Segoe UI', system-ui, sans-serif"
        font-size="17"
        font-weight="800"
        letter-spacing="-0.5"
        text-anchor="middle"
        x="24"
        y="25"
      >
        TM2
      </text>
      <circle cx="14.5" cy="13" fill="#fff" opacity=".75" r="1.6" />
    </svg>
    <span class="teo-brand__text">
      <span class="teo-brand__name">TM2</span>
      <span class="teo-brand__sub">TEO MEDIA</span>
    </span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'dark' | 'light' }>(), {
  tone: 'dark',
});
</script>

<style scoped>
.teo-brand {
  align-items: center;
  display: inline-flex;
  gap: 10px;
}

.teo-brand__mark {
  filter: drop-shadow(0 6px 14px rgba(13, 148, 136, 0.35));
  flex-shrink: 0;
  height: 38px;
  width: 38px;
}

.teo-brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.teo-brand__name {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.teo-brand__sub {
  color: #5eead4;
  font-size: 0.52rem;
  font-weight: 600;
  letter-spacing: 0.26em;
  margin-top: 4px;
  opacity: 0.85;
}

.teo-brand--dark .teo-brand__name {
  color: #fff;
}

.teo-brand--light .teo-brand__name {
  color: #0c1a24;
}

.teo-brand--light .teo-brand__sub {
  color: #0f766e;
}
</style>
