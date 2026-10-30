import type { TeoCameraLayout } from 'src/types';

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/** The layouts a camera can share the output with, named for the operator. */
export const useTeoCameraLayouts = () => {
  const { t } = useI18n();

  const layoutOptions = computed(() => [
    { label: t('teo-camera-layout-fullscreen'), value: 'fullscreen' as const },
    { label: t('teo-camera-layout-pip'), value: 'pip' as const },
    { label: t('teo-camera-layout-split'), value: 'split' as const },
  ]);

  const layoutLabel = (layout: TeoCameraLayout) =>
    layoutOptions.value.find((option) => option.value === layout)?.label ?? '';

  return { layoutLabel, layoutOptions };
};
