/**
 * Example: Build a firearms industry dashboard.
 *
 * Demonstrates pulling data from multiple resource APIs to populate
 * a dashboard with KPIs, charts, tables, and insights - the kind of
 * view an analyst, retailer, or game developer would build.
 *
 * Usage:
 *   GUNSPEC_API_KEY=gs_live_... npx tsx examples/dashboard.ts
 */

import { GunSpec } from '@buun_group/gunspec-sdk'

const client = new GunSpec()

// ---------------------------------------------------------------------------
// 1. KPI Cards - high-level database summary
// ---------------------------------------------------------------------------

async function fetchKPIs() {
  const { data: summary } = await client.stats.summary()
  return {
    totalFirearms: summary.total_firearms,
    totalManufacturers: summary.total_manufacturers,
    totalCalibers: summary.total_calibers,
    countriesOfOrigin: summary.countries_of_origin,
  }
}

// ---------------------------------------------------------------------------
// 2. Production Status Breakdown - pie chart data
// ---------------------------------------------------------------------------

async function fetchProductionBreakdown() {
  const { data } = await client.stats.productionStatus()
  return data // e.g. { in_production: 342, discontinued: 891, prototype: 12 }
}

// ---------------------------------------------------------------------------
// 3. Top Manufacturers Table - who makes the most firearms
// ---------------------------------------------------------------------------

async function fetchTopManufacturers() {
  const { data } = await client.stats.prolificManufacturers({ limit: 10 })
  return data
}

// ---------------------------------------------------------------------------
// 4. Caliber Popularity - bar chart of most common calibers
// ---------------------------------------------------------------------------

async function fetchCaliberPopularity() {
  const { data } = await client.stats.popularCalibers({ limit: 15 })
  return data
}

// ---------------------------------------------------------------------------
// 5. Category Distribution - firearms by type
// ---------------------------------------------------------------------------

async function fetchCategoryDistribution() {
  const { data } = await client.stats.byCategory()
  return data
}

// ---------------------------------------------------------------------------
// 6. Manufacturer Spotlight - deep dive into one maker
// ---------------------------------------------------------------------------

async function fetchManufacturerSpotlight(manufacturerSlug: string) {
  const [mfrRes, statsRes, timelineRes, firearmsRes] = await Promise.all([
    client.manufacturers.get(manufacturerSlug),
    client.manufacturers.getStats(manufacturerSlug),
    client.manufacturers.getTimeline(manufacturerSlug),
    client.manufacturers.getFirearms(manufacturerSlug, { per_page: 5 }),
  ])

  return {
    manufacturer: mfrRes.data,
    stats: statsRes.data,
    timeline: timelineRes.data,
    topFirearms: firearmsRes.data,
  }
}

// ---------------------------------------------------------------------------
// 7. Game Balance Overview - for game developers
// ---------------------------------------------------------------------------

async function fetchGameBalanceOverview() {
  const [balanceRes, tierListRes, distributionRes] = await Promise.all([
    client.game.balanceReport({ threshold: 15 }),
    client.game.tierList({ stat: 'damage' }),
    client.game.statDistribution({ stat: 'damage' }),
  ])

  return {
    balance: balanceRes.data,
    tierList: tierListRes.data,
    distribution: distributionRes.data,
  }
}

// ---------------------------------------------------------------------------
// 8. Feature Analysis - what features are most common
// ---------------------------------------------------------------------------

async function fetchFeatureAnalysis() {
  const [featuresRes, actionsRes, materialsRes] = await Promise.all([
    client.stats.featureFrequency({ limit: 10 }),
    client.stats.actionTypes(),
    client.stats.materials(),
  ])

  return {
    topFeatures: featuresRes.data,
    actionTypes: actionsRes.data,
    materials: materialsRes.data,
  }
}

// ---------------------------------------------------------------------------
// 9. Head-to-Head Comparison Widget
// ---------------------------------------------------------------------------

async function fetchComparison(slugA: string, slugB: string) {
  const [h2hRes, compareRes] = await Promise.all([
    client.firearms.headToHead({ a: slugA, b: slugB }),
    client.firearms.compare({ ids: `${slugA},${slugB}` }),
  ])

  return {
    headToHead: h2hRes.data,
    firearms: compareRes.data,
  }
}

