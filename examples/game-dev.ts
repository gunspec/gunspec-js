/**
 * Example: Game developer weapon system integration.
 *
 * Shows how a game studio would use the GunSpec API to build a
 * realistic weapon system - loading weapon databases, balancing
 * stats, generating loadout recommendations, and creating matchup
 * analysis for multiplayer balance testing.
 *
 * Usage:
 *   GUNSPEC_API_KEY=gs_live_... npx tsx examples/game-dev.ts
 */

import { GunSpec, GameStatsSnapshotEntry } from '@buun_group/gunspec-sdk'

const client = new GunSpec()

// ---------------------------------------------------------------------------
// 1. Load weapon database for a specific game version
// ---------------------------------------------------------------------------

async function loadWeaponDatabase() {
  // Pin to a specific game stats version for deterministic builds
  const { data: versions } = await client.gameStats.listVersions()
  const latestVersion = versions[0]

  if (!latestVersion) {
    console.log('No game stats versions available, falling back to live data')
    return null
  }

  console.log(`Loading weapon DB from snapshot v${latestVersion.version}`)
  console.log(`  Created: ${latestVersion.createdAt}`)

  // Load weapons from this snapshot with pagination
  const weapons: GameStatsSnapshotEntry[] = []
  let page = 1
  const maxPages = 50 // safety limit
  while (page <= maxPages) {
    const result = await client.gameStats.listFirearms(latestVersion.version, {
      per_page: 100,
      page,
    })
    weapons.push(...result.data)
    console.log(`  Page ${page}: fetched ${result.data.length} weapons (total so far: ${weapons.length})`)

    // Break if we got fewer items than requested, or pagination says we're done
    if (result.data.length < 100) break
    if (result.pagination.totalPages && page >= result.pagination.totalPages) break
    page++
  }

  console.log(`  Loaded ${weapons.length} weapons from snapshot`)
  return { version: latestVersion, weapons }
}

// ---------------------------------------------------------------------------
// 2. Build weapon class roster - assign weapons to game roles
// ---------------------------------------------------------------------------

async function buildClassRosters() {
  const roles = ['sniper', 'assault', 'support', 'tank', 'stealth'] as const

  console.log('\n--- Class Rosters ---')

  const rosters = await Promise.all(
    roles.map(async (role) => {
      try {
        const { data } = await client.game.roleRoster({ role, count: 5 })
        return { role, roster: data }
      } catch {
        return { role, roster: null }
      }
    })
  )

  for (const { role, roster } of rosters) {
    console.log(`\n  ${role.toUpperCase()} class:`)
    if (!roster) {
      console.log('    (no data)')
      continue
    }
    for (const weapon of roster) {
      console.log(`    - ${weapon.name} (score: ${weapon.roleScore})`)
    }
  }

  return rosters
}

// ---------------------------------------------------------------------------
// 3. Balance check - find weapons that need tuning
// ---------------------------------------------------------------------------

async function runBalanceCheck() {
  console.log('\n--- Balance Analysis ---')

  const { data: outliers } = await client.game.balanceReport({ threshold: 10 })

  console.log(`\n  Outlier firearms flagged: ${outliers.length}`)

  // Split into overpowered (positive z-scores) and underpowered (negative)
  const overpowered = outliers.filter(e =>
    e.deviations.some(d => d.zScore > 0)
  )
  const underpowered = outliers.filter(e =>
    e.deviations.every(d => d.zScore < 0)
  )

  if (overpowered.length > 0) {
    console.log(`\n  OVERPOWERED (${overpowered.length}):`)
    for (const entry of overpowered.slice(0, 5)) {
      console.log(`    ${entry.firearmName}`)
      for (const dev of entry.deviations) {
        const direction = dev.zScore > 0 ? '+' : ''
        console.log(`      ${dev.stat}: ${dev.value} (${direction}${dev.zScore.toFixed(1)}σ, mean: ${dev.mean.toFixed(1)})`)
      }
    }
  }

  if (underpowered.length > 0) {
    console.log(`\n  UNDERPOWERED (${underpowered.length}):`)
    for (const entry of underpowered.slice(0, 5)) {
      console.log(`    ${entry.firearmName}`)
      for (const dev of entry.deviations) {
        const direction = dev.zScore > 0 ? '+' : ''
        console.log(`      ${dev.stat}: ${dev.value} (${direction}${dev.zScore.toFixed(1)}σ, mean: ${dev.mean.toFixed(1)})`)
      }
    }
  }

  return outliers
}

// ---------------------------------------------------------------------------
// 4. Tier lists - for community meta guides
// ---------------------------------------------------------------------------

