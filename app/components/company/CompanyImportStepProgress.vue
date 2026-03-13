<script setup lang="ts">
import type { ImportRow } from '@/composables/useCompanyImport';

defineProps<{
  importRows: ImportRow[];
  importing: boolean;
  importProgress: { total: number; done: number; errors: number };
  progressPercent: number;
}>();

const emit = defineEmits<{
  (event: 'startOver' | 'goToCompanies'): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <Card class="p-6">
      <h3 class="mb-4 text-lg font-semibold">
        {{ importing ? t('customers.import_in_progress') : t('customers.import_complete') }}
      </h3>

      <!-- Progress bar -->
      <div class="bg-muted mb-4 h-3 w-full overflow-hidden rounded-full">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="[
            importProgress.errors > 0
              ? 'bg-warning'
              : 'bg-primary',
          ]"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <div class="mb-6 flex items-center justify-between text-sm">
        <span class="text-muted-foreground">
          {{ t('customers.import_progress', { done: importProgress.done, total: importProgress.total }) }}
        </span>
        <div class="flex gap-3">
          <span class="text-green-600">
            {{ t('customers.import_success_count', { count: importProgress.done - importProgress.errors }) }}
          </span>
          <span v-if="importProgress.errors > 0" class="text-destructive">
            {{ t('customers.import_error_count', { count: importProgress.errors }) }}
          </span>
        </div>
      </div>

      <!-- Row-by-row results -->
      <div class="max-h-[400px] overflow-auto">
        <div
          v-for="row in importRows.filter((r) => r.selected && !r.skipped)"
          :key="row.index"
          class="flex items-center justify-between border-b py-2 last:border-0"
        >
          <div class="flex items-center gap-2">
            <LucideLoader2
              v-if="row.status === 'importing'"
              class="text-primary size-4 animate-spin"
            />
            <LucideCheck
              v-else-if="row.status === 'success'"
              class="size-4 text-green-600"
            />
            <LucideX
              v-else-if="row.status === 'error'"
              class="text-destructive size-4"
            />
            <LucideCircle
              v-else
              class="text-muted-foreground size-4"
            />
            <span class="text-sm">{{ row.companyName }}</span>
          </div>
          <span
            v-if="row.errorMessage"
            class="text-destructive text-xs"
          >
            {{ row.errorMessage }}
          </span>
        </div>
      </div>
    </Card>

    <div v-if="!importing" class="mt-4 flex justify-between">
      <Button variant="outline" @click="emit('startOver')">
        <LucideRotateCcw class="mr-2 size-4" />
        {{ t('customers.import_start_over') }}
      </Button>
      <Button @click="emit('goToCompanies')">
        {{ t('customers.import_go_to_companies') }}
        <LucideChevronRight class="ml-2 size-4" />
      </Button>
    </div>
  </div>
</template>
