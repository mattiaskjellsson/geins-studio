import type {
  CustomerCompanyCreate,
  CustomerCompanyUpdate,
  AddressCreate,
} from '#shared/types';
import { parseCsv } from '#shared/utils/csv-parser';

export type ImportStep = 'upload' | 'configure' | 'preview' | 'import';

export interface CsvRow {
  [key: string]: string;
}

// Target fields that CSV columns can be mapped to
export type TargetField =
  | 'companyName' | 'vatNumber' | 'externalId' | 'customerType' | 'active'
  | 'buyerName' | 'buyerEmail'
  | 'billingCompany' | 'billingFirstName' | 'billingLastName'
  | 'billingAddressLine1' | 'billingAddressLine2' | 'billingZip' | 'billingCity' | 'billingCountry' | 'billingPhone' | 'billingEmail'
  | 'shippingCompany' | 'shippingFirstName' | 'shippingLastName'
  | 'shippingAddressLine1' | 'shippingAddressLine2' | 'shippingZip' | 'shippingCity' | 'shippingCountry' | 'shippingPhone'
  | 'priceListCode';

export type FieldMappings = Partial<Record<TargetField, string>>;

export type FieldGroup = 'company' | 'buyer' | 'billing' | 'shipping' | 'other';

export interface TargetFieldDef {
  key: TargetField;
  labelKey: string;
  group: FieldGroup;
  required?: boolean;
}

export const TARGET_FIELD_DEFS: TargetFieldDef[] = [
  { key: 'companyName', labelKey: 'name', group: 'company', required: true },
  { key: 'vatNumber', labelKey: 'customers.vat_number', group: 'company' },
  { key: 'externalId', labelKey: 'customers.external_id', group: 'company' },
  { key: 'customerType', labelKey: 'type', group: 'company' },
  { key: 'active', labelKey: 'active', group: 'company' },
  { key: 'buyerName', labelKey: 'customers.import_buyer_name', group: 'buyer' },
  { key: 'buyerEmail', labelKey: 'email', group: 'buyer' },
  { key: 'billingCompany', labelKey: 'address.company_name', group: 'billing' },
  { key: 'billingFirstName', labelKey: 'person.first_name', group: 'billing' },
  { key: 'billingLastName', labelKey: 'person.last_name', group: 'billing' },
  { key: 'billingAddressLine1', labelKey: 'address.addressLine1', group: 'billing' },
  { key: 'billingAddressLine2', labelKey: 'address.addressLine2', group: 'billing' },
  { key: 'billingZip', labelKey: 'address.zip', group: 'billing' },
  { key: 'billingCity', labelKey: 'address.city', group: 'billing' },
  { key: 'billingCountry', labelKey: 'address.country', group: 'billing' },
  { key: 'billingPhone', labelKey: 'address.phone', group: 'billing' },
  { key: 'billingEmail', labelKey: 'email', group: 'billing' },
  { key: 'shippingCompany', labelKey: 'address.company_name', group: 'shipping' },
  { key: 'shippingFirstName', labelKey: 'person.first_name', group: 'shipping' },
  { key: 'shippingLastName', labelKey: 'person.last_name', group: 'shipping' },
  { key: 'shippingAddressLine1', labelKey: 'address.addressLine1', group: 'shipping' },
  { key: 'shippingAddressLine2', labelKey: 'address.addressLine2', group: 'shipping' },
  { key: 'shippingZip', labelKey: 'address.zip', group: 'shipping' },
  { key: 'shippingCity', labelKey: 'address.city', group: 'shipping' },
  { key: 'shippingCountry', labelKey: 'address.country', group: 'shipping' },
  { key: 'shippingPhone', labelKey: 'address.phone', group: 'shipping' },
  { key: 'priceListCode', labelKey: 'price_list', group: 'other' },
];

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  company: 'customers.company_details',
  buyer: 'buyer',
  billing: 'billing_address',
  shipping: 'shipping_address',
  other: 'other',
};

