/**
 * Example: Populate a product page for a specific firearm.
 *
 * Shows how an e-commerce site, gun shop, or encyclopedia would pull
 * together data from multiple API endpoints to build a rich product
 * detail page for a single firearm.
 *
 * Usage:
 *   GUNSPEC_API_KEY=gs_live_... npx tsx examples/product-page.ts glock-g17
 */

import {
  GunSpec,
  NotFoundError,
  type Firearm,
  type Manufacturer,
  type FirearmImage,
  type FirearmUser,
  type SimilarFirearm,
  type GameStats,
  type Silhouette,
} from '@buun_group/gunspec-sdk'

const client = new GunSpec()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWeight(grams: number | null | undefined): string {
  if (!grams) return 'N/A'
  const oz = (grams / 28.3495).toFixed(1)
  const lbs = (grams / 453.592).toFixed(2)
  return `${grams}g (${oz} oz / ${lbs} lbs)`
}

function formatLength(mm: number | null | undefined): string {
  if (!mm) return 'N/A'
  const inches = (mm / 25.4).toFixed(2)
  return `${mm}mm (${inches}")`
}

// ---------------------------------------------------------------------------
// Fetch all data for a single product page
// ---------------------------------------------------------------------------

interface ProductPageData {
  firearm: Firearm
  manufacturer: Manufacturer | null
  images: FirearmImage[]
  users: FirearmUser[]
  similar: SimilarFirearm[]
  gameStats: GameStats | null
  silhouette: Silhouette | null
  variants: Firearm[]
  calibers: string[]
}

async function fetchProductPage(slug: string): Promise<ProductPageData> {
  // Fire all independent requests in parallel
  const [
    firearmRes,
    imagesRes,
    usersRes,
    similarRes,
    gameStatsRes,
    silhouetteRes,
    variantsRes,
  ] = await Promise.all([
    client.firearms.get(slug),
    client.firearms.getImages(slug),
    client.firearms.getUsers(slug),
    client.firearms.getSimilar(slug),
    client.firearms.getGameStats(slug).catch(() => null),
    client.firearms.getSilhouette(slug, { format: 'datauri' }).catch(() => null),
    client.firearms.getVariants(slug).catch(() => ({ data: [] as Firearm[] })),
  ])

  const firearm = firearmRes.data

  // Fetch manufacturer details (depends on firearm.manufacturerId)
  let manufacturer: Manufacturer | null = null
  if (firearm.manufacturerId) {
    try {
      const mfrRes = await client.manufacturers.get(firearm.manufacturerId)
      manufacturer = mfrRes.data
    } catch {
      // manufacturer might not exist as a full record
    }
  }

  // Parse caliber names from the firearm's caliber junction data
  // In a real app you'd get this from the FirearmDetail type
  const calibers: string[] = []

  return {
    firearm,
    manufacturer,
    images: imagesRes.data,
    users: usersRes.data,
    similar: similarRes.data,
    gameStats: gameStatsRes?.data ?? null,
    silhouette: silhouetteRes?.data ?? null,
    variants: variantsRes.data,
    calibers,
  }
}

// ---------------------------------------------------------------------------
// Render product page (console output - in a real app this would be HTML/React)
// ---------------------------------------------------------------------------

