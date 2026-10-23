import { useState } from 'react'
import { X, Trash2, Pencil } from 'lucide-react'
import { METRICS, MAX_METRIC, MAX_TOTAL, totalScore, scoreTone } from './scoring'
import { formatPrice } from './format'
import { useEscape } from './useEscape'

function SpotDetail({ spot, onClose, onEdit, onDelete }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEscape(onClose)

  const photos = spot.photos || []
  const dishes = spot.fav_dishes || []
  const total = totalScore(spot)

  async function remove() {
    setIsDeleting(true)
    await onDelete(spot)
    setIsDeleting(false)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.length > 0 ? (
          <div className="gallery">
            <div
              className="gallery-track"
              onScroll={(e) =>
                setPhotoIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
              }
            >
              {photos.map((src, i) => (
                <img key={src} src={src} alt={`${spot.name}, photo ${i + 1}`} decoding="async" />
              ))}
            </div>
            {photos.length > 1 && (
              <span className="gallery-count">
                {photoIndex + 1}/{photos.length}
              </span>
            )}
          </div>
        ) : (
          <div className="grabber" />
        )}

        <button className="detail-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="detail-body">
          <div className="detail-top">
            <div>
              <h2 id="detail-title">{spot.name}</h2>
              <p className="meta">
                {[spot.cuisine || 'General', formatPrice(spot.price), new Date(spot.created_at).toLocaleDateString()]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            {total != null && (
              <div className={`score big ${scoreTone(total)}`}>
                {total}
                <small>/{MAX_TOTAL}</small>
              </div>
            )}
          </div>

          {total != null && (
            <div className="bars">
              {METRICS.map(({ key, label, Icon }) => (
                <div key={key} className="bar-row">
                  <div className="bar-label">
                    <Icon size={15} aria-hidden="true" /> {label}
                    <strong>
                      {spot[key]}/{MAX_METRIC}
                    </strong>
                  </div>
                  <div className="bar-track">
                    <div style={{ width: `${(spot[key] / MAX_METRIC) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {dishes.length > 0 && (
            <section>
              <h3 className="section-title">Favourite dishes</h3>
              <ul className="dish-chips static">
                {dishes.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </section>
          )}

          {spot.notes && (
            <section>
              <h3 className="section-title">Notes</h3>
              <p className="note full">{spot.notes}</p>
            </section>
          )}

          <div className="detail-actions">
            {confirming ? (
              <div className="confirm">
                <button className="link-btn" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
                <button className="danger-btn" onClick={remove} disabled={isDeleting}>
                  {isDeleting ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            ) : (
              <>
                <button className="link-btn" onClick={onEdit}>
                  <Pencil size={16} aria-hidden="true" /> Edit
                </button>
                <button className="link-btn danger-text" onClick={() => setConfirming(true)}>
                  <Trash2 size={16} aria-hidden="true" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpotDetail
