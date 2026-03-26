import React from 'react';

import {
  ArrowRightIcon,
  ArrowDownIcon,
  CodeIcon,
  TableIcon,
  ClipboardTextIcon,
  GearIcon,
  FileCodeIcon,
  MagicWandIcon,
  TextTIcon,
  RadioButtonIcon,
  ListIcon,
  MagnifyingGlassIcon,
  CheckSquareIcon,
  SelectionAllIcon,
  TagIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';

import { petstoreClient } from '@/api/petstore/client';
import { findPetsByStatusOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { CodeBlock } from '@/components/code-block';
import { DataTable } from '@/components/data-table/data-table';
import { zodToColumns } from '@/components/data-table/zod-to-columns';
import { FormBuilder } from '@/components/form/form-builder';
import { zodToFields } from '@/components/form/zod-to-fields';
import { useFieldForm } from '@/hooks/use-field-form';

export const Route = createFileRoute('/pipeline')({
  component: PipelinePage,
});

// ---------------------------------------------------------------------------
// Live demo data
// ---------------------------------------------------------------------------

const demoColumns = zodToColumns(zPet, {
  id: { header: 'ID' },
  category: {
    header: 'Category',
    cell: ({ row }) =>
      (row.original as { category?: { name?: string } }).category?.name ?? (
        <span className="text-muted-foreground/40">—</span>
      ),
  },
  photoUrls: false,
});

const demoFields = zodToFields(zPet, {
  id: { skip: true },
  photoUrls: { skip: true },
  tags: { skip: true },
  category: { skip: true },
  name: { placeholder: 'Fluffy', label: 'Pet name' },
  status: { required: true, defaultValue: 'available' },
});

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const snippets = {
  config: `// openapi-ts.config.ts
{
  input: 'https://petstore3.swagger.io/api/v3/openapi.json',
  output: { path: 'src/api/petstore/generated', clean: true },
  plugins: [
    '@hey-api/typescript',   // → types.gen.ts
    'zod',                   // → zod.gen.ts
    '@tanstack/react-query', // → @tanstack/react-query.gen.ts
    '@hey-api/client-fetch',
  ],
}`,

  zod: `// src/api/petstore/generated/zod.gen.ts  ← auto-generated, never hand-edited
export const zPet = z.object({
  id:        z.coerce.bigint().optional(),
  name:      z.string(),
  category:  zCategory.optional(),   // nested object
  photoUrls: z.array(z.string()),
  tags:      z.array(zTag).optional(),
  status:    z.enum(['available', 'pending', 'sold']).optional(),
});`,

  table: `import { zodToColumns } from '@/components/data-table/zod-to-columns';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { DataTable } from '@/components/data-table/data-table';

// Infers: id→mono, name→text, tags→badges, status→badge
// category is a ZodObject → skipped unless overridden
const columns = zodToColumns(zPet, {
  id:        { header: 'ID' },
  photoUrls: false,                    // hide column
  category: {                          // override nested object
    header: 'Category',
    cell: ({ row }) => row.original.category?.name ?? '—',
  },
});

<DataTable columns={columns} data={pets} isLoading={isLoading} />`,

  resolveType: `// dynamic-field.tsx — runs once per field render
function resolveType(field, options, threshold, comboboxThreshold) {
  if (field.type) return field.type;           // explicit always wins
  if (field.options) {
    if (options.length > comboboxThreshold)    // default: threshold × 4
      return 'combobox';
    if (options.length > threshold)            // default: 6
      return 'select';
    return field.multiple ? 'checkbox' : 'radio';
  }
  return 'text';
}`,

  form: `import { zodToFields } from '@/components/form/zod-to-fields';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { FormBuilder } from '@/components/form/form-builder';
import { useFieldForm } from '@/hooks/use-field-form';

// Infers: name→text, status→radio/select, photoUrls→repeater, tags→repeater
const fields = zodToFields(zPet, {
  id:        { skip: true },  // server-generated
  category:  { skip: true },
  name:      { placeholder: 'Fluffy', label: 'Pet name' },
  status:    { required: true, defaultValue: 'available' },
});

const form = useFieldForm({
  fields,
  onSubmit: async ({ value }) => { /* submit */ },
});

<FormBuilder form={form} fields={fields} />`,
};

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {n}
    </div>
  );
}

