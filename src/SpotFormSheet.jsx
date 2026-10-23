import { useState, useEffect, useMemo } from 'react'
import { X, Camera, Plus } from 'lucide-react'
import { METRICS, MAX_METRIC, MAX_TOTAL } from './scoring'
import { useEscape } from './useEscape'

const MAX_PHOTOS = 5
const MAX_DISHES = 12
const DEFAULT_SCORE = 7

// Used for both rating a new spot and editing an existing one (pass `spot` to edit).
// Spots saved before the 3-metric system have no scores, so editing lets you score them.
function SpotFormSheet({ spot, isSaving, error, onClose, onSubmit }) {
  const isEdit = !!spot
  const [name, setName] = useState(spot?.name ?? '')
  const [cuisine, setCuisine] = useState(spot?.cuisine === 'General' ? '' : (spot?.cuisine ?? ''))
  const [scores, setScores] = useState({
    food_score: spot?.food_score ?? DEFAULT_SCORE,
    ambience_score: spot?.ambience_score ?? DEFAULT_SCORE,
    value_score: spot?.value_score ?? DEFAULT_SCORE,
  })
  const [price, setPrice] = useState(spot?.price != null ? String(spot.price) : '')
  const [dishes, setDishes] = useState(spot?.fav_dishes ?? [])
  const [dishInput, setDishInput] = useState('')
  const [notes, setNotes] = useState(spot?.notes ?? '')
  const [keptPhotos, setKeptPhotos] = useState(spot?.photos ?? [])
  const [files, setFiles] = useState([])

  useEscape(onClose)

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  const total = METRICS.reduce((sum, m) => sum + scores[m.key], 0)
  const photoCount = keptPhotos.length + files.length

  function addPhotos(e) {
    const picked = Array.from(e.target.files)
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS - keptPhotos.length))
    e.target.value = ''
  }

  function withDish(list, value) {
    const dish = value.trim()
    if (!dish || list.length >= MAX_DISHES) return list
    if (list.some((d) => d.toLowerCase() === dish.toLowerCase())) return list
    return [...list, dish]
  }

  function addDish() {
    setDishes((prev) => withDish(prev, dishInput))
    setDishInput('')
  }

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      cuisine: cuisine.trim() || 'General',
      ...scores,
      price: price === '' ? null : Math.round(Number(price)),
      fav_dishes: withDish(dishes, dishInput),
      notes: notes.trim(),
      keptPhotos,
      files,
    })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grabber" />
        <div className="sheet-head">
          <h2 id="form-title">{isEdit ? 'Edit spot' : 'Rate a spot'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="notice" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <span className="field-label">
              Photos <span className="optional">(up to {MAX_PHOTOS})</span>
            </span>
            <div className="photo-grid">
              {keptPhotos.map((src, i) => (
                <div key={src} className="photo-tile">
                  <img src={src} alt={`Saved ${i + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => setKeptPhotos((prev) => prev.filter((p) => p !== src))}
                    aria-label={`Remove saved photo ${i + 1}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={src} className="photo-tile">
                  <img src={src} alt={`New ${i + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove new photo ${i + 1}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {photoCount < MAX_PHOTOS && (
                <label className="photo-tile photo-add" htmlFor="photos">
                  <Camera size={22} aria-hidden="true" />
                  <small>{photoCount === 0 ? 'Add photos' : 'Add more'}</small>
                </label>
              )}
            </div>
            <input
              id="photos"
              className="sr-only"
              type="file"
              accept="image/*"
              multiple
              onChange={addPhotos}
            />
          </div>

          <div className="field">
            <label htmlFor="name">Restaurant name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Dishoom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="cuisine">
              Cuisine <span className="optional">(optional)</span>
            </label>
            <input
              id="cuisine"
              type="text"
              placeholder="e.g. Indian, Dim sum, Burgers"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="price">
              Total bill <span className="optional">(optional)</span>
            </label>
            <input
              id="price"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="e.g. 1800"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <fieldset className="field scores">
            <legend>Our rating</legend>
            {METRICS.map(({ key, label, Icon }) => (
              <div key={key} className="score-input">
                <div className="score-input-head">
                  <label htmlFor={key}>
                    <Icon size={16} aria-hidden="true" /> {label}
                  </label>
                  <output htmlFor={key}>
                    <strong>{scores[key]}</strong>/{MAX_METRIC}
                  </output>
                </div>
                <input
                  id={key}
                  className="slider"
                  type="range"
                  min="1"
                  max={MAX_METRIC}
                  step="1"
                  value={scores[key]}
                  style={{ '--pct': `${((scores[key] - 1) / (MAX_METRIC - 1)) * 100}%` }}
                  onChange={(e) => setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                />
              </div>
            ))}
            <div className="total-preview">
              <span>Total score</span>
              <strong>
                {total}
                <small>/{MAX_TOTAL}</small>
              </strong>
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="dish">
              Favourite dishes <span className="optional">(optional)</span>
            </label>
            <div className="dish-entry">
              <input
                id="dish"
                type="text"
                placeholder="e.g. Black daal"
                value={dishInput}
                enterKeyHint="done"
                onChange={(e) => setDishInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addDish()
                  }
                }}
              />
              <button type="button" className="dish-add" onClick={addDish} aria-label="Add dish">
                <Plus size={20} />
              </button>
            </div>
            {dishes.length > 0 && (
              <ul className="dish-chips">
                {dishes.map((d) => (
                  <li key={d}>
                    {d}
                    <button
                      type="button"
                      onClick={() => setDishes((prev) => prev.filter((x) => x !== d))}
                      aria-label={`Remove ${d}`}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="field">
            <label htmlFor="notes">
              Notes <span className="optional">(optional)</span>
            </label>
            <input
              id="notes"
              type="text"
              placeholder="e.g. Go early, the queue gets long"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="submit" disabled={isSaving}>
            {isSaving
              ? files.length
                ? 'Uploading…'
                : 'Saving…'
              : isEdit
                ? 'Save changes'
                : `Publish ${total}/${MAX_TOTAL}`}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SpotFormSheet
