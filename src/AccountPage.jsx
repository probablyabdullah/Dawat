import { useState } from 'react'
import { LogOut, UserRound } from 'lucide-react'

// UI-only for now: signing in just hands a user object to the parent.
// TODO(prod): replace with Supabase Auth (see project prod checklist).
function AccountPage({ user, spotCount, onSignIn, onSignOut }) {
  const [mode, setMode] = useState('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e) {
    e.preventDefault()
    onSignIn({
      email: email.trim(),
      name: displayName.trim() || email.trim().split('@')[0],
    })
    setPassword('')
  }

  const isSignup = mode === 'signup'

  return (
    <section className="page" aria-labelledby="account-title">
      <h1 id="account-title" className="page-title">
        {user ? 'Your account' : 'Welcome'}
      </h1>

      {user ? (
        <>
          <div className="account">
            <div className="avatar" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user.name}</strong>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="stat">
            <strong>{spotCount}</strong>
            <span>{spotCount === 1 ? 'spot saved' : 'spots saved'}</span>
          </div>

          <button className="menu-row" onClick={onSignOut}>
            <LogOut size={18} aria-hidden="true" /> Sign out
          </button>
        </>
      ) : (
        <>
          <p className="menu-intro">
            <UserRound size={18} aria-hidden="true" />
            Sign in to keep your list in sync across your devices.
          </p>

          <div className="segmented" role="group" aria-label="Sign in or create account">
            <button type="button" aria-pressed={!isSignup} onClick={() => setMode('signin')}>
              Sign in
            </button>
            <button type="button" aria-pressed={isSignup} onClick={() => setMode('signup')}>
              Create account
            </button>
          </div>

          <form onSubmit={submit}>
            {isSignup && (
              <div className="field">
                <label htmlFor="auth-name">Your name</label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                minLength={isSignup ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit">
              {isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}

export default AccountPage