// Known CSV column names → target field mappings for auto-detection
const KNOWN_COLUMN_MAPPINGS: Record<string, TargetField> = {
  // kundregister.csv format
  'name': 'companyName',
  'organisation_number': 'vatNumber',
  'vat_number': 'vatNumber',
  'customer_number': 'externalId',
  'type': 'customerType',
  'active': 'active',
  'your_reference': 'buyerName',
  'email': 'buyerEmail',
  'invoice_name': 'billingCompany',
  'invoice_address': 'billingAddressLine1',
  'invoice_address2': 'billingAddressLine2',
  'invoice_zip_code': 'billingZip',
  'invoice_city': 'billingCity',
  'invoice_country_code': 'billingCountry',
  'invoice_phone': 'billingPhone',
  'delivery_name': 'shippingCompany',
  'delivery_address': 'shippingAddressLine1',
  'delivery_address2': 'shippingAddressLine2',
  'delivery_zip_code': 'shippingZip',
  'delivery_city': 'shippingCity',
  'delivery_country_code': 'shippingCountry',
  'delivery_phone': 'shippingPhone',
  'pricelist': 'priceListCode',
  'pricelist_code': 'priceListCode',
  // Common generic formats
  'company_name': 'companyName',
  'company': 'companyName',
  'org_number': 'vatNumber',
  'org_nr': 'vatNumber',
  'external_id': 'externalId',
  'customer_id': 'externalId',
  'contact_name': 'buyerName',
  'contact_email': 'buyerEmail',
  'billing_company': 'billingCompany',
  'billing_first_name': 'billingFirstName',
  'billing_last_name': 'billingLastName',
  'billing_address': 'billingAddressLine1',
  'billing_address_2': 'billingAddressLine2',
  'billing_zip': 'billingZip',
  'billing_postal_code': 'billingZip',
  'billing_city': 'billingCity',
  'billing_country': 'billingCountry',
  'billing_phone': 'billingPhone',
  'billing_email': 'billingEmail',
  'shipping_company': 'shippingCompany',
  'shipping_first_name': 'shippingFirstName',
  'shipping_last_name': 'shippingLastName',
  'shipping_address': 'shippingAddressLine1',
  'shipping_address_2': 'shippingAddressLine2',
  'shipping_zip': 'shippingZip',
  'shipping_postal_code': 'shippingZip',
  'shipping_city': 'shippingCity',
  'shipping_country': 'shippingCountry',
  'shipping_phone': 'shippingPhone',
  'price_list': 'priceListCode',
  'price_list_code': 'priceListCode',
};

function autoDetectMappings(headers: string[], rows: CsvRow[]): FieldMappings {
  const mappings: FieldMappings = {};
  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    const target = KNOWN_COLUMN_MAPPINGS[normalized];
    if (target) {
      if (mappings[target]) {
        // Conflict: prefer the column that has actual data in the CSV
        const existingHasData = rows.some((r) => r[mappings[target]!]?.trim());
        const newHasData = rows.some((r) => r[header]?.trim());
        if (existingHasData && !newHasData) continue;
      }
      mappings[target] = header;
    }
  }
  return mappings;
}

function getMapped(row: CsvRow, mappings: FieldMappings, field: TargetField): string {
  const col = mappings[field] || field;
  return row[col] || '';
}

export interface PriceListMapping {
  csvCode: string;
  priceListId: string;
}

export interface ImportConfig {
  channelId: string;
  fieldMappings: FieldMappings;
  priceListMappings: PriceListMapping[];
  skipPrivateIndividuals: boolean;
  duplicateStrategy: 'insert' | 'update' | 'skip';
}

export type ImportRowStatus = 'pending' | 'importing' | 'success' | 'error' | 'skipped';

export interface ImportBuyer {
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
}

export interface ImportRow {
  index: number;
  companyName: string;
  data: CsvRow;
  status: ImportRowStatus;
  errorMessage?: string;
  valid: boolean;
  validationErrors: string[];
  skipped: boolean;
  selected: boolean;
  salesRepIds: string[];
  channelIds: string[];
  priceListIds: string[];
  exVat: boolean;
  limitedProductAccess: boolean;
  buyers: ImportBuyer[];
  overrides: Partial<Record<TargetField, string>>;
}

export interface UseCompanyImportReturnType {
  currentStep: Ref<ImportStep>;
  csvHeaders: Ref<string[]>;
  csvRows: Ref<CsvRow[]>;
  importRows: Ref<ImportRow[]>;
  importConfig: Ref<ImportConfig>;
  importProgress: Ref<{ done: number; total: number; errors: number }>;
  importing: Ref<boolean>;
  parseFile: (file: File) => Promise<void>;
  validateRows: () => void;
  runImport: () => Promise<void>;
  goToStep: (step: ImportStep) => void;
  reset: () => void;
  fieldKey: (target: TargetField) => string;
  getMappedValue: (row: ImportRow, target: TargetField) => string;
}