function renderProductPage(page: ProductPageData): void {
  const { firearm: f, manufacturer: mfr } = page

  console.log('='.repeat(72))
  console.log(`  ${f.name}`)
  console.log('='.repeat(72))
  console.log()

  // Breadcrumb
  const breadcrumb = [
    'Home',
    mfr?.name ?? f.manufacturerId,
    f.categoryId?.replace(/-/g, ' '),
    f.name,
  ].join(' > ')
  console.log(`  ${breadcrumb}`)
  console.log()

  // Hero section
  if (page.silhouette?.dataUri) {
    console.log(`  [SVG Silhouette] ${page.silhouette.dataUri.slice(0, 60)}...`)
    console.log()
  }

  // Status badge
  const statusLabel =
    f.status === 'in_production' ? 'In Production' :
    f.status === 'discontinued' ? 'Discontinued' :
    f.status === 'prototype' ? 'Prototype' : 'Unknown'
  console.log(`  Status: ${statusLabel}`)
  if (f.yearIntroduced) {
    console.log(`  Introduced: ${f.yearIntroduced}${f.yearDiscontinued ? ` - Discontinued: ${f.yearDiscontinued}` : ''}`)
  }
  if (f.countryOfOrigin) {
    console.log(`  Country of Origin: ${f.countryOfOrigin}`)
  }
  console.log()

  // Manufacturer card
  if (mfr) {
    console.log('  --- Manufacturer ---')
    console.log(`  ${mfr.name}`)
    if (mfr.countryCode) console.log(`  Country: ${mfr.countryCode}`)
    if (mfr.foundedYear) console.log(`  Founded: ${mfr.foundedYear}`)
    if (mfr.website) console.log(`  Website: ${mfr.website}`)
    console.log()
  }

  // Specifications table
  console.log('  --- Specifications ---')
  console.log(`  Action Type:        ${f.actionType ?? 'N/A'}`)
  console.log(`  Firing Mechanism:   ${f.firingMechanism ?? 'N/A'}`)
  console.log(`  Trigger Type:       ${f.triggerType ?? 'N/A'}`)
  console.log(`  Magazine Capacity:  ${f.magazineCapacity ? `${f.magazineCapacity} rounds` : 'N/A'}`)
  console.log(`  Magazine Type:      ${f.magazineType ?? 'N/A'}`)
  console.log(`  Rate of Fire:       ${f.rateOfFireRpm ? `${f.rateOfFireRpm} rpm` : 'N/A'}`)
  console.log()

  // Dimensions
  console.log('  --- Dimensions ---')
  console.log(`  Weight (empty):     ${formatWeight(f.weightEmptyG)}`)
  console.log(`  Weight (loaded):    ${formatWeight(f.weightLoadedG)}`)
  console.log(`  Overall Length:     ${formatLength(f.overallLengthMm)}`)
  console.log(`  Barrel Length:      ${formatLength(f.barrelLengthMm)}`)
  console.log(`  Height:             ${formatLength(f.heightMm)}`)
  console.log(`  Width:              ${formatLength(f.widthMm)}`)
  console.log(`  Sight Radius:       ${formatLength(f.sightRadiusMm)}`)
  console.log()

  // Ballistics
  console.log('  --- Ballistics ---')
  console.log(`  Muzzle Velocity:    ${f.muzzleVelocityMps ? `${f.muzzleVelocityMps} m/s` : 'N/A'}`)
  console.log(`  Muzzle Energy:      ${f.muzzleEnergyJ ? `${f.muzzleEnergyJ} J` : 'N/A'}`)
  console.log(`  Effective Range:    ${f.effectiveRangeM ? `${f.effectiveRangeM} m` : 'N/A'}`)
  console.log(`  Max Range:          ${f.maxRangeM ? `${f.maxRangeM} m` : 'N/A'}`)
  console.log()

  // Materials & finish
  console.log('  --- Materials ---')
  console.log(`  Frame:              ${f.frameMaterial ?? 'N/A'}`)
  console.log(`  Slide:              ${f.slideMaterial ?? 'N/A'}`)
  console.log(`  Barrel:             ${f.barrelMaterial ?? 'N/A'}`)
  console.log(`  Finish:             ${f.finish ?? 'N/A'}`)
  console.log()

  // Description
  if (f.description) {
    console.log('  --- Description ---')
    console.log(`  ${f.description.slice(0, 300)}${f.description.length > 300 ? '...' : ''}`)
    console.log()
  }

  // Gallery
  if (page.images.length > 0) {
    console.log(`  --- Gallery (${page.images.length} images) ---`)
    for (const img of page.images.slice(0, 5)) {
      console.log(`  [${img.type ?? 'photo'}] ${img.url}`)
      if (img.source) console.log(`    Source: ${img.source} (${img.license ?? 'unknown license'})`)
    }
    console.log()
  }

  // Game stats radar
  if (page.gameStats) {
    const gs = page.gameStats
    console.log('  --- Game Stats (0-100) ---')
    const stats = [
      ['Damage', gs.damage],
      ['Accuracy', gs.accuracy],
      ['Range', gs.range],
      ['Fire Rate', gs.fireRate],
      ['Mobility', gs.mobility],
      ['Recoil', gs.recoilControl],
      ['Reload', gs.reloadSpeed],
      ['Concealment', gs.concealment],
    ] as const
    for (const [label, value] of stats) {
      if (value == null) continue
      const bar = '#'.repeat(Math.round(value / 2.5))
      console.log(`  ${label.padEnd(14)} ${String(value).padStart(3)} ${bar}`)
    }
    console.log()
  }

  // Military / LE adopters
  if (page.users.length > 0) {
    console.log(`  --- Adopted By (${page.users.length} organizations) ---`)
    for (const user of page.users.slice(0, 10)) {
      const parts = [user.userName]
      if (user.countryCode) parts.push(`(${user.countryCode})`)
      if (user.designation) parts.push(`as "${user.designation}"`)
      if (user.adoptedYear) parts.push(`since ${user.adoptedYear}`)
      console.log(`  - ${parts.join(' ')}`)
    }
    console.log()
  }

  // Variants
  if (page.variants.length > 0) {
    console.log(`  --- Variants (${page.variants.length}) ---`)
    for (const v of page.variants.slice(0, 8)) {
      const meta = [v.variantType, v.yearIntroduced, v.status].filter(Boolean).join(', ')
      console.log(`  - ${v.name}${meta ? ` (${meta})` : ''}`)
    }
    console.log()
  }

  // Similar firearms ("You might also like")
  if (page.similar.length > 0) {
    console.log(`  --- Similar Firearms ---`)
    for (const s of page.similar.slice(0, 5)) {
      console.log(`  - ${s.name} (similarity: ${s.score})`)
    }
    console.log()
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const slug = process.argv[2] || 'glock-g17'

  try {
    console.log(`\nFetching product data for "${slug}"...\n`)
    const page = await fetchProductPage(slug)
    renderProductPage(page)
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.error(`Firearm "${slug}" not found. Check the slug and try again.`)
      console.error(`Request ID: ${error.requestId}`)
      process.exit(1)
    }
    throw error
  }
}

main().catch(console.error)
