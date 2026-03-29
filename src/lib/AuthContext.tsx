'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { usePushNotification } from './usePush';


interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await signOut(auth);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Sync to profiles collection
    const profileRef = doc(db, 'profiles', user.uid);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      const data = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        image: user.photoURL,
        role: 'customer'
      };
      await setDoc(profileRef, data);
      setProfile(data);
    } else {
       setProfile(snap.data());
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'profiles', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout }}>
      <PushEnabler uid={user?.uid} />
      {children}
    </AuthContext.Provider>
  );
};

// Helper component so we can use hooks conditionally or cleanly.
function PushEnabler({ uid }: { uid?: string }) {
  usePushNotification(uid);
  return null;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
