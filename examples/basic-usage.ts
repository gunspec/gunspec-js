/**
 * Example: Search, fetch and compare firearms, and handle the errors the API returns.
 *
 * Reads the key from `GUNSPEC_API_KEY`.
 */
import { GunSpec, NotFoundError, RateLimitError } from '@buun_group/gunspec-sdk'

async function main() {
  // Initialize client - reads GUNSPEC_API_KEY from environment
  const client = new GunSpec()

  // --- Firearms ---

  // List firearms with filters
  const pistols = await client.firearms.list({
    category: 'pistol',
    status: 'in_production',
    sort: 'name',
    per_page: 20,
  })
  console.log(`Found ${pistols.pagination.total} pistols`)

  // Full-text search
  const results = await client.firearms.search({ q: 'beretta 92' })
  console.log(`Search returned ${results.data.length} results`)

  // Get a specific firearm by slug
  const { data: glock } = await client.firearms.get('glock-g17')
  console.log(`${glock.name} - ${glock.actionType}`)

  // Compare firearms side by side
  const { data: comparison } = await client.firearms.compare({
    ids: 'glock-g17,beretta-92fs,sig-sauer-p226',
  })
  console.log(`Comparing ${comparison.items.length} firearms`)

  // Get a random firearm
  const { data: surprise } = await client.firearms.random({ category: 'rifle' })
  console.log(`Random rifle: ${surprise.name}`)

  // Top firearms by stat
  const { data: lightest } = await client.firearms.top({
    stat: 'lightest',
    limit: 5,
  })
  console.log('5 lightest firearms:', lightest.map((f) => f.name))

  // Head-to-head comparison
  const { data: h2h } = await client.firearms.headToHead({ a: 'ak-47', b: 'm16a4' })
  const verdictSummary = Object.entries(h2h.verdicts)
    .map(([field, v]) => `${field}: ${v.winner}`)
    .join(', ')
  console.log(`AK-47 vs M16A4: ${verdictSummary}`)

  // Sub-resources
  const { data: variants } = await client.firearms.getVariants('colt-1911-classic')
  const { data: images } = await client.firearms.getImages('colt-1911-classic')
  const { data: gameStats } = await client.firearms.getGameStats('ak-47')
  const { data: similar } = await client.firearms.getSimilar('glock-g17')
  console.log(`Glock G17 has ${similar.length} similar firearms`)

  // SVG silhouette
  const { data: silhouette } = await client.firearms.getSilhouette('ak-47', {
    format: 'datauri',
  })
  console.log(`Silhouette data URI: ${silhouette.dataUri?.slice(0, 50)}...`)

  // --- Auto-pagination ---

  let count = 0
  for await (const firearm of client.firearms.listAutoPaging({ category: 'shotgun' })) {
    count++
    if (count >= 100) break // safety limit
  }
  console.log(`Iterated through ${count} shotguns`)

  // --- Manufacturers ---

  const { data: makers } = await client.manufacturers.list({ country: 'US' })
  console.log(`${makers.length} US manufacturers`)

  const { data: colt } = await client.manufacturers.get('colt')
  console.log(`${colt.name} - founded ${colt.foundedYear}`)

  // --- Calibers ---

  const { data: calibers } = await client.calibers.list({ cartridge_type: 'rimless' })
  console.log(`${calibers.length} rimless calibers`)

  // --- Game Development ---

  const { data: tierList } = await client.game.tierList({ stat: 'damage' })
  for (const [tier, items] of Object.entries(tierList.tiers)) {
    const names = items.slice(0, 3).map((i) => i.name).join(', ')
    const more = items.length > 3 ? ` +${items.length - 3} more` : ''
    console.log(`  ${tier}-tier (${items.length}): ${names}${more}`)
  }

  const { data: matchup } = await client.game.matchups({ a: 'ak-47', b: 'm16a4' })
  console.log(`Matchup: ${matchup.a.name} (${matchup.aWins} wins) vs ${matchup.b.name} (${matchup.bWins} wins), ${matchup.draws} draws`)

  const { data: roster } = await client.game.roleRoster({ role: 'sniper', count: 3 })
  console.log('Top 3 snipers:', roster.map((f) => `${f.name} (${f.roleScore})`).join(', '))

  // --- Statistics ---

  const { data: summary } = await client.stats.summary()
  console.log(`Database: ${summary.total_firearms} firearms, ${summary.total_manufacturers} manufacturers`)

  // --- Error Handling ---

  try {
    await client.firearms.get('nonexistent-firearm')
  } catch (error) {
    if (error instanceof NotFoundError) {
      console.log(`Not found (request ID: ${error.requestId})`)
    } else if (error instanceof RateLimitError) {
      console.log(`Rate limited - retry after ${error.retryAfter}s`)
    } else {
      throw error
    }
  }
}

main().catch(console.error)
