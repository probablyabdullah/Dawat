import { useState } from 'react'
import { Search, X, ArrowDown, ArrowUp, Utensils, Plus } from 'lucide-react'
import { totalScore } from './scoring'
import SpotCard from './SpotCard'

// `firstDir` is the direction used when a sort is first picked
const SORTS = [
  { key: 'recent', label: 'Recent', firstDir: 'desc', value: (r) => new Date(r.created_at).getTime() },
  { key: 'rating', label: 'Rating', firstDir: 'desc', value: (r) => totalScore(r) },
  { key: 'price', label: 'Price', firstDir: 'asc', value: (r) => r.price },
]

// Spots missing the sorted value (no price, unrated) always sink to the bottom
function sortSpots(spots, sort) {
  const { value } = SORTS.find((s) => s.key === sort.key)
  const sign = sort.dir === 'asc' ? 1 : -1
  return [...spots].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    return (va - vb) * sign
  })
}

function RatingsPage({ restaurants, isFetching, onOpen, onAdd }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'recent', dir: 'desc' })

  function pickSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: SORTS.find((s) => s.key === key).firstDir },
    )
  }

  const q = query.trim().toLowerCase()
  const matches = restaurants.filter(
    (r) =>
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q) ||
      r.fav_dishes?.some((d) => d.toLowerCase().includes(q)),
  )
  const visible = sortSpots(matches, sort)

  return (
    <section className="page ratings" aria-labelledby="ratings-title">
      <div className="page-head">
        <h1 id="ratings-title" className="page-title">
          All ratings
        </h1>
        <span className="count-pill">{restaurants.length}</span>
        <button className="head-add" onClick={onAdd} aria-label="Rate a new spot">
          <Plus size={20} />
        </button>
      </div>

      <div className="tools">
        <div className="search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search spot, cuisine or dish"
            aria-label="Search all ratings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="chips" role="group" aria-label="Sort by">
          {SORTS.map(({ key, label }) => {
            const active = sort.key === key
            const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown
            return (
              <button
                key={key}
                className="chip"
                aria-pressed={active}
                onClick={() => pickSort(key)}
              >
                {label}
                {active && <Arrow size={14} aria-label={sort.dir === 'asc' ? 'ascending' : 'descending'} />}
              </button>
            )
          })}
        </div>
      </div>

      {isFetching ? (
        <div className="list" aria-busy="true">
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <Utensils size={36} aria-hidden="true" />
          <h2>{restaurants.length === 0 ? 'Nothing here yet' : 'No matches'}</h2>
          <p>
            {restaurants.length === 0
              ? 'Rate the first place you want to remember.'
              : 'Try a different search.'}
          </p>
        </div>
      ) : (
        <ul className="list">
          {visible.map((r) => (
            <SpotCard key={r.id} spot={r} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default RatingsPage