/**
 * Trim spaces, dots, and commas from the start and end of a string.
 */
function trimChars(value: string): string {
  return value.replace(/^[\s.,]+|[\s.,]+$/g, '');
}

function splitName(fullNameStr: string): { firstName: string; lastName: string } {
  const parts = fullNameStr.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  const lastName = parts.pop() || '';
  return { firstName: parts.join(' '), lastName };
}

function buildAddress(
  row: CsvRow,
  mappings: FieldMappings,
  type: 'billing' | 'shipping',
  addressType?: 'billing' | 'shipping',
  overrides?: Partial<Record<TargetField, string>>,
): AddressCreate | null {
  const get = (field: TargetField) => {
    if (overrides && field in overrides) return overrides[field] || '';
    return getMapped(row, mappings, field);
  };

  let company: string, firstName: string, lastName: string;
  let line1: string, line2: string, zip: string, city: string, country: string;
  let phone: string, email: string;

  if (type === 'billing') {
    company = get('billingCompany');
    firstName = get('billingFirstName');
    lastName = get('billingLastName');
    line1 = get('billingAddressLine1');
    line2 = get('billingAddressLine2');
    zip = get('billingZip');
    city = get('billingCity');
    country = get('billingCountry');
    phone = get('billingPhone');
    email = get('billingEmail') || get('buyerEmail');
  } else {
    company = get('shippingCompany');
    firstName = get('shippingFirstName');
    lastName = get('shippingLastName');
    line1 = get('shippingAddressLine1');
    line2 = get('shippingAddressLine2');
    zip = get('shippingZip');
    city = get('shippingCity');
    country = get('shippingCountry');
    phone = get('shippingPhone');
    email = '';
  }

  // Only create address if at least one meaningful field is populated
  if (!line1 && !zip && !city) {
    return null;
  }

  const address: AddressCreate = {
    firstName: firstName || '-',
    lastName: lastName || '-',
    addressLine1: line1,
    addressLine2: line2 || undefined,
    zip,
    city,
    country,
    phone: phone || undefined,
    company: company || undefined,
    email: email || undefined,
  };

  if (addressType) {
    address.addressType = addressType;
  }

  return address;
}

function buildCompanyPayload(
  row: ImportRow,
  config: ImportConfig,
): CustomerCompanyCreate {
  const overrides = row.overrides;
  const get = (field: TargetField) => {
    if (overrides && field in overrides) return overrides[field] || '';
    return getMapped(row.data, config.fieldMappings, field);
  };
  const addresses: AddressCreate[] = [];

  const billingAddr = buildAddress(row.data, config.fieldMappings, 'billing', 'billing', overrides);
  const shippingAddr = buildAddress(row.data, config.fieldMappings, 'shipping', 'shipping', overrides);

  if (billingAddr) {
    billingAddr.addressType = shippingAddr ? 'billing' : 'billingandshipping';
    addresses.push(billingAddr);
  }
  if (shippingAddr) addresses.push(shippingAddr);

  const priceLists: string[] = [...row.priceListIds];
  const priceListCode = get('priceListCode');
  if (priceListCode) {
    const mapping = config.priceListMappings.find((m) => m.csvCode === priceListCode);
    if (mapping && mapping.priceListId && !priceLists.includes(mapping.priceListId)) {
      priceLists.push(mapping.priceListId);
    }
  }

  const activeValue = get('active');

  return {
    name: get('companyName'),
    active: activeValue ? activeValue !== '0' : true,
    vatNumber: get('vatNumber') || undefined as unknown as string,
    externalId: get('externalId') || '',
    channels: row.channelIds.length > 0 ? row.channelIds : (config.channelId ? [config.channelId] : []),
    tags: [],
    exVat: row.exVat,
    limitedProductAccess: row.limitedProductAccess,
    buyers: [],
    addresses,
    salesReps: [...row.salesRepIds],
    priceLists,
  };
}

function getMappedPriceListIds(row: CsvRow, config: ImportConfig): string[] {
  const ids: string[] = [];
  const priceListCode = getMapped(row, config.fieldMappings, 'priceListCode');
  if (priceListCode) {
    const mapping = config.priceListMappings.find((m) => m.csvCode === priceListCode);
    if (mapping && mapping.priceListId) {
      ids.push(mapping.priceListId);
    }
  }
  return ids;
}

