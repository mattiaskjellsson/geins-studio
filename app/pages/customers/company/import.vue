<script setup lang="ts">
import type { Channel, ProductPriceList, User } from '#shared/types';

const scope = 'pages/customers/company/import.vue';
const { t } = useI18n();
const { geinsLogError } = useGeinsLog(scope);

definePageMeta({
  pageType: 'list',
});

const {
  currentStep,
  csvHeaders,
  csvRows,
  importRows,
  importConfig,
  importProgress,
  importing,
  parseFile,
  runImport,
  goToStep,
  reset,
  getMappedValue,
} = useCompanyImport();

// Data for configuration dropdowns
const { globalApi, productApi } = useGeinsRepository();
const { useGeinsFetch } = useGeinsApi();
const channels = ref<Channel[]>([]);
const priceLists = ref<ProductPriceList[]>([]);
const users = ref<User[]>([]);
const loadingConfig = ref(true);

const fileInput = ref<HTMLInputElement | null>(null);
const dragOver = ref(false);
const fileName = ref('');

// Steps definition
const steps = computed(() => [
  { key: 'upload' as const, label: t('customers.import_step_upload'), icon: 'LucideUpload' },
  { key: 'configure' as const, label: t('customers.import_step_configure'), icon: 'LucideSettings2' },
  { key: 'preview' as const, label: t('customers.import_step_preview'), icon: 'LucideEye' },
  { key: 'import' as const, label: t('customers.import_step_import'), icon: 'LucidePlay' },
]);

const currentStepIndex = computed(() =>
  steps.value.findIndex((s) => s.key === currentStep.value),
);

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'upload':
      return csvRows.value.length > 0;
    case 'configure':
      return !!importConfig.value.channelId;
    case 'preview':
      return importRows.value.some((r) => r.selected && !r.skipped);
    default:
      return false;
  }
});

// Fetch channels, price lists, and users
onMounted(async () => {
  try {
    const [channelData, priceListData] = await Promise.all([
      globalApi.channel.list(),
      productApi.priceList.list(),
    ]);
    channels.value = channelData;
    priceLists.value = priceListData;

    const usersResult = await useGeinsFetch<User[]>('/user/list');
    if (!usersResult.error.value && usersResult.data.value) {
      users.value = (usersResult.data.value as User[]).map((user: User) => ({
        ...user,
        name: fullName(user),
      }));
    }
  } catch (err) {
    geinsLogError('Failed to load configuration data', err);
  } finally {
    loadingConfig.value = false;
  }
});

// File handling
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    processFile(file);
  }
}

function handleDrop(event: DragEvent) {
  dragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
}

async function processFile(file: File) {
  if (!file.name.endsWith('.csv')) {
    return;
  }
  fileName.value = file.name;
  await parseFile(file);
}

function triggerFileInput() {
  fileInput.value?.click();
}

// Navigation
function nextStep() {
  const idx = currentStepIndex.value;
  const next = steps.value[idx + 1];
  if (next) {
    goToStep(next.key);
  }
}

function prevStep() {
  const idx = currentStepIndex.value;
  const prev = steps.value[idx - 1];
  if (prev) {
    goToStep(prev.key);
  }
}

async function startImport() {
  goToStep('import');
  await runImport();
}

function startOver() {
  reset();
  fileName.value = '';
}

// Summary computed values
const totalRows = computed(() => csvRows.value.length);
const companyRows = computed(
  () => csvRows.value.filter((r) => r.type !== 'private').length,
);
const privateRows = computed(
  () => csvRows.value.filter((r) => r.type === 'private').length,
);
const selectedRows = computed(
  () => importRows.value.filter((r) => r.selected && !r.skipped).length,
);
const invalidRows = computed(
  () => importRows.value.filter((r) => !r.valid && !r.skipped).length,
);
const allNonSkippedSelected = computed(
  () => importRows.value.filter((r) => !r.skipped).every((r) => r.selected),
);

function toggleSelectAll() {
  const newValue = !allNonSkippedSelected.value;
  for (const row of importRows.value) {
    if (!row.skipped) {
      row.selected = newValue;
    }
  }
}

// Edit panel state
const editingRow = ref<(typeof importRows.value)[number] | null>(null);
const editPanelOpen = ref(false);

function openEditPanel(row: (typeof importRows.value)[number]) {
  editingRow.value = row;
  editPanelOpen.value = true;
}

function closeEditPanel() {
  if (editingRow.value) {
    revalidateRow(editingRow.value);
  }
  editPanelOpen.value = false;
  editingRow.value = null;
}

function revalidateRow(row: (typeof importRows.value)[number]) {
  row.companyName = getMappedValue(row, 'companyName') || `Row ${row.index + 1}`;
  const errors: string[] = [];
  if (!getMappedValue(row, 'companyName').trim()) {
    errors.push(t('customers.import_error_missing_name'));
  }
  if (!importConfig.value.channelId) {
    errors.push(t('customers.import_error_no_channel'));
  }
  row.validationErrors = errors;
  row.valid = errors.length === 0;
}