function SectionArrow() {
  return (
    <div className="flex justify-center py-2 text-muted-foreground/50">
      <ArrowDownIcon className="size-5" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline diagram
// ---------------------------------------------------------------------------

type PipelineNode = {
  icon: React.ElementType;
  label: string;
  sub: string;
  accent?: boolean;
};

const pipelineNodes: PipelineNode[] = [
  {
    icon: FileCodeIcon,
    label: 'OpenAPI Spec',
    sub: 'YAML / JSON',
  },
  {
    icon: GearIcon,
    label: 'api:generate',
    sub: 'Hey API v0.94',
  },
  {
    icon: CodeIcon,
    label: 'Zod · Types · Queries',
    sub: 'Generated artifacts',
  },
  {
    icon: MagicWandIcon,
    label: 'zodToColumns / zodToFields',
    sub: 'Two utility functions',
    accent: true,
  },
  {
    icon: TableIcon,
    label: 'DataTable · FormBuilder',
    sub: 'Live UI, no boilerplate',
    accent: true,
  },
];

function PipelineDiagram() {
  return (
    <div className="@container rounded-xl border bg-muted/20 p-6">
      {/* Vertical — small containers */}
      <div className="flex flex-col items-center gap-1 @[640px]:hidden">
        {pipelineNodes.map((node, i) => (
          <div key={i} className="flex w-full flex-col items-center gap-1">
            <div
              className={`flex w-full max-w-xs items-center gap-3 rounded-lg border p-3 ${node.accent ? 'border-primary/30 bg-primary/5' : 'bg-background'}`}
            >
              <node.icon
                className={`size-5 shrink-0 ${node.accent ? 'text-primary' : 'text-muted-foreground'}`}
                weight="duotone"
              />
              <div>
                <p
                  className={`text-sm font-medium ${node.accent ? 'text-primary' : ''}`}
                >
                  {node.label}
                </p>
                <p className="text-xs text-muted-foreground">{node.sub}</p>
              </div>
            </div>
            {i < pipelineNodes.length - 1 && (
              <ArrowDownIcon className="size-4 text-muted-foreground/40" />
            )}
          </div>
        ))}
      </div>

      {/* Horizontal — wide containers */}
      <div className="hidden items-center gap-2 @[640px]:flex">
        {pipelineNodes.map((node, i) => (
          <div key={i} className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg border p-3 text-center ${node.accent ? 'border-primary/30 bg-primary/5' : 'bg-background'}`}
            >
              <node.icon
                className={`size-5 shrink-0 ${node.accent ? 'text-primary' : 'text-muted-foreground'}`}
                weight="duotone"
              />
              <div>
                <p
                  className={`text-xs leading-snug font-medium ${node.accent ? 'text-primary' : ''}`}
                >
                  {node.label}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {node.sub}
                </p>
              </div>
            </div>
            {i < pipelineNodes.length - 1 && (
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground/40" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step cards
// ---------------------------------------------------------------------------

function Step1() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StepNumber n={1} />
        <div>
          <h2 className="text-lg font-semibold">Point at your spec</h2>
          <p className="text-sm text-muted-foreground">
            Drop a URL (or local file path) into{' '}
            <Chip>openapi-ts.config.ts</Chip> and pick your plugins. One command
            does the rest.
          </p>
        </div>
      </div>
      <CodeBlock code={snippets.config} />
      <p className="text-sm text-muted-foreground">
        Run <Chip>npm run api:generate</Chip> — the entire{' '}
        <Chip>src/api/&lt;name&gt;/generated/</Chip> directory is wiped and
        regenerated. Commit the config, gitignore the output.
      </p>
    </div>
  );
}

function Step2() {
  const files = [
    {
      name: 'types.gen.ts',
      desc: 'TypeScript interfaces for every schema in the spec.',
    },
    {
      name: 'zod.gen.ts',
      desc: 'Zod schemas mirroring the same shapes — the bridge to your UI.',
    },
    {
      name: '@tanstack/react-query.gen.ts',
      desc: 'Ready-made query/mutation option factories wired to the fetch client.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StepNumber n={2} />
        <div>
          <h2 className="text-lg font-semibold">Three generated files</h2>
          <p className="text-sm text-muted-foreground">
            Hey API writes three files per API. Never hand-edit them — they are
            regenerated on every <Chip>api:generate</Chip> run.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {files.map((f) => (
          <div key={f.name} className="rounded-lg border bg-muted/20 p-3">
            <p className="font-mono text-[11px] font-medium text-primary">
              {f.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        The Zod schema for the Petstore <Chip>Pet</Chip> model looks like this:
      </p>
      <CodeBlock code={snippets.zod} />
    </div>
  );
}

function Step3() {
  const { data, isLoading } = useQuery(
    findPetsByStatusOptions({
      client: petstoreClient,
      query: { status: 'available' },
    }),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StepNumber n={3} />
        <div>
          <h2 className="text-lg font-semibold">
            <Chip>zodToColumns()</Chip> → DataTable
          </h2>
          <p className="text-sm text-muted-foreground">
            Pass the Zod schema and optional per-column overrides. Column types,
            headers, sorting, and cell renderers are all inferred.
          </p>
        </div>
      </div>

      <CodeBlock code={snippets.table} />

      <div className="rounded-xl border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <TableIcon
            className="size-4 text-muted-foreground"
            weight="duotone"
          />
          <span className="text-sm font-medium">Live output</span>
          <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            petstore · available
          </span>
        </div>
        <div className="p-4">
          <DataTable
            columns={demoColumns}
            data={(data ?? []).slice(0, 5)}
            isLoading={isLoading}
            skeletonRows={5}
          />
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ['text', 'z.string()'],
            ['mono', 'z.bigint()'],
            ['badge', 'z.enum([…])'],
            ['badges', 'z.array(…)'],
            ['number', 'z.number()'],
            ['boolean', 'z.boolean()'],
            ['date', 'z.string().date()'],
            ['custom', 'cell: fn'],
          ] as const
        ).map(([type, zod]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
              {type}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {zod}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step4() {
  const form = useFieldForm({
    fields: demoFields,
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StepNumber n={4} />
        <div>
          <h2 className="text-lg font-semibold">
            <Chip>zodToFields()</Chip> → FormBuilder
          </h2>
          <p className="text-sm text-muted-foreground">
            Same schema, different direction. Control types, validators, default
            values, and labels are all inferred. Skip or override anything.
          </p>
        </div>
      </div>

      <CodeBlock code={snippets.form} />

      <div className="rounded-xl border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <ClipboardTextIcon
            className="size-4 text-muted-foreground"
            weight="duotone"
          />
          <span className="text-sm font-medium">Live output</span>
          <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            zodToFields(zPet, overrides)
          </span>
        </div>
        <div className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="max-w-sm space-y-4"
          >
            <FormBuilder form={form} fields={demoFields} />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ['text', 'z.string()'],
            ['email', 'z.string().email()'],
            ['number', 'z.number()'],
            ['switch', 'z.boolean()'],
            ['radio/select', 'z.enum([…])'],
            ['repeater', 'z.array(…)'],
            ['group', 'z.object(…)'],
            ['hidden', 'z.bigint()'],
          ] as const
        ).map(([type, zod]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary">
              {type}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {zod}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4b — DynamicField resolution matrix
// ---------------------------------------------------------------------------

type ControlRow = {
  zone: string;
  zoneClass: string;
  count: string;
  single: { icon: React.ElementType; label: string };
  multiple: { icon: React.ElementType; label: string };
};

const controlRows: ControlRow[] = [
  {
    zone: 'no options',
    zoneClass: 'bg-muted/30',
    count: '—',
    single: { icon: TextTIcon, label: 'text input' },
    multiple: { icon: ListIcon, label: 'repeater (text[ ])' },
  },
  {
    zone: '≤ threshold',
    zoneClass: 'bg-primary/5',
    count: '1 – 6',
    single: { icon: RadioButtonIcon, label: 'radio group' },
    multiple: { icon: CheckSquareIcon, label: 'checkbox group' },
  },
  {
    zone: '> threshold',
    zoneClass: 'bg-primary/8',
    count: '7 – 24',
    single: { icon: ListIcon, label: 'select' },
    multiple: { icon: SelectionAllIcon, label: 'multi-select' },
  },
  {
    zone: '> comboboxThreshold',
    zoneClass: 'bg-primary/12',
    count: '25 +',
    single: { icon: MagnifyingGlassIcon, label: 'combobox' },
    multiple: { icon: TagIcon, label: 'chip combobox' },
  },
];

function Step4b() {
  return (
    <div className="space-y-4 pl-9">
      <div>
        <h3 className="text-base font-semibold">
          How DynamicField resolves the control
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          No explicit <Chip>type</Chip> needed. The right control is picked at
          render time from two inputs: <em>how many options</em> and whether{' '}
          <Chip>multiple</Chip> is set. Two thresholds gate the transitions —
          both are overridable on <Chip>{'<FormBuilder />'}</Chip>.
        </p>
      </div>

      {/* Decision matrix */}
      <div className="overflow-hidden rounded-xl border">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1.4fr_1.4fr] border-b bg-muted/40 text-xs font-medium text-muted-foreground">
          <div className="px-4 py-2.5">options count</div>
          <div className="border-l px-4 py-2.5">
            <Chip>multiple: false</Chip>
            <span className="ml-1.5">single select</span>
          </div>
          <div className="border-l px-4 py-2.5">
            <Chip>multiple: true</Chip>
            <span className="ml-1.5">multi-select</span>
          </div>
        </div>

        {controlRows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1fr_1.4fr_1.4fr] ${i < controlRows.length - 1 ? 'border-b' : ''} ${row.zoneClass}`}
          >
            {/* Count band */}
            <div className="flex flex-col justify-center px-4 py-3">
              <span className="font-mono text-[11px] font-semibold text-foreground/70">
                {row.count}
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {row.zone}
              </span>
            </div>

            {/* Single */}
            <div className="flex items-center gap-2.5 border-l px-4 py-3">
              <row.single.icon
                className="size-4 shrink-0 text-primary"
                weight="duotone"
              />
              <span className="font-mono text-[11px] font-medium text-foreground">
                {row.single.label}
              </span>
            </div>

            {/* Multiple */}
            <div className="flex items-center gap-2.5 border-l px-4 py-3">
              <row.multiple.icon
                className="size-4 shrink-0 text-primary"
                weight="duotone"
              />
              <span className="font-mono text-[11px] font-medium text-foreground">
                {row.multiple.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Threshold callout */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-primary/40" />
          <Chip>threshold</Chip>
          defaults to <strong className="text-foreground">6</strong> — radio →
          select
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-primary/70" />
          <Chip>comboboxThreshold</Chip>
          defaults to <strong className="text-foreground">
            threshold × 4
          </strong>{' '}
          — select → combobox
        </span>
      </div>

      {/* resolveType source */}
      <CodeBlock code={snippets.resolveType} lang="javascript" />

      <p className="text-sm text-muted-foreground">
        Override per-field with an explicit <Chip>type</Chip> — it
        short-circuits all threshold logic. Tune thresholds globally via{' '}
        <Chip>{'<FormBuilder threshold={n} />'}</Chip>.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function PipelinePage() {
  return (
    <div className="max-w-4xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API → UI Pipeline</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          One OpenAPI spec. One command. Three generated files. Two utility
          functions. Zero boilerplate tables or forms.
        </p>
      </div>

      {/* Diagram */}
      <PipelineDiagram />

      {/* Steps */}
      <div className="space-y-2">
        <Step1 />
        <SectionArrow />
        <Step2 />
        <SectionArrow />
        <Step3 />
        <SectionArrow />
        <Step4 />
        <SectionArrow />
        <Step4b />
      </div>
    </div>
  );
}
