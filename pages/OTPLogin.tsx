import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP } from './sendOTP';
import { verifyOTP } from './verifyOTP';

const OTPLogin: React.FC = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'INPUT_PHONE' | 'INPUT_OTP'>('INPUT_PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOTP = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await sendOTP(phone);
      setStep('INPUT_OTP');
      setSuccessMsg('OTP sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const userData = await verifyOTP(otp);
      console.log('User Logged In:', userData.uid);
      setSuccessMsg(`Login Successful! UID: ${userData.uid}`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Phone Login</h2>

      {/* Error & Success Messages */}
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      {successMsg && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded text-sm">{successMsg}</div>}

      {step === 'INPUT_PHONE' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919999999999"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      )}

      {step === 'INPUT_OTP' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-300 transition"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            onClick={() => setStep('INPUT_PHONE')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Change Phone Number
          </button>
        </div>
      )}

      {/* Invisible reCAPTCHA Container */}
      <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default OTPLogin;