const progressPercent = computed(() => {
  if (importProgress.value.total === 0) return 0;
  return Math.round(
    (importProgress.value.done / importProgress.value.total) * 100,
  );
});
</script>

<template>
  <ContentHeader :title="t('customers.import_companies')">
    <ContentActionBar>
      <Button
        v-if="currentStep !== 'upload'"
        variant="outline"
        @click="startOver"
      >
        <LucideRotateCcw class="mr-2 size-4" />
        {{ t('customers.import_start_over') }}
      </Button>
    </ContentActionBar>
  </ContentHeader>

  <!-- Step indicator -->
  <div class="mb-6 flex items-center gap-2">
    <template v-for="(step, idx) in steps" :key="step.key">
      <div
        class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="[
          currentStep === step.key
            ? 'bg-primary text-primary-foreground'
            : idx < currentStepIndex
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground',
        ]"
      >
        <span
          class="flex size-6 items-center justify-center rounded-full text-xs font-bold"
          :class="[
            idx < currentStepIndex
              ? 'bg-primary/20 text-primary'
              : currentStep === step.key
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground',
          ]"
        >
          <LucideCheck v-if="idx < currentStepIndex" class="size-3.5" />
          <span v-else>{{ idx + 1 }}</span>
        </span>
        {{ step.label }}
      </div>
      <LucideChevronRight
        v-if="idx < steps.length - 1"
        class="text-muted-foreground size-4"
      />
    </template>
  </div>

  <!-- Step: Upload -->
  <div v-if="currentStep === 'upload'">
    <Card class="p-6">
      <h3 class="mb-4 text-lg font-semibold">
        {{ t('customers.import_upload_title') }}
      </h3>
      <p class="text-muted-foreground mb-6 text-sm">
        {{ t('customers.import_upload_description') }}
      </p>

      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        class="hidden"
        @change="handleFileSelect"
      />

      <div
        class="border-border hover:border-primary/50 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors"
        :class="{ 'border-primary bg-primary/5': dragOver }"
        @click="triggerFileInput"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="handleDrop"
      >
        <LucideUpload class="text-muted-foreground mb-4 size-10" />
        <p class="mb-1 text-sm font-medium">
          {{ t('customers.import_drop_file') }}
        </p>
        <p class="text-muted-foreground text-xs">
          {{ t('customers.import_csv_only') }}
        </p>
      </div>

      <!-- File info after upload -->
      <div v-if="csvRows.length > 0" class="mt-6">
        <div
          class="bg-muted flex items-center justify-between rounded-lg p-4"
        >
          <div class="flex items-center gap-3">
            <LucideFileSpreadsheet class="text-primary size-8" />
            <div>
              <p class="text-sm font-medium">{{ fileName }}</p>
              <p class="text-muted-foreground text-xs">
                {{ t('customers.import_rows_found', { total: totalRows, companies: companyRows, private: privateRows }) }}
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {{ t('customers.import_columns', { count: csvHeaders.length }) }}
          </Badge>
        </div>
      </div>
    </Card>

    <div class="mt-4 flex justify-end">
      <Button :disabled="!canProceed" @click="nextStep">
        {{ t('continue') }}
        <LucideChevronRight class="ml-2 size-4" />
      </Button>
    </div>
  </div>

  <!-- Step: Configure -->
  <CompanyImportStepConfigure
    v-if="currentStep === 'configure'"
    v-model:import-config="importConfig"
    :csv-headers="csvHeaders"
    :channels="channels"
    :price-lists="priceLists"
    :can-proceed="canProceed"
    @next="nextStep"
    @prev="prevStep"
  />

  <!-- Step: Preview -->
  <CompanyImportStepPreview
    v-if="currentStep === 'preview'"
    v-model:import-rows="importRows"
    :selected-count="selectedRows"
    :invalid-count="invalidRows"
    :private-count="privateRows"
    :all-non-skipped-selected="allNonSkippedSelected"
    :can-proceed="canProceed"
    :get-mapped-value="getMappedValue"
    @toggle-select-all="toggleSelectAll"
    @open-edit="openEditPanel"
    @start-import="startImport"
    @prev="prevStep"
  />

  <!-- Edit company panel -->
  <Sheet v-model:open="editPanelOpen">
    <SheetContent width="medium">
      <CompanyImportEditPanel
        v-if="editingRow"
        v-model:row="editingRow"
        :price-lists="priceLists"
        :users="users"
        :import-config="importConfig"
        :get-mapped-value="getMappedValue"
        @close="closeEditPanel"
      />
    </SheetContent>
  </Sheet>

  <!-- Step: Import -->
  <CompanyImportStepProgress
    v-if="currentStep === 'import'"
    :import-rows="importRows"
    :importing="importing"
    :import-progress="importProgress"
    :progress-percent="progressPercent"
    @start-over="startOver"
    @go-to-companies="navigateTo('/customers/company/list')"
  />
</template>