function validateRow(row: CsvRow, config: ImportConfig): string[] {
  const errors: string[] = [];
  if (!getMapped(row, config.fieldMappings, 'companyName').trim()) {
    errors.push('Missing company name');
  }
  if (!config.channelId) {
    errors.push('No channel selected');
  }
  return errors;
}

export function useCompanyImport(): UseCompanyImportReturnType {
  const { customerApi } = useGeinsRepository();
  const { geinsLog, geinsLogError } = useGeinsLog('composables/useCompanyImport');

  const currentStep = ref<ImportStep>('upload');
  const csvHeaders = ref<string[]>([]);
  const csvRows = ref<CsvRow[]>([]);
  const importRows = ref<ImportRow[]>([]);
  const importing = ref(false);

  const importConfig = ref<ImportConfig>({
    channelId: '',
    fieldMappings: {},
    priceListMappings: [],
    skipPrivateIndividuals: true,
    duplicateStrategy: 'insert',
  });

  const importProgress = ref({
    done: 0,
    total: 0,
    errors: 0,
  });

  async function parseFile(file: File): Promise<void> {
    const text = await file.text();
    const { headers, rows } = parseCsv(text);
    csvHeaders.value = headers;

    // Trim spaces, dots, commas from all imported values
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        const val = row[key];
        if (val) row[key] = trimChars(val);
      }
    }
    csvRows.value = rows;

    // Auto-detect field mappings from CSV column names
    importConfig.value.fieldMappings = autoDetectMappings(headers, rows);

    // Extract unique pricelist codes for mapping
    const codes = new Set<string>();
    const plCol = importConfig.value.fieldMappings.priceListCode;
    if (plCol) {
      for (const row of rows) {
        const code = row[plCol];
        if (code) codes.add(code);
      }
    }
    importConfig.value.priceListMappings = Array.from(codes).map((code) => ({
      csvCode: code,
      priceListId: '',
    }));

    const mappedCount = Object.values(importConfig.value.fieldMappings).filter(Boolean).length;
    geinsLog(`Parsed CSV: ${headers.length} columns, ${rows.length} rows, ${mappedCount} fields auto-detected`);
  }

  function validateRows(): void {
    const mappings = importConfig.value.fieldMappings;
    importRows.value = csvRows.value.map((row, index) => {
      const customerType = getMapped(row, mappings, 'customerType');
      const isPrivate = customerType === 'private';
      const skipped = isPrivate && importConfig.value.skipPrivateIndividuals;
      const validationErrors = skipped ? [] : validateRow(row, importConfig.value);

      // Pre-populate billing address contact name from buyer name
      const buyerName = getMapped(row, mappings, 'buyerName');
      if (buyerName && buyerName.trim()) {
        const { firstName, lastName } = splitName(buyerName);
        const fnKey = mappings.billingFirstName || 'billingFirstName';
        const lnKey = mappings.billingLastName || 'billingLastName';
        if (!row[fnKey]) row[fnKey] = firstName;
        if (!row[lnKey]) row[lnKey] = lastName;
      }

      // Build initial buyer from CSV data
      const buyersList: ImportBuyer[] = [];
      if (buyerName && buyerName.trim()) {
        const { firstName, lastName } = splitName(buyerName);
        const buyerEmail = getMapped(row, mappings, 'buyerEmail');
        buyersList.push({
          firstName,
          lastName,
          email: buyerEmail,
          active: true,
        });
      }

      // Initialize per-field overrides from mapped values (decouples edits from shared CSV data)
      const overrides: Partial<Record<TargetField, string>> = {};
      for (const def of TARGET_FIELD_DEFS) {
        overrides[def.key] = getMapped(row, mappings, def.key);
      }

      return {
        index,
        companyName: getMapped(row, mappings, 'companyName') || `Row ${index + 1}`,
        data: row,
        status: skipped ? 'skipped' as ImportRowStatus : 'pending' as ImportRowStatus,
        valid: validationErrors.length === 0,
        validationErrors,
        skipped,
        selected: !skipped && validationErrors.length === 0,
        salesRepIds: [],
        channelIds: importConfig.value.channelId ? [importConfig.value.channelId] : [],
        priceListIds: getMappedPriceListIds(row, importConfig.value),
        exVat: false,
        limitedProductAccess: false,
        buyers: buyersList,
        overrides,
      };
    });
  }

  async function runImport(): Promise<void> {
    importing.value = true;
    const rowsToImport = importRows.value.filter((r) => r.selected && !r.skipped);
    importProgress.value = { done: 0, total: rowsToImport.length, errors: 0 };

    // Build VAT → company ID map for duplicate detection
    const existingCompanies = new Map<string, string>();
    if (importConfig.value.duplicateStrategy !== 'insert') {
      try {
        const companies = await customerApi.company.list();
        for (const company of companies) {
          if (company.vatNumber) {
            existingCompanies.set(company.vatNumber, company._id);
          }
        }
        geinsLog(`Fetched ${existingCompanies.size} existing companies for duplicate detection`);
      } catch (err) {
        geinsLogError('Failed to fetch existing companies for duplicate detection', err);
      }
    }

    for (const row of rowsToImport) {
      row.status = 'importing';

      try {
        const payload = buildCompanyPayload(row, importConfig.value);
        const vatNumber = payload.vatNumber;
        const existingId = vatNumber ? existingCompanies.get(vatNumber) : undefined;

        if (existingId && importConfig.value.duplicateStrategy === 'skip') {
          row.status = 'skipped';
          row.errorMessage = 'Skipped — company already exists';
          importProgress.value.done++;
          continue;
        }

        if (existingId && importConfig.value.duplicateStrategy === 'update') {
          geinsLog(`Updating existing company "${row.companyName}" (${existingId})`, payload);
          const updatePayload: CustomerCompanyUpdate = {
            name: payload.name,
            active: payload.active,
            vatNumber: payload.vatNumber,
            externalId: payload.externalId,
            channels: payload.channels,
            tags: payload.tags,
            exVat: payload.exVat,
            limitedProductAccess: payload.limitedProductAccess,
            addresses: payload.addresses,
            salesReps: payload.salesReps,
            priceLists: payload.priceLists,
          };
          await customerApi.company.update(existingId, updatePayload);
          row.status = 'success';
        } else {
          geinsLog(`Creating company "${row.companyName}"`, payload);
          const created = await customerApi.company.create(payload);

          // Create buyers as separate API calls
          const buyersToCreate = row.buyers.filter((b) => b.email);
          for (const buyer of buyersToCreate) {
            try {
              await customerApi.company.id(created._id).buyer.create({
                _id: buyer.email,
                firstName: buyer.firstName,
                lastName: buyer.lastName,
                email: buyer.email,
                active: buyer.active,
                accountId: created._id,
              });
            } catch (buyerErr: unknown) {
              geinsLogError(`Failed to create buyer for "${row.companyName}"`, buyerErr);
              row.errorMessage = `Company created, but buyer "${buyer.firstName} ${buyer.lastName}" failed`;
            }
          }

          row.status = 'success';
        }
      } catch (err: unknown) {
        row.status = 'error';
        const apiErr = err as { message?: string; status?: number; originalError?: unknown };
        let errorMsg = apiErr.message || String(err);
        if (apiErr.status === 422 && apiErr.originalError) {
          const detail = typeof apiErr.originalError === 'string'
            ? apiErr.originalError
            : JSON.stringify(apiErr.originalError);
          errorMsg = `${errorMsg} — ${detail}`;
        }
        row.errorMessage = errorMsg;
        importProgress.value.errors++;
        geinsLogError(`Failed to import "${row.companyName}"`, err);
      }

      importProgress.value.done++;
    }

    importing.value = false;
  }

  function goToStep(step: ImportStep): void {
    if (step === 'preview') {
      validateRows();
    }
    currentStep.value = step;
  }

  function reset(): void {
    currentStep.value = 'upload';
    csvHeaders.value = [];
    csvRows.value = [];
    importRows.value = [];
    importing.value = false;
    importConfig.value = {
      channelId: '',
      fieldMappings: {},
      priceListMappings: [],
      skipPrivateIndividuals: true,
      duplicateStrategy: 'insert',
    };
    importProgress.value = { done: 0, total: 0, errors: 0 };
  }

  function fieldKey(target: TargetField): string {
    return importConfig.value.fieldMappings[target] || target;
  }

  function getMappedValue(importRow: ImportRow, target: TargetField): string {
    const override = importRow.overrides?.[target];
    if (override !== undefined) return override;
    return getMapped(importRow.data, importConfig.value.fieldMappings, target);
  }

  return {
    currentStep,
    csvHeaders,
    csvRows,
    importRows,
    importConfig,
    importProgress,
    importing,
    parseFile,
    validateRows,
    runImport,
    goToStep,
    reset,
    fieldKey,
    getMappedValue,
  };
}
