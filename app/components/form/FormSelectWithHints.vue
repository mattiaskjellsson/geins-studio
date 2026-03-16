<script setup lang="ts">
import {
  SelectItem as RekaSelectItem,
  SelectItemIndicator,
  SelectItemText,
} from 'reka-ui';

export interface SelectHintOption {
  value: string;
  label: string;
  summary?: string;
}

const CLEAR_VALUE = '__clear__';

const modelValue = defineModel<string>({ default: '' });

defineProps<{
  options: SelectHintOption[];
  placeholder?: string;
  class?: string;
}>();

function onValueChange(value: string) {
  modelValue.value = value === CLEAR_VALUE ? '' : value;
}
</script>

<template>
  <Select :model-value="modelValue || undefined" @update:model-value="onValueChange">
    <SelectTrigger :class="$props.class">
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <SelectContent class="max-h-80">
      <SelectItem v-if="placeholder" :value="CLEAR_VALUE">
        {{ placeholder }}
      </SelectItem>
      <RekaSelectItem
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50"
      >
        <span class="absolute right-2 flex size-3.5 items-center justify-center">
          <SelectItemIndicator>
            <LucideCheck class="size-4" />
          </SelectItemIndicator>
        </span>
        <div>
          <SelectItemText>{{ option.label }}</SelectItemText>
          <p
            v-if="option.summary"
            class="text-muted-foreground/50 mt-0.5 text-[10px] italic"
          >
            {{ option.summary }}
          </p>
        </div>
      </RekaSelectItem>
    </SelectContent>
  </Select>
</template>
