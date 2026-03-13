<script setup lang="ts">
import { VisuallyHidden } from 'reka-ui';
import { TableMode } from '#shared/types';
import type { ProductPriceList, User } from '#shared/types';
import type { ImportRow, ImportConfig, TargetField } from '@/composables/useCompanyImport';

const row = defineModel<ImportRow>('row', { required: true });

const props = defineProps<{
  priceLists: ProductPriceList[];
  users: User[];
  importConfig: ImportConfig;
  getMappedValue: (row: ImportRow, target: TargetField) => string;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

const { t } = useI18n();

const editPanelTab = ref('general');

// Buyer management
function addBuyer() {
  row.value.buyers.push({
    firstName: '',
    lastName: '',
    email: '',
    active: true,
  });
}

function removeBuyer(index: number) {
  row.value.buyers.splice(index, 1);
}

// Price list management
function addPriceList(id: string) {
  if (!row.value.priceListIds.includes(id)) {
    row.value.priceListIds.push(id);
  }
}

function removePriceList(id: string) {
  row.value.priceListIds = row.value.priceListIds.filter((plId) => plId !== id);
}

// Price list table columns
const {
  getColumns: getPriceListColumns,
  addActionsColumn: addPriceListActionsColumn,
} = useColumns<ProductPriceList>();

const addedPriceLists = computed(() =>
  props.priceLists.filter((pl) => row.value.priceListIds.includes(pl._id)),
);

const priceListColumns = computed(() => {
  if (addedPriceLists.value.length === 0) return [];

  const columns = getPriceListColumns(addedPriceLists.value, {
    includeColumns: ['_id', 'name', 'currency', 'active'],
    sortable: false,
  });

  addPriceListActionsColumn(
    columns,
    {
      onDelete: (entity: ProductPriceList) => {
        removePriceList(entity._id);
      },
    },
    'delete',
  );
  return columns;
});

const { getVisibilityState } = useTable<ProductPriceList>();
const priceListVisibilityState = getVisibilityState(['_id']);

// CSV price list mapping info
const csvPriceListCode = computed(() =>
  props.getMappedValue(row.value, 'priceListCode'),
);

const mappedPriceListName = computed(() => {
  const code = csvPriceListCode.value;
  if (!code) return '';
  const mapping = props.importConfig.priceListMappings.find((m) => m.csvCode === code);
  if (!mapping || !mapping.priceListId) return '';
  const pl = props.priceLists.find((p) => p._id === mapping.priceListId);
  return pl?.name || '';
});
</script>

<template>
  <SheetHeader>
    <SheetTitle>{{ t('customers.import_edit_company') }}</SheetTitle>
    <VisuallyHidden>
      <SheetDescription>{{ t('customers.import_edit_company') }}</SheetDescription>
    </VisuallyHidden>
  </SheetHeader>

  <SheetBody>
    <Tabs v-model="editPanelTab">
      <TabsList class="mb-6 w-full">
        <TabsTrigger value="general">
          {{ t('general') }}
        </TabsTrigger>
        <TabsTrigger value="buyers">
          {{ t('buyer', 2) }}
        </TabsTrigger>
        <TabsTrigger value="pricelists">
          {{ t('price_list', 2) }}
        </TabsTrigger>
        <TabsTrigger value="settings">
          {{ t('settings') }}
        </TabsTrigger>
      </TabsList>

      <!-- Tab: General -->
      <TabsContent value="general">
        <ContentCardHeader
          size="md"
          heading-level="h3"
          :title="t('customers.company_details')"
        />
        <FormGridWrap>
          <FormGrid design="1+1+1">
            <div class="space-y-1">
              <Label>{{ t('name') }}</Label>
              <Input v-model="row.overrides['companyName']" />
            </div>
            <div class="space-y-1">
              <Label>{{ t('customers.vat_number') }}</Label>
              <Input v-model="row.overrides['vatNumber']" />
            </div>
            <div class="space-y-1">
              <Label>{{ t('customers.external_id') }}</Label>
              <Input v-model="row.overrides['externalId']" />
            </div>
          </FormGrid>
          <FormGrid design="1">
            <div class="space-y-1">
              <Label>{{ t('sales_rep', 2) }}</Label>
              <FormInputTagsSearch
                v-model="row.salesRepIds"
                entity-name="sales_rep"
                :data-set="users"
              />
            </div>
          </FormGrid>
          <FormGrid design="1">
            <div class="space-y-1">
              <Label>{{ t('channel', 2) }}</Label>
              <FormInputChannels v-model="row.channelIds" />
            </div>
          </FormGrid>
        </FormGridWrap>

        <!-- Addresses -->
        <div class="mt-8">
          <Tabs default-value="billing">
            <TabsList>
              <TabsTrigger value="billing">
                {{ t('billing_address') }}
              </TabsTrigger>
              <TabsTrigger value="shipping">
                {{ t('shipping_address') }}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="billing">
              <FormGridWrap>
                <FormGrid design="2+1+1">
                  <div class="space-y-1">
                    <Label>{{ t('address.company_name') }}</Label>
                    <Input v-model="row.overrides['billingCompany']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('person.first_name') }}</Label>
                    <Input v-model="row.overrides['billingFirstName']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('person.last_name') }}</Label>
                    <Input v-model="row.overrides['billingLastName']" />
                  </div>
                </FormGrid>
                <FormGrid design="2+1+1">
                  <div class="space-y-1">
                    <Label>{{ t('address.addressLine1') }}</Label>
                    <Input v-model="row.overrides['billingAddressLine1']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('address.zip') }}</Label>
                    <Input v-model="row.overrides['billingZip']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('address.city') }}</Label>
                    <Input v-model="row.overrides['billingCity']" />
                  </div>
                </FormGrid>
                <FormGrid design="1+1">
                  <div class="space-y-1">
                    <Label>{{ t('address.addressLine2') }}</Label>
                    <Input v-model="row.overrides['billingAddressLine2']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('address.country') }}</Label>
                    <Input v-model="row.overrides['billingCountry']" />
                  </div>
                </FormGrid>
                <FormGrid design="1+1">
                  <div class="space-y-1">
                    <Label>{{ t('email') }}</Label>
                    <Input v-model="row.overrides['billingEmail']" type="email" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('address.phone') }}</Label>
                    <Input v-model="row.overrides['billingPhone']" />
                  </div>
                </FormGrid>
              </FormGridWrap>
            </TabsContent>

            <TabsContent value="shipping">
              <FormGridWrap>
                <FormGrid design="2+1+1">
                  <div class="space-y-1">
                    <Label>{{ t('address.company_name') }}</Label>
                    <Input v-model="row.overrides['shippingCompany']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('person.first_name') }}</Label>
                    <Input v-model="row.overrides['shippingFirstName']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('person.last_name') }}</Label>
                    <Input v-model="row.overrides['shippingLastName']" />
                  </div>
                </FormGrid>
                <FormGrid design="2+1+1">
                  <div class="space-y-1">
                    <Label>{{ t('address.addressLine1') }}</Label>
                    <Input v-model="row.overrides['shippingAddressLine1']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('address.zip') }}</Label>
                    <Input v-model="row.overrides['shippingZip']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('address.city') }}</Label>
                    <Input v-model="row.overrides['shippingCity']" />
                  </div>
                </FormGrid>
                <FormGrid design="1+1">
                  <div class="space-y-1">
                    <Label>{{ t('address.addressLine2') }}</Label>
                    <Input v-model="row.overrides['shippingAddressLine2']" />
                  </div>
                  <div class="space-y-1">
                    <Label>{{ t('address.country') }}</Label>
                    <Input v-model="row.overrides['shippingCountry']" />
                  </div>
                </FormGrid>
                <FormGrid design="1+1">
                  <div class="space-y-1">
                    <Label>{{ t('address.phone') }}</Label>
                    <Input v-model="row.overrides['shippingPhone']" />
                  </div>
                  <!-- <div /> -->
                </FormGrid>
              </FormGridWrap>
            </TabsContent>
          </Tabs>
        </div>
      </TabsContent>

      <!-- Tab: Buyers -->
      <TabsContent value="buyers">
        <div class="mb-4 flex items-center justify-between">
          <ContentCardHeader
            size="md"
            heading-level="h3"
            :title="t('buyer', 2)"
            :description="t('customers.buyers_description')"
          />
          <Button variant="outline" size="sm" @click="addBuyer">
            <LucidePlus class="mr-2 size-4" />
            {{ t('add_entity', { entityName: t('buyer') }) }}
          </Button>
        </div>

        <div v-if="row.buyers.length === 0" class="text-muted-foreground py-8 text-center text-sm">
          {{ t('customers.import_no_buyers') }}
        </div>

        <div v-else class="space-y-6">
          <Card v-for="(buyer, bIdx) in row.buyers" :key="bIdx" class="p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium">{{ t('buyer') }} {{ bIdx + 1 }}</span>
              <Button variant="ghost" size="icon" class="text-destructive size-7" @click="removeBuyer(bIdx)">
                <LucideTrash2 class="size-3.5" />
              </Button>
            </div>
            <FormGridWrap>
              <FormGrid design="1+1">
                <div class="space-y-1">
                  <Label>{{ t('person.first_name') }}</Label>
                  <Input v-model="buyer.firstName" />
                </div>
                <div class="space-y-1">
                  <Label>{{ t('person.last_name') }}</Label>
                  <Input v-model="buyer.lastName" />
                </div>
              </FormGrid>
              <FormGrid design="1+1">
                <div class="space-y-1">
                  <Label>{{ t('person.email') }}</Label>
                  <Input v-model="buyer.email" type="email" />
                </div>
                <div class="space-y-1">
                  <Label>{{ t('status') }}</Label>
                  <div class="pt-2">
                    <ContentSwitch
                      v-model:checked="buyer.active"
                      :label="t('active')"
                    />
                  </div>
                </div>
              </FormGrid>
            </FormGridWrap>
          </Card>
        </div>
      </TabsContent>

      <!-- Tab: Price Lists -->
      <TabsContent value="pricelists">
        <div v-if="csvPriceListCode" class="bg-muted mb-4 flex items-center gap-2 rounded-lg p-3 text-sm">
          <LucideInfo class="text-muted-foreground size-4 shrink-0" />
          <span class="text-muted-foreground">
            {{ t('customers.import_csv_pricelist_mapped', { code: csvPriceListCode, name: mappedPriceListName || t('customers.import_no_pricelist') }) }}
          </span>
        </div>

        <ContentEditCard
          :create-mode="true"
          :title="$t('price_list', 2)"
          :description="$t('customers.price_lists_description')"
        >
          <template #header-action>
            <SelectorQuickAdd
              :entities="priceLists"
              :selection="row.priceListIds"
              entity-name="price_list"
              :show-image="false"
              class="sm:w-2/5!"
              @add="addPriceList($event)"
              @remove="removePriceList($event)"
            />
          </template>
          <div>
            <TableView
              :mode="TableMode.Simple"
              entity-name="price_list"
              :columns="priceListColumns"
              :data="addedPriceLists"
              :init-visibility-state="priceListVisibilityState"
            />
          </div>
        </ContentEditCard>
      </TabsContent>

      <!-- Tab: Settings -->
      <TabsContent value="settings">
        <div class="space-y-6">
          <div>
            <ContentCardHeader
              size="md"
              heading-level="h3"
              :title="t('customers.product_access')"
              :description="t('customers.product_access_description')"
            />
            <ContentSwitch
              v-model:checked="row.limitedProductAccess"
              :label="t('customers.product_access_restrict_label')"
              :description="t('customers.product_access_restrict_description')"
            />
          </div>
          <div>
            <ContentCardHeader
              size="md"
              heading-level="h3"
              :title="t('customers.vat_settings')"
              :description="t('customers.vat_settings_description')"
            />
            <ContentSwitch
              v-model:checked="row.exVat"
              :label="t('customers.vat_included_label')"
              :description="t('customers.vat_included_description')"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </SheetBody>

  <SheetFooter>
    <Button @click="emit('close')">
      {{ t('done') }}
    </Button>
  </SheetFooter>
</template>
