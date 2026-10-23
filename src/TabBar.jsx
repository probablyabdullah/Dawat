import { Home, ListOrdered, UserRound } from 'lucide-react'

const TABS = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'ratings', label: 'Ratings', Icon: ListOrdered },
  { id: 'account', label: 'Account', Icon: UserRound },
]

// Always-visible floating bar. Only the active tab shows its label, which keeps the bar compact.
// Pressing the active tab again is handled by the parent (it scrolls back to the top).
function TabBar({ view, signedIn, onSelect }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            className="tab"
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            onClick={() => onSelect(id)}
          >
            <Icon size={20} aria-hidden="true" />
            {active && <span>{label}</span>}
            {id === 'account' && signedIn && <i className="tab-dot" aria-label="Signed in" />}
          </button>
        )
      })}
    </nav>
  )
}

export default TabBar
