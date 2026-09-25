export default function WelcomeModal({ onClose, name }) {
  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        <button className="welcome-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="welcome-icon">🚨</div>
        <h2>Welcome{name ? `, ${name.split(' ')[0]}` : ''}</h2>
        <p>
          Silent SOS is your discreet way to request emergency help, share your live location,
          and notify the people who matter most — all in one tap.
        </p>
        <button className="welcome-cta" onClick={onClose}>
          Get Started
        </button>
      </div>
    </div>
  );
}
