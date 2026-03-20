<script setup lang="ts">
import type { Channel, ProductPriceList, User } from '#shared/types';
import {
  TARGET_FIELD_DEFS,
  FIELD_GROUP_LABELS,
  type FieldGroup,
  type ImportConfig,
  type ColumnExample,
} from '@/composables/useCompanyImport';

const importConfig = defineModel<ImportConfig>('importConfig', { required: true });

const props = defineProps<{
  csvHeaders: string[];
  channels: Channel[];
  priceLists: ProductPriceList[];
  users: User[];
  canProceed: boolean;
  columnExamples: Record<string, ColumnExample>;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'next' | 'prev'): void;
}>();

const { t } = useI18n();

const fieldGroups = computed(() => {
  const groups: { key: FieldGroup; label: string; fields: typeof TARGET_FIELD_DEFS }[] = [];
  const groupOrder: FieldGroup[] = ['company', 'buyer', 'billing', 'shipping', 'other'];
  for (const groupKey of groupOrder) {
    const fields = TARGET_FIELD_DEFS.filter((f) => f.group === groupKey);
    if (fields.length > 0) {
      groups.push({ key: groupKey, label: FIELD_GROUP_LABELS[groupKey], fields });
    }
  }
  return groups;
});

const autoDetectedCount = computed(() =>
  Object.values(importConfig.value.fieldMappings).filter(Boolean).length,
);

const csvHeaderOptions = computed(() =>
  props.csvHeaders.map((header) => ({
    value: header,
    label: header,
    summary: props.columnExamples[header]?.summary,
  })),
);
</script>

<template>
  <div class="overflow-y-auto">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <Card v-for="i in 3" :key="i" class="p-6">
        <Skeleton class="mb-4 h-6 w-48" />
        <Skeleton class="mb-6 h-4 w-80" />
        <div class="space-y-3">
          <div v-for="j in (i === 1 ? 6 : 2)" :key="j" class="flex items-center gap-3">
            <Skeleton class="h-4 w-40 shrink-0" />
            <Skeleton class="h-9 flex-1" />
          </div>
        </div>
      </Card>
    </div>

    <div v-else class="space-y-6">
      <!-- Field mapping -->
      <Card class="p-6">
        <h3 class="mb-2 text-lg font-semibold">
          {{ t('customers.import_field_mapping') }}
        </h3>
        <p class="text-muted-foreground mb-4 text-sm">
          {{ t('customers.import_field_mapping_description') }}
        </p>
        <div v-if="autoDetectedCount > 0" class="mb-4">
          <Badge variant="positive-outline">
            {{ t('customers.import_auto_detected', { count: autoDetectedCount, total: TARGET_FIELD_DEFS.length }) }}
          </Badge>
        </div>

        <div class="space-y-6">
          <div v-for="group in fieldGroups" :key="group.key">
            <h4 class="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              {{ t(group.label) }}
            </h4>
            <div class="space-y-2">
              <div v-for="field in group.fields" :key="field.key" class="flex items-center gap-3">
                <Label class="w-40 shrink-0 text-sm">
                  {{ t(field.labelKey) }}
                  <span v-if="field.required" class="text-destructive">*</span>
                </Label>
                <FormSelectWithHints
                  v-model="importConfig.fieldMappings[field.key]"
                  :options="csvHeaderOptions"
                  :placeholder="t('customers.import_not_mapped')"
                  class="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Channel selection -->
      <Card class="p-6">
        <h3 class="mb-4 text-lg font-semibold">
          {{ t('customers.import_channel') }}
        </h3>
        <p class="text-muted-foreground mb-4 text-sm">
          {{ t('customers.import_channel_description') }}
        </p>
        <NativeSelect v-model="importConfig.channelId">
          <option value="">{{ t('customers.import_select_channel') }}</option>
          <option
            v-for="channel in channels"
            :key="channel._id"
            :value="channel._id"
          >
            {{ channel.displayName || channel.name }}
          </option>
        </NativeSelect>
      </Card>

      <!-- Price list mapping -->
      <Card v-if="importConfig.priceListMappings.length > 0" class="p-6">
        <h3 class="mb-4 text-lg font-semibold">
          {{ t('customers.import_pricelist_mapping') }}
        </h3>
        <p class="text-muted-foreground mb-4 text-sm">
          {{ t('customers.import_pricelist_mapping_description') }}
        </p>
        <div class="space-y-3">
          <div
            v-for="mapping in importConfig.priceListMappings"
            :key="mapping.csvCode"
            class="flex items-center gap-4"
          >
            <Badge variant="outline" class="min-w-[60px] justify-center">
              {{ mapping.csvCode }}
            </Badge>
            <LucideArrowRight class="text-muted-foreground size-4" />
            <NativeSelect v-model="mapping.priceListId" class="flex-1">
              <option value="">{{ t('customers.import_no_pricelist') }}</option>
              <option
                v-for="pl in priceLists"
                :key="pl._id"
                :value="pl._id"
              >
                {{ pl.name }}
              </option>
            </NativeSelect>
          </div>
        </div>
      </Card>
      <!-- Sales rep mapping -->
      <Card v-if="importConfig.salesRepMappings.length > 0" class="p-6">
        <h3 class="mb-4 text-lg font-semibold">
          {{ t('customers.import_salesrep_mapping') }}
        </h3>
        <p class="text-muted-foreground mb-4 text-sm">
          {{ t('customers.import_salesrep_mapping_description') }}
        </p>
        <div class="space-y-3">
          <div
            v-for="mapping in importConfig.salesRepMappings"
            :key="mapping.csvName"
            class="flex items-center gap-4"
          >
            <Badge variant="outline" class="min-w-[100px] justify-center">
              {{ mapping.csvName }}
            </Badge>
            <LucideArrowRight class="text-muted-foreground size-4" />
            <NativeSelect v-model="mapping.userId" class="flex-1">
              <option value="">{{ t('customers.import_no_salesrep') }}</option>
              <option
                v-for="user in users"
                :key="user._id"
                :value="user._id"
              >
                {{ user.name }}
              </option>
            </NativeSelect>
          </div>
        </div>
      </Card>

      <!-- Duplicate handling -->
      <Card class="p-6">
        <h3 class="mb-2 text-lg font-semibold">
          {{ t('customers.import_duplicate_handling') }}
        </h3>
        <p class="text-muted-foreground mb-4 text-sm">
          {{ t('customers.import_duplicate_handling_description') }}
        </p>
        <NativeSelect v-model="importConfig.duplicateStrategy">
          <option value="insert">{{ t('customers.import_duplicate_insert') }}</option>
          <option value="update">{{ t('customers.import_duplicate_update') }}</option>
          <option value="skip">{{ t('customers.import_duplicate_skip') }}</option>
        </NativeSelect>
      </Card>
    </div>

    <div v-if="!loading" class="mt-4 flex justify-between">
      <Button variant="outline" @click="emit('prev')">
        <LucideChevronLeft class="mr-2 size-4" />
        {{ t('back') }}
      </Button>
      <Button :disabled="!canProceed" @click="emit('next')">
        {{ t('continue') }}
        <LucideChevronRight class="ml-2 size-4" />
      </Button>
    </div>
  </div>
</template>
