'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { generateFromEmail } from 'unique-username-generator';

export default function WelcomePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Security Check: Verify user is logged in via Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.phoneNumber) {
        // User is signed in.
        // Generate a random username from their phone number
        const randomUsername = generateFromEmail(currentUser.phoneNumber, 3);
        setUsername(randomUsername);
      } else {
        // User is signed out. Redirect them.
        router.push('/phone-login');
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  // Handle the sign-out process
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect to phone login page after sign out
      router.push('/phone-login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show a loading state while checking authentication
  if (isLoading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-black">
          🎉 Welcome! 🎉
        </h1>
        <p className="text-lg text-gray-700">
          Your assigned username is:
        </p>
        <p className="px-4 py-2 text-2xl font-mono text-indigo-600 bg-indigo-50 rounded-md">
          {username}
        </p>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}