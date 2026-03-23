import type React from 'react';

import {
  AsteriskIcon,
  BracketsAngleIcon,
  CalendarIcon,
  ClockCounterClockwiseIcon,
  EyeIcon,
  FunctionIcon,
  GitBranchIcon,
  MagicWandIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  SpinnerGapIcon,
  ToggleLeftIcon,
} from '@phosphor-icons/react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';

import type { FieldDef, RenderItem } from '@/components/form/field-def';

import { FormBuilder } from '@/components/form/form-builder';
import { FormErrorSummary } from '@/components/form/form-error-summary';
import { Button } from '@/components/ui/button';
import { useFieldForm } from '@/hooks/use-field-form';

export const Route = createFileRoute('/demo')({
  component: DemoPage,
});

const TAKEN_HANDLES = new Set(['taken', 'admin', 'root', 'support']);

async function checkHandleAvailable({ value }: { value: unknown }) {
  const v = (value as string) ?? '';
  if (!v) return undefined;
  await new Promise((r) => setTimeout(r, 600));
  return TAKEN_HANDLES.has(v.toLowerCase())
    ? `"${v}" is already taken`
    : undefined;
}

const fields: (FieldDef | RenderItem)[] = [
  // Plain required — built-in check only
  {
    name: 'firstName',
    label: 'First name',
    placeholder: 'Jane',
    required: true,
  },
  {
    name: 'lastName',
    label: 'Last name',
    placeholder: 'Smith',
    required: true,
  },

  // required + custom onChange — both compose; required fires first
  {
    name: 'email',
    type: 'email',
    label: 'Email address',
    placeholder: 'jane@example.com',
    required: true,
    validators: {
      onChange: ({ value }) => {
        const v = value as string;
        return v.length > 0 && !v.includes('@')
          ? 'Must be a valid email address'
          : undefined;
      },
    },
  },

  // custom onBlur only — validated when leaving the field
  {
    name: 'username',
    label: 'Username',
    placeholder: 'jane_smith',
    hint: 'Validated on blur — 3–20 characters, letters and underscores only.',
    validators: {
      onBlur: ({ value }) => {
        const v = value as string;
        if (!v) return undefined; // not required, skip if empty
        if (v.length < 3) return 'At least 3 characters';
        if (v.length > 20) return 'At most 20 characters';
        if (!/^[a-z_]+$/i.test(v)) return 'Letters and underscores only';
        return undefined;
      },
    },
  },

  // Async validation — simulated server availability check
  {
    name: 'handle',
    label: 'Handle',
    placeholder: 'your_handle',
    hint: 'Availability checked async — try "taken", "admin", or "root".',
    validators: {
      onChangeAsync: checkHandleAvailable,
      onSubmitAsync: checkHandleAvailable,
    },
  },

  // required + custom onBlur — required on change, format on blur
  {
    name: 'website',
    label: 'Website',
    placeholder: 'https://example.com',
    required: true,
    validators: {
      onBlur: ({ value }) => {
        const v = value as string;
        if (!v) return undefined; // required handles the empty case on change
        try {
          new URL(v);
          return undefined;
        } catch {
          return 'Must be a valid URL (include https://)';
        }
      },
    },
  },

  {
    name: 'bio',
    type: 'textarea',
    label: 'Bio',
    placeholder: 'Tell us a little about yourself…',
    hint: 'Optional. Max 280 characters.',
    validators: {
      onChange: ({ value }) => {
        const v = value as string;
        return v.length > 280 ? `${v.length}/280 — too long` : undefined;
      },
    },
  },

  // Purely presentational — no field, no name required
  {
    render: () => (
      <div className="border-t pt-4">
        <p className="text-sm font-medium">Contact preferences</p>
        <p className="text-xs text-muted-foreground">
          How should we reach you?
        </p>
      </div>
    ),
  },

  // ≤ 6 options → radio (auto-resolved)
  {
    name: 'contactMethod',
    label: 'Preferred contact method',
    options: ['Email', 'Phone', 'Post'],
    defaultValue: 'Email',
  },

  // Conditional fields
  {
    name: 'contactEmail',
    type: 'email',
    label: 'Contact email',
    placeholder: 'jane@example.com',
    required: true,
    condition: { name: 'contactMethod', value: 'Email' },
    validators: {
      onBlur: ({ value }) => {
        const v = value as string;
        return v.length > 0 && !v.includes('@')
          ? 'Must be a valid email address'
          : undefined;
      },
    },
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone number',
    placeholder: '+1 555 000 0000',
    required: true,
    condition: { name: 'contactMethod', value: 'Phone' },
  },
  {
    name: 'address',
    type: 'textarea',
    label: 'Mailing address',
    placeholder: '123 Main St…',
    required: true,
    condition: { name: 'contactMethod', value: 'Post' },
  },

  // Custom form.AppField inline — full TanStack Form API, no DynamicField
  {
    render: (form) => (
      <form.AppField
        name="displayName"
        validators={{
          onChange: ({ value }: { value: string }) => {
            return value?.length > 0 && value.length < 2
              ? 'At least 2 characters'
              : undefined;
          },
        }}
      >
        {(field: {
          TextField: (p: {
            label: string;
            placeholder?: string;
            hint?: string;
          }) => React.ReactNode;
        }) => (
          <field.TextField
            label="Display name"
            placeholder="jane_smith"
            hint="Custom render — direct form.AppField, bypasses DynamicField entirely."
          />
        )}
      </form.AppField>
    ),
  },

  // > 6 options → select (auto-resolved)
  {
    name: 'country',
    label: 'Country',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'gb', label: 'United Kingdom' },
      { value: 'au', label: 'Australia' },
      { value: 'nz', label: 'New Zealand' },
      { value: 'de', label: 'Germany' },
      { value: 'fr', label: 'France' },
    ],
    hint: '7 options → auto-promoted to select (above threshold of 6).',
  },

  // multiple + > 6 options → multi-select (auto-resolved)
  {
    name: 'languages',
    label: 'Languages spoken',
    multiple: true,
    options: [
      { value: 'en', label: 'English' },
      { value: 'es', label: 'Spanish' },
      { value: 'fr', label: 'French' },
      { value: 'de', label: 'German' },
      { value: 'zh', label: 'Chinese' },
      { value: 'ja', label: 'Japanese' },
      { value: 'pt', label: 'Portuguese' },
    ],
    hint: '7 options + multiple: true → multi-select (above threshold of 6).',
  },

  // Function options — simulates queried/dynamic options (e.g. from useQuery).
  // DynamicField calls the function at the component's top level, so hooks
  // (TanStack Query, etc.) can be called freely inside it.
  {
    name: 'tags',
    label: 'Tags',
    multiple: true,
    defaultValue: [] as string[],
    hint: 'Options via function — in a real app this would call useQuery inside the function.',
    options: () => [
      { value: 'friendly', label: 'Friendly' },
      { value: 'playful', label: 'Playful' },
      { value: 'outdoor', label: 'Outdoor' },
      { value: 'indoor', label: 'Indoor' },
      { value: 'trained', label: 'Trained' },
    ],
  },

  // multiple + ≤ 6 options → checkbox group
  {
    name: 'interests',
    label: 'Interests',
    multiple: true,
    options: ['Sports', 'Music', 'Travel', 'Food', 'Technology'],
    hint: '5 options + multiple: true → checkbox group (at or below threshold of 6).',
  },

  // Date picker
  {
    render: () => (
      <div className="border-t pt-4">
        <p className="text-sm font-medium">Scheduling</p>
      </div>
    ),
  },
  {
    name: 'startDate',
    type: 'date',
    label: 'Start date',
    required: true,
  },
  {
    name: 'endDate',
    type: 'date',
    label: 'End date',
    hint: 'Optional end date.',
  },

  {
    render: () => (
      <div className="border-t pt-4">
        <p className="text-sm font-medium">Selection controls</p>
      </div>
    ),
  },

  // Switch — boolean toggle
  {
    name: 'notifications',
    type: 'switch',
    label: 'Enable notifications',
    hint: 'Boolean toggle — auto-inferred from ZodBoolean, or set explicitly with type: switch.',
    defaultValue: false,
  },

  // Single combobox — searchable single select (explicit type)
  {
    name: 'timezone',
    type: 'combobox',
    label: 'Timezone',
    hint: 'Explicit type: combobox — searchable single select with clear button.',
    options: [
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
      { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
      { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
      { value: 'Europe/Paris', label: 'Central European Time (CET)' },
      { value: 'Europe/Helsinki', label: 'Eastern European Time (EET)' },
      { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
      { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
      { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)' },
      { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
      { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
      { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
      { value: 'Pacific/Auckland', label: 'New Zealand Time (NZT)' },
    ],
  },

  // Multi combobox — chips (explicit type + multiple)
  {
    name: 'skills',
    type: 'combobox',
    multiple: true,
    label: 'Skills',
    hint: 'combobox + multiple: true → chip multi-select with search.',
    defaultValue: [] as string[],
    options: [
      { value: 'react', label: 'React' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'node', label: 'Node.js' },
      { value: 'python', label: 'Python' },
      { value: 'graphql', label: 'GraphQL' },
      { value: 'postgres', label: 'PostgreSQL' },
      { value: 'docker', label: 'Docker' },
      { value: 'kubernetes', label: 'Kubernetes' },
      { value: 'rust', label: 'Rust' },
      { value: 'go', label: 'Go' },
    ],
  },
];

function FeatureCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ElementType;
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <Icon
        size={15}
        weight="duotone"
        className="mt-0.5 shrink-0 text-muted-foreground"
      />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium">{title}</span>
          <span className="rounded-sm bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
            {badge}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

function DemoPage() {
  const form = useFieldForm({
    fields,
    onSubmit: ({ value }) => {
      toast.success('Submitted!', {
        description: (
          <pre className="mt-1 max-w-xs overflow-auto text-xs text-foreground">
            {JSON.stringify(value, null, 2)}
          </pre>
        ),
      });
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">FormBuilder demo</h1>
        <p className="mt-1 text-muted-foreground">
          All fields declared as a <code>FieldDef[]</code> array. Control types
          resolve automatically; validators compose with the built-in required
          check.
        </p>
      </div>

      <div className="flex gap-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="min-w-0 flex-1 space-y-6"
        >
          <FormErrorSummary form={form} fields={fields} />
          <FormBuilder form={form} fields={fields} />
          <Button type="submit">Submit</Button>
        </form>

        <aside className="w-64 shrink-0 space-y-1.5">
          <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Features used
          </p>
          <FeatureCard icon={AsteriskIcon} title="required" badge="built-in">
            First / last name — empty check on every change.
          </FeatureCard>
          <FeatureCard
            icon={PencilSimpleIcon}
            title="onChange"
            badge="validators.onChange"
          >
            Email — required fires first, format check runs after.
          </FeatureCard>
          <FeatureCard icon={EyeIcon} title="onBlur" badge="validators.onBlur">
            Username — pattern checked only after leaving the field.
          </FeatureCard>
          <FeatureCard
            icon={SpinnerGapIcon}
            title="onChangeAsync"
            badge="validators.onChangeAsync"
          >
            Handle — availability checked against a simulated server call.
            Debounced 300ms automatically.
          </FeatureCard>
          <FeatureCard
            icon={GitBranchIcon}
            title="Conditional"
            badge="field.condition"
          >
            Contact details shown based on selected method. Hidden fields never
            block submission.
          </FeatureCard>
          <FeatureCard
            icon={FunctionIcon}
            title="Function options"
            badge="options: () => FieldOption[]"
          >
            Tags — options resolved at render time, safe to call hooks (e.g.{' '}
            <code className="text-[10px]">useQuery</code>) inside.
          </FeatureCard>
          <FeatureCard
            icon={MagicWandIcon}
            title="Auto type resolution"
            badge="options · multiple · threshold"
          >
            Radio, select, checkbox group, and multi-select inferred from
            options count and <code className="text-[10px]">multiple</code>.
          </FeatureCard>
          <FeatureCard
            icon={ClockCounterClockwiseIcon}
            title="defaultValue"
            badge="field.defaultValue"
          >
            Fields are the single source of truth — no separate{' '}
            <code className="text-[10px]">defaultValues</code> object.
          </FeatureCard>
          <FeatureCard
            icon={BracketsAngleIcon}
            title="render"
            badge="RenderItem"
          >
            Mix presentational content and custom{' '}
            <code className="text-[10px]">form.AppField</code> renders inline
            without splitting the array.
          </FeatureCard>
          <FeatureCard
            icon={CalendarIcon}
            title="Date picker"
            badge="type: 'date'"
          >
            Calendar popover — value stored as ISO date string. Validates and
            composes with required like any other field.
          </FeatureCard>
          <FeatureCard
            icon={ToggleLeftIcon}
            title="Switch"
            badge="type: 'switch'"
          >
            Boolean toggle — horizontal layout with label and hint.
            Auto-inferred from <code className="text-[10px]">ZodBoolean</code>.
          </FeatureCard>
          <FeatureCard
            icon={MagnifyingGlassIcon}
            title="Combobox"
            badge="type: 'combobox'"
          >
            Searchable single select with clear, and chip multi-select when{' '}
            <code className="text-[10px]">multiple: true</code>. Auto-promoted
            above <code className="text-[10px]">comboboxThreshold</code>.
          </FeatureCard>
        </aside>
      </div>
    </div>
  );
}
