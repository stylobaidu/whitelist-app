
// File: App.jsx
import { useState, useEffect } from 'react';
import { auth, db } from './firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';

const WEBHOOK_URL = 'https://whitelist-app-git-main-stylo-baidus-projects.vercel.app/api/webhook'; // replace with your actual webhook URL

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [whitelist, setWhitelist] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'roles', currentUser.uid));
        const roleData = userDoc.exists() ? userDoc.data() : {};
        setIsAdmin(roleData.role === 'admin');
        fetchWhitelist(currentUser.uid, roleData.role === 'admin');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      await createUserWithEmailAndPassword(auth, email, password);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddPhone = async () => {
    if (!user || !phone) return;
    const cleaned = phone.replace(/\s+/g, '');
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      alert("Invalid phone number format");
      return;
    }
    await addDoc(collection(db, 'whitelist'), {
      uid: user.uid,
      phone: cleaned,
    });
    await fetchWebhook(cleaned);
    await fetch(`/send-sms?to=${encodeURIComponent(cleaned)}&user=${encodeURIComponent(user.email)}`);
    setPhone('');
    fetchWhitelist(user.uid, isAdmin);
  };

  const handleDeletePhone = async (phoneNumber) => {
    const q = query(collection(db, 'whitelist'), where(isAdmin ? 'phone' : 'uid', '==', isAdmin ? phoneNumber : user.uid));
    const snapshot = await getDocs(q);
    snapshot.forEach(async (docSnap) => {
      if (docSnap.data().phone === phoneNumber) {
        await deleteDoc(doc(db, 'whitelist', docSnap.id));
      }
    });
    fetchWhitelist(user.uid, isAdmin);
  };

  const fetchWhitelist = async (uid, admin = false) => {
    const q = admin ? query(collection(db, 'whitelist')) : query(collection(db, 'whitelist'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    const phones = snapshot.docs.map(doc => doc.data().phone);
    setWhitelist(phones);
  };

  const fetchWebhook = async (phoneNumber) => {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: user.email,
        phone: phoneNumber,
      }),
    });
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      {!user ? (
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Login / Signup</h2>
          <input className="border p-2" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input className="border p-2" placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
          <button className="bg-blue-500 text-white px-4 py-2" onClick={handleLogin}>Continue</button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Welcome, {user.email} {isAdmin && '(Admin)'}</h2>
            <button onClick={handleLogout} className="text-red-600">Logout</button>
          </div>

          <div className="space-y-2">
            <input className="border w-full p-2" placeholder="Enter phone number (e.g. +233...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button onClick={handleAddPhone} className="bg-green-600 text-white px-4 py-2">Add to Whitelist</button>
          </div>

          <div>
            <h3 className="font-medium">Whitelisted Numbers:</h3>
            <ul className="list-disc ml-6">
              {whitelist.map((p, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{p}</span>
                  <button onClick={() => handleDeletePhone(p)} className="text-sm text-red-500">Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
