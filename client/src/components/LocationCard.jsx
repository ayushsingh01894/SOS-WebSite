export default function LocationCard({ location, locationError, onRetry }) {
  return (
    <div className="location-card">
      <h3>Current Location</h3>
      {location ? (
        <>
          <p>Latitude: {location.latitude.toFixed(5)}</p>
          <p>Longitude: {location.longitude.toFixed(5)}</p>
          <p className="location-accuracy">Accuracy: ~{Math.round(location.accuracy)}m</p>
        </>
      ) : locationError ? (
        <>
          <p className="sos-warning">{locationError}</p>
          <button className="location-retry-btn" onClick={onRetry}>Retry</button>
        </>
      ) : (
        <p>Detecting your location...</p>
      )}
    </div>
  );
}