async function generateTierLists() {
  console.log('\n--- Tier Lists ---')

  const stats = ['damage', 'accuracy', 'mobility'] as const

  for (const stat of stats) {
    const { data: tierList } = await client.game.tierList({ stat })
    console.log(`\n  ${stat.toUpperCase()} Tier List:`)

    for (const [tier, items] of Object.entries(tierList.tiers)) {
      if (items.length === 0) continue
      const names = items.slice(0, 4).map((i) => (i as { name?: string }).name).join(', ')
      const more = items.length > 4 ? ` +${items.length - 4} more` : ''
      console.log(`    ${tier}-tier: ${names}${more}`)
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Matchup simulator - test weapon balance in duels
// ---------------------------------------------------------------------------

async function simulateMatchups() {
  console.log('\n--- Matchup Simulator ---')

  const matchups = [
    ['ak-47', 'm16a4'],
    ['glock-g17', 'beretta-92fs'],
    ['fn-fal', 'cetme-model-c'],
  ] as const

  for (const [a, b] of matchups) {
    try {
      const { data } = await client.game.matchups({ a, b })

      console.log(`\n  ${data.a.name} vs ${data.b.name}`)
      console.log(`  Score: ${data.aWins} - ${data.bWins} (${data.draws} draws)`)

      for (const [stat, verdict] of Object.entries(data.verdicts)) {
        const arrow = verdict === 'a' ? '>' : verdict === 'b' ? '<' : '='
        const valA = data.a.stats[stat as keyof typeof data.a.stats] ?? '-'
        const valB = data.b.stats[stat as keyof typeof data.b.stats] ?? '-'
        console.log(`    ${stat.padEnd(15)} ${valA} ${arrow} ${valB}`)
      }
    } catch {
      console.log(`\n  ${a} vs ${b}: one or both weapons not found`)
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Stat distribution - understand spread for difficulty tuning
// ---------------------------------------------------------------------------

async function analyzeStatDistributions() {
  console.log('\n--- Stat Distributions ---')

  const stats = ['damage', 'accuracy', 'range', 'fireRate', 'mobility'] as const

  for (const stat of stats) {
    try {
      const { data } = await client.game.statDistribution({ stat })

      console.log(`\n  ${stat}:`)
      console.log(`    Mean: ${data.mean.toFixed(1)}, Median: ${data.median.toFixed(1)}`)
      console.log(`    Min: ${data.min}, Max: ${data.max}`)
      console.log(`    Std Dev: ${data.stdDev.toFixed(1)}`)

      // ASCII histogram
      if (data.histogram && data.histogram.length > 0) {
        const maxCount = Math.max(...data.histogram.map((b) => b.count))
        console.log('    Distribution:')
        for (const bin of data.histogram) {
          const bar = '#'.repeat(Math.round((bin.count / maxCount) * 30))
          console.log(`      ${bin.bucket.padStart(7)}: ${bar} (${bin.count})`)
        }
      }
    } catch {
      console.log(`\n  ${stat}: not available`)
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Build a weapon config file for a game engine
// ---------------------------------------------------------------------------

async function exportWeaponConfigs() {
  console.log('\n--- Weapon Config Export ---')

  // Grab a curated set of weapons for a game
  const slugs = [
    'glock-g17', 'beretta-92fs', 'colt-1911-classic',   // pistols
    'ak-47', 'm16a4', 'fn-fal',                          // rifles
    'franchi-spas-12',                                    // shotgun
  ]

  const configs: Record<string, any> = {}

  for (const slug of slugs) {
    try {
      const [firearmRes, gameProfileRes] = await Promise.all([
        client.firearms.get(slug),
        client.firearms.getGameProfile(slug).catch(() => null),
      ])

      const f = firearmRes.data
      const profile = gameProfileRes?.data

      configs[slug] = {
        id: f.id,
        display_name: f.name,
        category: f.categoryId,
        manufacturer: f.manufacturerId,

        // Real-world specs (for realism)
        specs: {
          weight_kg: f.weightEmptyG ? f.weightEmptyG / 1000 : null,
          barrel_length_m: f.barrelLengthMm ? f.barrelLengthMm / 1000 : null,
          magazine_size: f.magazineCapacity,
          fire_rate_rpm: f.rateOfFireRpm,
          muzzle_velocity_mps: f.muzzleVelocityMps,
        },

        // Game-balanced stats (0-100)
        game_stats: {
          damage: f.gameDamage,
          accuracy: f.gameAccuracy,
          range: f.gameRange,
          fire_rate: f.gameFireRate,
          mobility: f.gameMobility,
          recoil_control: f.gameRecoilControl,
          reload_speed: f.gameReloadSpeed,
          concealment: f.gameConcealment,
        },

        // Archetype classification
        archetype: profile?.archetype ?? null,
        strengths: profile?.strengths ?? [],
        weaknesses: profile?.weaknesses ?? [],

        // Silhouette for UI
        silhouette_url: f.svgLineArtUrl,
      }
    } catch {
      console.log(`  Skipping ${slug} (not found)`)
    }
  }

  console.log(`  Exported ${Object.keys(configs).length} weapon configs`)
  console.log('\n  // weapon-database.json')
  console.log(JSON.stringify(configs, null, 2).split('\n').slice(0, 30).join('\n'))
  console.log('  ...')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60))
  console.log('  GUNSPEC GAME DEV TOOLKIT')
  console.log('='.repeat(60))

  await loadWeaponDatabase().catch(e => console.log(`  [loadWeaponDatabase] ${e.message}\n`))
  await buildClassRosters().catch(e => console.log(`  [buildClassRosters] ${e.message}\n`))
  await runBalanceCheck().catch(e => console.log(`  [runBalanceCheck] ${e.message}\n`))
  await generateTierLists().catch(e => console.log(`  [generateTierLists] ${e.message}\n`))
  await simulateMatchups().catch(e => console.log(`  [simulateMatchups] ${e.message}\n`))
  await analyzeStatDistributions().catch(e => console.log(`  [analyzeStatDistributions] ${e.message}\n`))
  await exportWeaponConfigs().catch(e => console.log(`  [exportWeaponConfigs] ${e.message}\n`))

  console.log('\n' + '='.repeat(60))
  console.log('  Done!')
  console.log('='.repeat(60))
}

main().catch(console.error)
