import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from './supabaseClient'
import { compressImage } from './imageUtils'
import { totalScore } from './scoring'
import AccountPage from './AccountPage'
import RatingsPage from './RatingsPage'
import SpotCard, { ScoreBadge } from './SpotCard'
import SpotDetail from './SpotDetail'
import SpotFormSheet from './SpotFormSheet'
import TabBar from './TabBar'
import { Plus, Utensils, X, Share, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import './App.css'

const PHOTO_BUCKET = 'restaurant-photos'
const MAX_HERO_SLIDES = 6
const HOME_LIST_SIZE = 3

const HOME_RANKINGS = [
  { id: 'best', label: 'Best rated', Icon: TrendingUp },
  { id: 'worst', label: 'Worst rated', Icon: TrendingDown },
]

const INSTALL_HINT_KEY = 'dawat-install-hint-dismissed'

// iOS Safari has no install prompt, so we show manual "Add to Home Screen" steps
function shouldShowInstallHint() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches
  if (!isIOS || isStandalone) return false
  try {
    return !localStorage.getItem(INSTALL_HINT_KEY)
  } catch {
    return true
  }
}

const CACHE_KEY = 'dawat-restaurants-cache'

// Last list we fetched, so the app still shows something when opened offline
function loadCachedRestaurants() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    return Array.isArray(cached) ? cached : []
  } catch {
    return []
  }
}

function storagePath(url) {
  return url.split(`/${PHOTO_BUCKET}/`)[1]
}

function byNewest(a, b) {
  return new Date(b.created_at) - new Date(a.created_at)
}

