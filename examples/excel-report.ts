/**
 * Example: Generate a comprehensive firearms report for Excel/CSV export.
 *
 * Demonstrates auto-pagination to collect large datasets, cross-referencing
 * multiple resources (firearms, manufacturers, calibers, stats), and
 * formatting data for spreadsheet consumption.
 *
 * In a real app you'd use a library like `exceljs` or `xlsx` to write
 * actual .xlsx files. This example outputs CSV to stdout.
 *
 * Usage:
 *   GUNSPEC_API_KEY=gs_live_... npx tsx examples/excel-report.ts > report.csv
 *   GUNSPEC_API_KEY=gs_live_... npx tsx examples/excel-report.ts --format json > report.json
 *   GUNSPEC_API_KEY=gs_live_... npx tsx examples/excel-report.ts --manufacturer beretta
 *   GUNSPEC_API_KEY=gs_live_... npx tsx examples/excel-report.ts --category pistol --limit 50
 */

import {
  GunSpec,
  RateLimitError,
  type Firearm,
  type Manufacturer,
} from '@buun_group/gunspec-sdk'

const client = new GunSpec()

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface ReportOptions {
  format: 'csv' | 'json'
  manufacturer?: string
  category?: string
  country?: string
  status?: string
  limit: number
}

function parseArgs(): ReportOptions {
  const args = process.argv.slice(2)
  const opts: ReportOptions = { format: 'csv', limit: 500 }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--format':
        opts.format = (args[++i] as 'csv' | 'json') || 'csv'
        break
      case '--manufacturer':
        opts.manufacturer = args[++i]
        break
      case '--category':
        opts.category = args[++i]
        break
      case '--country':
        opts.country = args[++i]
        break
      case '--status':
        opts.status = args[++i]
        break
      case '--limit':
        opts.limit = parseInt(args[++i] || '500', 10)
        break
    }
  }

  return opts
}

// ---------------------------------------------------------------------------
// Data collection - auto-paginate through all matching firearms
// ---------------------------------------------------------------------------

async function collectFirearms(opts: ReportOptions): Promise<Firearm[]> {
  const firearms: Firearm[] = []

  const params: Record<string, string | number | undefined> = {
    per_page: 100,
    sort: 'name',
    order: 'asc' as const,
    manufacturer: opts.manufacturer,
    category: opts.category,
    country: opts.country,
    status: opts.status,
  }

  // Remove undefined keys
  for (const key of Object.keys(params)) {
    if (params[key] === undefined) delete params[key]
  }

  process.stderr.write(`Collecting firearms (limit: ${opts.limit})...\n`)

  for await (const firearm of client.firearms.listAutoPaging(params)) {
    firearms.push(firearm)

    if (firearms.length % 100 === 0) {
      process.stderr.write(`  ${firearms.length} collected...\n`)
    }

    if (firearms.length >= opts.limit) break
  }

  process.stderr.write(`  Total: ${firearms.length} firearms\n`)
  return firearms
}

// ---------------------------------------------------------------------------
// Enrich with manufacturer details - batch lookup with caching
// ---------------------------------------------------------------------------

