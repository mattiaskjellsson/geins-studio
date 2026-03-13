<script setup lang="ts">
import type { ImportRow, TargetField } from '@/composables/useCompanyImport';

const importRows = defineModel<ImportRow[]>('importRows', { required: true });

defineProps<{
  selectedCount: number;
  invalidCount: number;
  privateCount: number;
  allNonSkippedSelected: boolean;
  canProceed: boolean;
  getMappedValue: (row: ImportRow, target: TargetField) => string;
}>();

const emit = defineEmits<{
  (event: 'toggleSelectAll' | 'startImport' | 'prev'): void;
  (event: 'openEdit', row: ImportRow): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div>
    <Card class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{ t('customers.import_preview_title') }}
        </h3>
        <div class="flex gap-2">
          <Badge variant="positive-outline">
            {{ t('customers.import_selected_count', { count: selectedCount }) }}
          </Badge>
          <Badge v-if="invalidCount > 0" variant="negative">
            {{ t('customers.import_invalid_count', { count: invalidCount }) }}
          </Badge>
          <Badge v-if="privateCount > 0" variant="outline">
            {{ t('customers.import_skipped_count', { count: privateCount }) }}
          </Badge>
        </div>
      </div>

      <div class="max-h-[500px] overflow-auto">
        <table class="w-full text-sm">
          <thead class="bg-background sticky top-0">
            <tr class="border-b">
              <th class="p-2 text-left">
                <Checkbox
                  :model-value="allNonSkippedSelected"
                  @update:model-value="emit('toggleSelectAll')"
                />
              </th>
              <th class="p-2 text-left font-medium">#</th>
              <th class="p-2 text-left font-medium">{{ t('name') }}</th>
              <th class="p-2 text-left font-medium">{{ t('customers.vat_number') }}</th>
              <th class="p-2 text-left font-medium">{{ t('buyer') }}</th>
              <th class="p-2 text-left font-medium">{{ t('status') }}</th>
              <th class="w-10 p-2" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in importRows"
              :key="row.index"
              class="border-b last:border-0"
              :class="{
                'opacity-50': row.skipped,
                'bg-negative/5': !row.valid && !row.skipped,
                'opacity-60': !row.selected && !row.skipped,
              }"
            >
              <td class="p-2">
                <Checkbox
                  v-if="!row.skipped"
                  :model-value="row.selected"
                  @update:model-value="row.selected = $event as boolean"
                />
              </td>
              <td class="p-2">{{ row.index + 1 }}</td>
              <td class="p-2 font-medium">{{ row.companyName }}</td>
              <td class="text-muted-foreground p-2">
                {{ getMappedValue(row, 'vatNumber') || '-' }}
              </td>
              <td class="text-muted-foreground p-2">
                {{ getMappedValue(row, 'buyerName') || '-' }}
              </td>
              <td class="p-2">
                <Badge v-if="row.skipped" variant="outline">
                  {{ t('customers.import_status_skipped') }}
                </Badge>
                <Badge v-else-if="row.valid" variant="secondary">
                  {{ t('customers.import_status_ready') }}
                </Badge>
                <Tooltip v-else>
                  <TooltipTrigger>
                    <Badge variant="negative">
                      {{ t('customers.import_status_invalid') }}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <ul class="text-xs">
                      <li v-for="err in row.validationErrors" :key="err">
                        {{ err }}
                      </li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </td>
              <td class="p-2">
                <Button
                  v-if="!row.skipped"
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  @click="emit('openEdit', row)"
                >
                  <LucidePencil class="size-3.5" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <div class="bg-background sticky bottom-0 mt-4 flex justify-between border-t pt-4">
      <Button variant="outline" @click="emit('prev')">
        <LucideChevronLeft class="mr-2 size-4" />
        {{ t('back') }}
      </Button>
      <Button :disabled="!canProceed" @click="emit('startImport')">
        <LucidePlay class="mr-2 size-4" />
        {{ t('customers.import_start', { count: selectedCount }) }}
      </Button>
    </div>
  </div>
</template>
