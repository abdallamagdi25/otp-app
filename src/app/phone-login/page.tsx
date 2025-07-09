'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Import the CSS for the phone number input library
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

// Define the type for the window object to include recaptcha
interface Window {
  recaptchaVerifier?: RecaptchaVerifier;
}

export default function PhoneLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState<string | undefined>('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Security Check: Redirect if not logged in as admin
  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdminLoggedIn');
    if (isAdmin !== 'true') {
      router.push('/');
    }
  }, [router]);

  // Function to set up the reCAPTCHA
  const setupRecaptcha = () => {
    if (typeof window !== 'undefined') {
      (window as Window).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        },
      });
    }
  };

  // Function to handle sending the OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number.');
      setIsLoading(false);
      return;
    }

    setupRecaptcha();
    const appVerifier = (window as Window).recaptchaVerifier!;
    
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setIsOtpSent(true);
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle verifying the OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      setIsLoading(false);
      return;
    }
    if (!confirmationResult) {
      setError('Something went wrong. Please resend the OTP.');
      setIsLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(otp);
      router.push('/welcome');
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {!isOtpSent ? (
          <div>
            <h1 className="text-2xl font-bold text-center text-black">Enter Phone Number</h1>
            <form onSubmit={handleSendOtp} className="space-y-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-black">
                  Phone Number
                </label>
                <PhoneInput
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  international
                  defaultCountry="EG"
                  className="mt-1 phone-input text-black"
                />
              </div>
              {error && <p className="text-sm text-center text-red-600">{error}</p>}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-center text-black">Verify OTP</h1>
            <p className="text-center text-gray-600 mt-2">Enter the code sent to {phoneNumber}</p>
            <form onSubmit={handleVerifyOtp} className="space-y-6 mt-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-black">
                  OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full px-3 py-2 mt-1 text-center text-black border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {error && <p className="text-sm text-center text-red-600">{error}</p>}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}