async function buildManufacturerLookup(
  firearms: Firearm[],
): Promise<Map<string, Manufacturer>> {
  const slugs = [...new Set(firearms.map(f => f.manufacturerId))]
  const lookup = new Map<string, Manufacturer>()

  process.stderr.write(`Fetching ${slugs.length} manufacturer details...\n`)

  // Batch in groups of 5 to respect rate limits
  for (let i = 0; i < slugs.length; i += 5) {
    const batch = slugs.slice(i, i + 5)
    const results = await Promise.allSettled(
      batch.map(slug => client.manufacturers.get(slug))
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (result?.status === 'fulfilled') {
        lookup.set(batch[j]!, result.value.data)
      }
    }

    // Small delay between batches to be respectful of rate limits
    if (i + 5 < slugs.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  process.stderr.write(`  Resolved ${lookup.size}/${slugs.length} manufacturers\n`)
  return lookup
}

// ---------------------------------------------------------------------------
// Build report rows
// ---------------------------------------------------------------------------

interface ReportRow {
  // Identification
  slug: string
  name: string
  manufacturer_name: string
  manufacturer_country: string
  category: string
  status: string
  year_introduced: string
  year_discontinued: string
  country_of_origin: string

  // Dimensions (imperial + metric)
  weight_empty_g: string
  weight_empty_oz: string
  overall_length_mm: string
  overall_length_in: string
  barrel_length_mm: string
  barrel_length_in: string
  height_mm: string
  width_mm: string

  // Mechanical
  action_type: string
  firing_mechanism: string
  trigger_type: string
  magazine_capacity: string
  magazine_type: string
  rate_of_fire_rpm: string

  // Ballistics
  muzzle_velocity_mps: string
  muzzle_velocity_fps: string
  muzzle_energy_j: string
  muzzle_energy_ft_lbs: string
  effective_range_m: string
  effective_range_yd: string

  // Materials
  frame_material: string
  slide_material: string
  barrel_material: string
  finish: string

  // Game stats
  game_damage: string
  game_accuracy: string
  game_range: string
  game_fire_rate: string
  game_mobility: string
  game_recoil_control: string

  // Meta
  designer: string
  data_confidence: string
}

function toFixed(val: number | null | undefined, decimals: number): string {
  return val != null ? val.toFixed(decimals) : ''
}

function buildRows(
  firearms: Firearm[],
  manufacturers: Map<string, Manufacturer>,
): ReportRow[] {
  return firearms.map(f => {
    const mfr = manufacturers.get(f.manufacturerId)

    return {
      slug: f.id,
      name: f.name,
      manufacturer_name: mfr?.name ?? f.manufacturerId,
      manufacturer_country: mfr?.countryCode ?? '',
      category: f.categoryId ?? '',
      status: f.status ?? '',
      year_introduced: f.yearIntroduced?.toString() ?? '',
      year_discontinued: f.yearDiscontinued?.toString() ?? '',
      country_of_origin: f.countryOfOrigin ?? '',

      weight_empty_g: toFixed(f.weightEmptyG, 0),
      weight_empty_oz: f.weightEmptyG ? (f.weightEmptyG / 28.3495).toFixed(1) : '',
      overall_length_mm: toFixed(f.overallLengthMm, 0),
      overall_length_in: f.overallLengthMm ? (f.overallLengthMm / 25.4).toFixed(2) : '',
      barrel_length_mm: toFixed(f.barrelLengthMm, 0),
      barrel_length_in: f.barrelLengthMm ? (f.barrelLengthMm / 25.4).toFixed(2) : '',
      height_mm: toFixed(f.heightMm, 0),
      width_mm: toFixed(f.widthMm, 0),

      action_type: f.actionType ?? '',
      firing_mechanism: f.firingMechanism ?? '',
      trigger_type: f.triggerType ?? '',
      magazine_capacity: f.magazineCapacity?.toString() ?? '',
      magazine_type: f.magazineType ?? '',
      rate_of_fire_rpm: f.rateOfFireRpm?.toString() ?? '',

      muzzle_velocity_mps: toFixed(f.muzzleVelocityMps, 0),
      muzzle_velocity_fps: f.muzzleVelocityMps ? (f.muzzleVelocityMps * 3.28084).toFixed(0) : '',
      muzzle_energy_j: toFixed(f.muzzleEnergyJ, 0),
      muzzle_energy_ft_lbs: f.muzzleEnergyJ ? (f.muzzleEnergyJ * 0.737562).toFixed(0) : '',
      effective_range_m: toFixed(f.effectiveRangeM, 0),
      effective_range_yd: f.effectiveRangeM ? (f.effectiveRangeM * 1.09361).toFixed(0) : '',

      frame_material: f.frameMaterial ?? '',
      slide_material: f.slideMaterial ?? '',
      barrel_material: f.barrelMaterial ?? '',
      finish: f.finish ?? '',

      game_damage: f.gameDamage?.toString() ?? '',
      game_accuracy: f.gameAccuracy?.toString() ?? '',
      game_range: f.gameRange?.toString() ?? '',
      game_fire_rate: f.gameFireRate?.toString() ?? '',
      game_mobility: f.gameMobility?.toString() ?? '',
      game_recoil_control: f.gameRecoilControl?.toString() ?? '',

      designer: f.designer ?? '',
      data_confidence: f.dataConfidence?.toFixed(2) ?? '',
    }
  })
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function outputCSV(rows: ReportRow[]): void {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0]!) as (keyof ReportRow)[]

  // Header row
  console.log(headers.join(','))

  // Data rows
  for (const row of rows) {
    const values = headers.map(h => escapeCSV(row[h]))
    console.log(values.join(','))
  }
}

function outputJSON(rows: ReportRow[]): void {
  console.log(JSON.stringify(rows, null, 2))
}

// ---------------------------------------------------------------------------
// Summary statistics (printed to stderr so they don't pollute CSV output)
// ---------------------------------------------------------------------------

function printSummary(rows: ReportRow[]): void {
  const stderr = process.stderr

  stderr.write('\n--- Report Summary ---\n')
  stderr.write(`Total records: ${rows.length}\n`)

  // Count by category
  const byCat = new Map<string, number>()
  for (const r of rows) {
    byCat.set(r.category, (byCat.get(r.category) ?? 0) + 1)
  }
  stderr.write('By category:\n')
  for (const [cat, count] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
    stderr.write(`  ${cat || '(unknown)'}: ${count}\n`)
  }

  // Count by status
  const byStatus = new Map<string, number>()
  for (const r of rows) {
    byStatus.set(r.status || '(unknown)', (byStatus.get(r.status || '(unknown)') ?? 0) + 1)
  }
  stderr.write('By status:\n')
  for (const [status, count] of [...byStatus.entries()].sort((a, b) => b[1] - a[1])) {
    stderr.write(`  ${status}: ${count}\n`)
  }

  // Count by country
  const byCountry = new Map<string, number>()
  for (const r of rows) {
    byCountry.set(r.manufacturer_country || '(unknown)', (byCountry.get(r.manufacturer_country || '(unknown)') ?? 0) + 1)
  }
  stderr.write('By manufacturer country (top 10):\n')
  for (const [country, count] of [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    stderr.write(`  ${country}: ${count}\n`)
  }

  // Data completeness
  const fields = ['weight_empty_g', 'barrel_length_mm', 'muzzle_velocity_mps', 'magazine_capacity', 'action_type'] as const
  stderr.write('Field completeness:\n')
  for (const field of fields) {
    const filled = rows.filter(r => r[field] !== '').length
    const pct = ((filled / rows.length) * 100).toFixed(1)
    stderr.write(`  ${field}: ${filled}/${rows.length} (${pct}%)\n`)
  }

  stderr.write('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs()

  try {
    // Collect firearms data
    const firearms = await collectFirearms(opts)

    // Enrich with manufacturer names
    const manufacturers = await buildManufacturerLookup(firearms)

    // Build report rows
    const rows = buildRows(firearms, manufacturers)

    // Output
    if (opts.format === 'json') {
      outputJSON(rows)
    } else {
      outputCSV(rows)
    }

    // Print summary to stderr
    printSummary(rows)

  } catch (error) {
    if (error instanceof RateLimitError) {
      process.stderr.write(
        `\nRate limited! Retry after ${error.retryAfter}s.\n` +
        `Consider upgrading your API tier for higher limits.\n`
      )
      process.exit(1)
    }
    throw error
  }
}

main().catch(console.error)
