import { Utensils, ImageIcon } from 'lucide-react'
import { METRICS, MAX_TOTAL, totalScore, scoreTone } from './scoring'
import { formatPrice } from './format'

const CARD_DISH_LIMIT = 3

export function ScoreBadge({ total, big }) {
  if (total == null) return <div className="score none">Unrated</div>
  return (
    <div className={`score ${scoreTone(total)} ${big ? 'big' : ''}`}>
      {total}
      <small>/{MAX_TOTAL}</small>
    </div>
  )
}

function MetricRow({ spot }) {
  return (
    <div className="metrics">
      {METRICS.map(({ key, short, Icon }) => (
        <span key={key} className="metric" title={short}>
          <Icon size={14} aria-hidden="true" />
          <span className="sr-only">{short}</span>
          {spot[key]}
        </span>
      ))}
    </div>
  )
}

function SpotCard({ spot, onOpen }) {
  const dishes = spot.fav_dishes || []
  const photoCount = spot.photos?.length || 0
  const total = totalScore(spot)
  const meta = [
    spot.cuisine || 'General',
    formatPrice(spot.price),
    new Date(spot.created_at).toLocaleDateString(),
  ].filter(Boolean)

  return (
    <li>
      <button className="card" onClick={() => onOpen(spot.id)}>
        <div className="thumb">
          {photoCount > 0 ? (
            <img src={spot.photos[0]} alt="" loading="lazy" decoding="async" />
          ) : (
            <Utensils size={26} aria-hidden="true" />
          )}
          {photoCount > 1 && (
            <span className="thumb-count">
              <ImageIcon size={11} aria-hidden="true" /> {photoCount}
            </span>
          )}
        </div>

        <div className="card-body">
          <div className="card-top">
            <h3>{spot.name}</h3>
            <ScoreBadge total={total} />
          </div>
          <p className="meta">{meta.join(' · ')}</p>
          {total != null && <MetricRow spot={spot} />}
          {dishes.length > 0 && (
            <ul className="dish-chips mini">
              {dishes.slice(0, CARD_DISH_LIMIT).map((d) => (
                <li key={d}>{d}</li>
              ))}
              {dishes.length > CARD_DISH_LIMIT && (
                <li className="more">+{dishes.length - CARD_DISH_LIMIT}</li>
              )}
            </ul>
          )}
        </div>
      </button>
    </li>
  )
}

export default SpotCard