// ---------------------------------------------------------------------------
// 10. Era Timeline - how firearms evolved
// ---------------------------------------------------------------------------

async function fetchEraTimeline() {
  const decades = ['1900s', '1910s', '1920s', '1930s', '1940s', '1950s',
                    '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']

  const results = await Promise.all(
    decades.map(async (decade) => {
      try {
        const { data } = await client.stats.byEra({ decade })
        return { decade, data }
      } catch {
        return { decade, data: null }
      }
    })
  )

  return results.filter(r => r.data !== null)
}

// ---------------------------------------------------------------------------
// 11. Data Quality Panel - for data team
// ---------------------------------------------------------------------------

async function fetchDataQuality() {
  const [coverageRes, lowConfRes] = await Promise.all([
    client.dataQuality.coverage(),
    client.dataQuality.confidence({ below: 0.3, per_page: 10 }),
  ])

  return {
    coverage: coverageRes.data,
    lowConfidenceRecords: lowConfRes.data,
  }
}

// ---------------------------------------------------------------------------
// Render Dashboard
// ---------------------------------------------------------------------------

function renderDashboard(data: {
  kpis: Awaited<ReturnType<typeof fetchKPIs>>
  production: Awaited<ReturnType<typeof fetchProductionBreakdown>>
  topMakers: Awaited<ReturnType<typeof fetchTopManufacturers>>
  calibers: Awaited<ReturnType<typeof fetchCaliberPopularity>>
  categories: Awaited<ReturnType<typeof fetchCategoryDistribution>>
  spotlight: Awaited<ReturnType<typeof fetchManufacturerSpotlight>>
  comparison: Awaited<ReturnType<typeof fetchComparison>>
}) {
  console.log('\n' + '='.repeat(72))
  console.log('  GUNSPEC DASHBOARD')
  console.log('='.repeat(72))

  // KPI Cards
  console.log('\n  --- Key Metrics ---')
  console.log(`  Firearms:      ${data.kpis.totalFirearms}`)
  console.log(`  Manufacturers: ${data.kpis.totalManufacturers}`)
  console.log(`  Calibers:      ${data.kpis.totalCalibers}`)
  console.log(`  Countries:     ${data.kpis.countriesOfOrigin}`)

  // Production breakdown
  console.log('\n  --- Production Status ---')
  console.log(`  ${JSON.stringify(data.production, null, 2).split('\n').join('\n  ')}`)

  // Top manufacturers
  console.log('\n  --- Top 10 Manufacturers ---')
  if (Array.isArray(data.topMakers)) {
    for (const m of data.topMakers) {
      const entry = m as { name?: string; firearm_count?: number }
      console.log(`  ${String(entry.name).padEnd(25)} ${entry.firearm_count} firearms`)
    }
  }

  // Caliber popularity
  console.log('\n  --- Most Popular Calibers ---')
  if (Array.isArray(data.calibers)) {
    for (const c of data.calibers) {
      const entry = c as { name?: string; firearm_count?: number }
      const count = entry.firearm_count ?? 0
      const bar = '#'.repeat(Math.min(40, count))
      console.log(`  ${String(entry.name).padEnd(25)} ${String(count).padStart(4)} ${bar}`)
    }
  }

  // Category distribution
  console.log('\n  --- Firearms by Category ---')
  if (Array.isArray(data.categories)) {
    for (const cat of data.categories) {
      const entry = cat as { name?: string; firearm_count?: number }
      console.log(`  ${String(entry.name).padEnd(30)} ${entry.firearm_count}`)
    }
  }

  // Manufacturer spotlight
  console.log('\n  --- Manufacturer Spotlight ---')
  const sp = data.spotlight
  console.log(`  ${sp.manufacturer.name} (${sp.manufacturer.countryCode ?? 'Unknown'})`)
  if (sp.stats.stats) {
    console.log(`  Total firearms: ${sp.stats.stats.total_firearms}`)
    console.log(`  Active: ${sp.stats.stats.active_count}, Discontinued: ${sp.stats.stats.discontinued_count}`)
    if (sp.stats.stats.earliest_year) {
      console.log(`  Production span: ${sp.stats.stats.earliest_year} - ${sp.stats.stats.latest_year ?? 'present'}`)
    }
  }
  if (sp.stats.mostCommonCaliber) {
    console.log(`  Most common caliber: ${sp.stats.mostCommonCaliber.name} (${sp.stats.mostCommonCaliber.count} firearms)`)
  }
  console.log(`  Categories:`)
  for (const cat of sp.stats.categories) {
    console.log(`    ${cat.name}: ${cat.count}`)
  }

  // Head-to-head
  console.log('\n  --- Head-to-Head ---')
  const h2h = data.comparison.headToHead
  const nameA = (h2h.a as Record<string, any>).name ?? 'Firearm A'
  const nameB = (h2h.b as Record<string, any>).name ?? 'Firearm B'
  console.log(`  ${nameA} vs ${nameB}`)

  let aWins = 0, bWins = 0
  for (const [field, verdict] of Object.entries(h2h.verdicts)) {
    const arrow = verdict.winner === 'a' ? '>' : verdict.winner === 'b' ? '<' : '='
    console.log(`    ${field.padEnd(20)} ${verdict.a ?? '-'} ${arrow} ${verdict.b ?? '-'} (${verdict.better})`)
    if (verdict.winner === 'a') aWins++
    else if (verdict.winner === 'b') bWins++
  }
  console.log(`  Score: ${nameA} ${aWins} - ${bWins} ${nameB}`)

  console.log('\n' + '='.repeat(72))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Loading dashboard data...\n')

  // Fire independent data fetches in parallel
  const [kpis, production, topMakers, calibers, categories, spotlight, comparison] =
    await Promise.all([
      fetchKPIs(),
      fetchProductionBreakdown(),
      fetchTopManufacturers(),
      fetchCaliberPopularity(),
      fetchCategoryDistribution(),
      fetchManufacturerSpotlight('beretta'),
      fetchComparison('glock-g17', 'sig-sauer-p226'),
    ])

  renderDashboard({
    kpis,
    production,
    topMakers,
    calibers,
    categories,
    spotlight,
    comparison,
  })

  // These are independent panels that could load asynchronously
  console.log('\n  Loading additional panels...\n')

  const [gameBalance, features, dataQuality, eraTimeline] = await Promise.all([
    fetchGameBalanceOverview().catch(() => null),
    fetchFeatureAnalysis().catch(() => null),
    fetchDataQuality().catch(() => null),
    fetchEraTimeline().catch(() => null),
  ])

  if (gameBalance) {
    console.log('  --- Game Balance ---')
    const outliers = gameBalance.balance as Array<{ firearmName?: string; deviations?: Array<{ stat?: string; zScore?: number }> }>
    console.log(`  Outlier firearms: ${outliers.length}`)
    for (const entry of outliers.slice(0, 5)) {
      console.log(`    ${entry.firearmName}: ${(entry.deviations ?? []).map((d) => `${d.stat} (z=${d.zScore})`).join(', ')}`)
    }
    const sTier = gameBalance.tierList.tiers.S.slice(0, 5).map(f => f.name).join(', ')
    console.log(`  S-tier (damage, top 5): ${sTier || 'none'}`)
    console.log()
  }

  if (features) {
    console.log('  --- Feature Frequency ---')
    if (Array.isArray(features.topFeatures)) {
      for (const f of features.topFeatures.slice(0, 5)) {
        const entry = f as { feature?: string; count?: number }
        console.log(`  ${String(entry.feature).padEnd(25)} ${entry.count}`)
      }
    }
    console.log()
  }

  if (eraTimeline && eraTimeline.length > 0) {
    console.log('  --- Era Timeline ---')
    for (const { decade, data: era } of eraTimeline) {
      if (era) {
        console.log(`  ${decade}: ${(era as { firearm_count?: number }).firearm_count ?? 0} firearms`)
      }
    }
    console.log()
  }

  if (dataQuality) {
    console.log('  --- Data Quality ---')
    console.log(`  Overall coverage: ${JSON.stringify(dataQuality.coverage)}`)
    console.log(`  Low confidence records: ${dataQuality.lowConfidenceRecords.length}`)
    console.log()
  }
}

main().catch(console.error)
