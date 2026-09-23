import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(location.state?.email ? 'We sent a 6-digit code to your email.' : '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError('Enter your email first, then tap resend.');
      return;
    }
    setError('');
    setInfo('');
    setResending(true);
    try {
      const data = await resendOtp(email);
      setInfo(data.message || 'A new code has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend the code.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>🚨 Silent SOS</h1>
        <h2>Verify your account</h2>
        {error && <p className="form-error">{error}</p>}
        {info && <p className="form-success">{info}</p>}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Verification code
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            maxLength={6}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="otp-resend-btn"
        >
          {resending ? 'Resending...' : "Didn't get a code? Resend"}
        </button>
        <p className="auth-switch">
          <Link to="/login">Back to login</Link>
        </p>
      </form>
    </div>
  );
}