function App() {
  const [showInstallHint, setShowInstallHint] = useState(shouldShowInstallHint)
  const [cachedRestaurants] = useState(loadCachedRestaurants)
  const [restaurants, setRestaurants] = useState(cachedRestaurants)
  const [isFetching, setIsFetching] = useState(cachedRestaurants.length === 0)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [error, setError] = useState('')
  const [ranking, setRanking] = useState('best')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [user, setUser] = useState(null)
  const [view, setView] = useState('home')
  const scrollPositions = useRef({})
  const editing = restaurants.find((r) => r.id === editingId)

  function selectView(next) {
    if (next === view) {
      // Tapping the current tab jumps back to the top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    scrollPositions.current[view] = window.scrollY
    setView(next)
    // Home and Ratings stay mounted (just hidden), so restore where the user was
    requestAnimationFrame(() => window.scrollTo(0, scrollPositions.current[next] ?? 0))
  }

  function openAdd() {
    setSaveError('')
    setIsAddOpen(true)
  }

  function dismissInstallHint() {
    setShowInstallHint(false)
    try {
      localStorage.setItem(INSTALL_HINT_KEY, '1')
    } catch {
      // storage unavailable; the hint just returns next visit
    }
  }

  async function fetchRestaurants() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
    // When offline the banner already explains why we're showing the saved list
    if (!error) setRestaurants(data || [])
    else if (navigator.onLine) setError("Couldn't load your spots. Please try again.")
    setIsFetching(false)
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  // Remember the latest list for offline use
  useEffect(() => {
    if (isFetching) return
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(restaurants))
    } catch {
      // storage full or unavailable; offline view just won't have a saved list
    }
  }, [restaurants, isFetching])

  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false)
      fetchRestaurants()
    }
    const goOffline = () => setIsOffline(true)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  function removeFromStorage(urls) {
    const paths = urls.map(storagePath).filter(Boolean)
    if (paths.length) supabase.storage.from(PHOTO_BUCKET).remove(paths)
  }

  async function uploadPhoto(file) {
    const blob = await compressImage(file)
    const path = `${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, blob, { contentType: 'image/jpeg' })
    if (error) throw error
    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
  }

  // Creates a new spot, or updates `editing` when we're in edit mode
  async function saveSpot({ files, keptPhotos, ...fields }) {
    if (!navigator.onLine) {
      setSaveError("You're offline. Reconnect to save your changes.")
      return
    }
    setIsSaving(true)
    setSaveError('')

    let uploaded = []
    try {
      uploaded = await Promise.all(files.map(uploadPhoto))
    } catch {
      setSaveError("Couldn't upload the photos. Check your connection and the storage setup.")
      setIsSaving(false)
      return
    }
    const photos = [...keptPhotos, ...uploaded]

    if (editing) {
      // .select() so we can tell when a missing permission silently updated nothing
      const { data, error } = await supabase
        .from('restaurants')
        .update({ ...fields, photos })
        .eq('id', editing.id)
        .select()
      if (error || !data?.length) {
        removeFromStorage(uploaded)
        setSaveError("Couldn't save your changes. The table may be missing an update permission.")
      } else {
        setRestaurants((prev) => prev.map((r) => (r.id === editing.id ? data[0] : r)))
        removeFromStorage((editing.photos || []).filter((url) => !photos.includes(url)))
        setEditingId(null)
      }
    } else {
      const { error } = await supabase.from('restaurants').insert([{ ...fields, photos }])
      if (error) {
        removeFromStorage(uploaded)
        setSaveError("Couldn't save that spot. Please try again.")
      } else {
        setIsAddOpen(false)
        fetchRestaurants()
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } })
      }
    }
    setIsSaving(false)
  }

  async function deleteRestaurant(restaurant) {
    if (!navigator.onLine) {
      setError("You're offline. Reconnect to delete a spot.")
      setSelectedId(null)
      return
    }
    // .select() so a missing delete permission (which deletes nothing, silently) is caught
    const { data, error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurant.id)
      .select()
    if (error || !data?.length) {
      setError("Couldn't delete that spot. Please try again.")
      return
    }
    setRestaurants((prev) => prev.filter((r) => r.id !== restaurant.id))
    setSelectedId(null)
    removeFromStorage(restaurant.photos || [])
  }

  // Hero shows the highest-scoring spots that have a photo
  const heroSlides = useMemo(
    () =>
      restaurants
        .filter((r) => r.photos?.length)
        .sort((a, b) => (totalScore(b) ?? -1) - (totalScore(a) ?? -1) || byNewest(a, b))
        .slice(0, MAX_HERO_SLIDES),
    [restaurants],
  )

  // Home only ever shows the top (or bottom) few; the Ratings tab has everything
  const rankedSpots = useMemo(() => {
    const rated = restaurants.filter((r) => totalScore(r) != null)
    const dir = ranking === 'best' ? -1 : 1
    return rated.sort((a, b) => (totalScore(a) - totalScore(b)) * dir || byNewest(a, b))
  }, [restaurants, ranking])
  const homeSpots = rankedSpots.slice(0, HOME_LIST_SIZE)

  const selected = restaurants.find((r) => r.id === selectedId)

  return (
    <div className="app">
      {isOffline && (
        <div className="offline-bar" role="status">
          You're offline. Showing your saved list.
        </div>
      )}

      <div hidden={view !== 'home'}>
        {/* Hero banner */}
        <section className="hero" aria-label="Top spots">
          {heroSlides.length > 0 ? (
            <div
              className="hero-track"
              onScroll={(e) =>
                setSlideIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
              }
            >
              {heroSlides.map((r, i) => (
                <article key={r.id} className="hero-slide" onClick={() => setSelectedId(r.id)}>
                  <img
                    src={r.photos[0]}
                    alt=""
                    decoding="async"
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                  />
                  <div className="hero-shade" />
                  <div className="hero-info">
                    <span className="hero-cuisine">{r.cuisine || 'General'}</span>
                    <h2>{r.name}</h2>
                    <div className="hero-meta">
                      <ScoreBadge total={totalScore(r)} big />
                      {r.fav_dishes?.length > 0 && <p>Loved: {r.fav_dishes.join(', ')}</p>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="hero-empty">
              <Utensils size={34} aria-hidden="true" />
              <p>Add photos to a spot and your top-scoring ones will show up here.</p>
            </div>
          )}

          <header className="hero-top">
            <h1>
              Dawat<span lang="ur" dir="rtl">دعوت</span>
            </h1>
            <div className="count-badge">
              {restaurants.length} {restaurants.length === 1 ? 'spot' : 'spots'}
            </div>
          </header>

          {heroSlides.length > 1 && (
            <div className="dots" aria-hidden="true">
              {heroSlides.map((r, i) => (
                <span key={r.id} className={i === slideIndex ? 'active' : ''} />
              ))}
            </div>
          )}
        </section>

        {/* Floating "rate a new spot" bar */}
        <button className="dock" onClick={openAdd}>
          <span className="dock-plus">
            <Plus size={22} aria-hidden="true" />
          </span>
          <span className="dock-text">
            <strong>Rate a new spot</strong>
            <small>Scores, photos and favourite dishes</small>
          </span>
        </button>

        <div className="content">
          {showInstallHint && (
            <div className="install-hint">
              <Share size={20} aria-hidden="true" />
              <p>
                Install Dawat: tap <strong>Share</strong> in Safari, then{' '}
                <strong>Add to Home Screen</strong>.
              </p>
              <button className="icon-btn" onClick={dismissInstallHint} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          {error && (
            <div className="notice" role="alert">
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="chips" role="group" aria-label="Ranking">
            {HOME_RANKINGS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className="chip"
                aria-pressed={ranking === id}
                onClick={() => setRanking(id)}
              >
                <Icon size={15} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <main>
            {isFetching ? (
              <div className="list" aria-busy="true">
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton" />
              </div>
            ) : homeSpots.length === 0 ? (
              <div className="empty">
                <Utensils size={36} aria-hidden="true" />
                <h2>{restaurants.length === 0 ? 'Nothing here yet' : 'No scored spots yet'}</h2>
                <p>Rate the first place you want to remember.</p>
              </div>
            ) : (
              <>
                <ul className="list" key={ranking}>
                  {homeSpots.map((r) => (
                    <SpotCard key={r.id} spot={r} onOpen={setSelectedId} />
                  ))}
                </ul>
                <button className="see-all" onClick={() => selectView('ratings')}>
                  See all {restaurants.length} ratings <ArrowRight size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </main>
        </div>
      </div>

      <div hidden={view !== 'ratings'}>
        <RatingsPage
          restaurants={restaurants}
          isFetching={isFetching}
          onOpen={setSelectedId}
          onAdd={openAdd}
        />
      </div>

      {view === 'account' && (
        <AccountPage
          user={user}
          spotCount={restaurants.length}
          onSignIn={setUser}
          onSignOut={() => setUser(null)}
        />
      )}

      <TabBar view={view} signedIn={!!user} onSelect={selectView} />

      {(isAddOpen || editing) && (
        <SpotFormSheet
          key={editing?.id ?? 'new'}
          spot={editing}
          isSaving={isSaving}
          error={saveError}
          onClose={() => {
            setIsAddOpen(false)
            setEditingId(null)
          }}
          onSubmit={saveSpot}
        />
      )}

      {selected && !editing && (
        <SpotDetail
          spot={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            setSaveError('')
            setEditingId(selected.id)
          }}
          onDelete={deleteRestaurant}
        />
      )}
    </div>
  )
}

export default App
