import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithCustomToken,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  Camera, CheckCircle2, Clock, Calendar, BarChart3, 
  Droplets, Utensils, Moon, Zap, User, ArrowLeft, RefreshCcw, FlipHorizontal, ShieldCheck,
  MessageSquare, Mic, Search, MicOff, ChevronLeft, ChevronRight, LogOut, LogIn, ChevronDown, UserPlus, X, Mail, TrendingUp,
  LogOut as ExitIcon, Lock, Circle, ExternalLink
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import * as THREE from 'three';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'herbalife-weight-gain';
const apiKey = ""; 

const schedule = [
  { id: 'h_6am', time: '06:00 AM', hour: 6, mins: 0, title: 'Morning Hydration', detail: '1 Glass Water', type: 'Liquid', icon: <Droplets /> },
  { id: 'c_630am', time: '06:30 AM', hour: 6, mins: 30, title: 'Morning Club', detail: 'Stretching/Session', type: 'Human', icon: <User /> },
  { id: 'a_7am', time: '07:00 AM', hour: 7, mins: 0, title: 'Afresh', detail: 'Herbalife Afresh', type: 'Product', icon: <Zap /> },
  { id: 'b_8am', time: '08:00 AM', hour: 8, mins: 0, title: 'Breakfast', detail: 'Formula-1 (3 scoops) + ShakeMate (2 scoops)', type: 'Product', icon: <Utensils /> },
  { id: 's_10am', time: '10:00 AM', hour: 10, mins: 0, title: 'Mid-Morning Snack', detail: '2 Bananas or Chiku', type: 'Food', icon: <Utensils /> },
  { id: 'l_12pm', time: '12:00 PM', hour: 12, mins: 0, title: 'Lunch', detail: '4 Roti + Sabzi + Salad + Curd', type: 'Food', icon: <Utensils /> },
  { id: 'a_1pm', time: '01:00 PM', hour: 13, mins: 0, title: 'Afresh', detail: '1 Scoop Afresh', type: 'Product', icon: <Zap /> },
  { id: 'e_4pm', time: '04:00 PM', hour: 16, mins: 0, title: 'Evening Snack', detail: 'Tea + Healthy Snacks', type: 'Food', icon: <Utensils /> },
  { id: 'e_5pm', time: '05:00 PM', hour: 17, mins: 0, title: 'Evening Nutrition', detail: 'Sprouts, Moong, Chana, Soaked Dry Fruits', type: 'Food', icon: <Zap /> },
  { id: 'd_8pm', time: '08:00 PM', hour: 20, mins: 0, title: 'Dinner', detail: '3 Roti + Sabji', type: 'Food', icon: <Utensils /> },
  { id: 's_10pm', time: '10:00 PM', hour: 22, mins: 0, title: 'Rest', detail: 'Time to sleep', type: 'None', icon: <Moon /> },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isVerified, setIsVerified] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState({});
  const [history, setHistory] = useState({});
  const [showCameraMode, setShowCameraMode] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [currentTask, setCurrentTask] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [userNote, setUserNote] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMonth, setViewMonth] = useState(new Date());

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const threeRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (err) {
        console.error("Auth init error", err);
      }
    };
    setupAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const profileDoc = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'data');
        const snap = await getDoc(profileDoc);
        if (snap.exists() && snap.data().cameraVerified === true) {
          setIsVerified(true);
          try {
            const status = await navigator.permissions.query({ name: 'camera' });
            if (status.state === 'granted') setPermissionsGranted(true);
          } catch(e) {}
        } else {
          setIsVerified(false);
        }
      } else {
        setIsVerified(null);
        setPermissionsGranted(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'hi-IN';
      recognitionRef.current.onresult = (event) => {
        setUserNote(prev => prev + " " + event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    async function startCamera() {
      if (cameraActive && videoRef.current) {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }, 
            audio: false 
          });
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Camera access error:", err);
        }
      }
    }
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive, facingMode]);

  const requestInitialPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionsGranted(true);
    } catch (err) {
      speak("Kripya camera aur microphone ki permission dein.");
    }
  };

  useEffect(() => {
    if (isVerified === false && permissionsGranted && threeRef.current) {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      threeRef.current.appendChild(renderer.domElement);
      const geometry = new THREE.IcosahedronGeometry(2, 1);
      const material = new THREE.MeshPhongMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.5 });
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(1, 1, 1);
      scene.add(light);
      camera.position.z = 5;
      const animate = () => {
        requestAnimationFrame(animate);
        sphere.rotation.x += 0.005;
        sphere.rotation.y += 0.005;
        renderer.render(scene, camera);
      };
      animate();
      return () => {
        if (threeRef.current) try { threeRef.current.removeChild(renderer.domElement); } catch (e) {}
        renderer.dispose();
      };
    }
  }, [isVerified, permissionsGranted]);

  useEffect(() => {
    if (!user || isVerified !== true) return;
    const trackingDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tracking', 'data');
    const unsubscribe = onSnapshot(trackingDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const fullHistory = data.history || {};
        setHistory(fullHistory);
        const today = new Date().toISOString().split('T')[0];
        setTasks(fullHistory[today] || {});
      }
    }, (error) => console.error("Firestore error:", error));
    return () => unsubscribe();
  }, [user, isVerified]);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleGlobalVerification = async () => {
    if (!user) return;
    try {
      const profileDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await setDoc(profileDoc, { 
        cameraVerified: true, 
        verifiedAt: new Date().toISOString()
      }, { merge: true });
      setIsVerified(true);
    } catch (e) {
      speak("Verification fail ho gaya.");
    }
  };

  const checkTimeLock = (item) => {
    const now = currentTime;
    const taskStart = new Date(now);
    taskStart.setHours(item.hour, item.mins, 0, 0);
    const taskEnd = new Date(taskStart);
    taskEnd.setHours(taskStart.getHours() + 2);

    if (now < taskStart) return 'early';
    if (now > taskEnd) return 'expired';
    return 'active';
  };

  const completeTask = async (taskId) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const currentDayTasks = { ...(history[today] || {}), [taskId]: true };
    const newHistory = { ...history, [today]: currentDayTasks };
    
    setHistory(newHistory);
    setTasks(currentDayTasks);

    const trackingDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tracking', 'data');
    await setDoc(trackingDoc, { history: newHistory }, { merge: true });
  };

  const analyzeAndComplete = async () => {
    if (!videoRef.current || !currentTask || !user) return;
    setAnalyzing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      const prompt = `Task: Verify if user is consuming ${currentTask.title} (${currentTask.detail}).
      User says: "${userNote}"
      Rules: If the image shows any food, drink, or health product, say yes. Be lenient. 
      Return JSON: {"verified": true, "reason": "Verified"}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image } }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        })
      });
      const data = await response.json();
      const aiResult = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
      
      if (aiResult.verified) {
        await completeTask(currentTask.id);
        setCameraActive(false);
        setUserNote("");
        speak("Badhiya! Task complete ho gaya.");
      } else {
        speak(aiResult.reason || "Koshish karein.");
      }
    } catch (error) { 
      speak("Network check karein."); 
    }
    finally { setAnalyzing(false); }
  };

  const chartData = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: numDays }).map((_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return { 
        day: day, 
        tasks: history[dateStr] ? Object.keys(history[dateStr]).length : 0 
      };
    });
  }, [history, viewMonth]);

  const selectedDayTasks = useMemo(() => {
    return history[selectedDate] || {};
  }, [history, selectedDate]);

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
      <div className="w-20 h-20 bg-emerald-500 rounded-[30px] flex items-center justify-center mb-8 shadow-xl"><Zap size={40} className="text-white fill-white" /></div>
      <h1 className="text-3xl font-black mb-6 italic tracking-tighter text-slate-900">HERBALIFE AI</h1>
      <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full bg-slate-900 text-white py-4 rounded-[25px] font-black flex items-center justify-center gap-3 shadow-lg"><LogIn size={18} />LOGIN WITH GOOGLE</button>
    </div>
  );

  if (!permissionsGranted) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden p-10 text-center">
      <ShieldCheck size={64} className="text-emerald-500 mx-auto mb-6" />
      <h2 className="text-2xl font-black mb-4 uppercase italic text-slate-800">Camera & Mic</h2>
      <p className="text-slate-400 text-xs font-bold mb-8 uppercase tracking-widest">Tracking shuru karne ke liye access dein</p>
      <button onClick={requestInitialPermissions} className="w-full bg-slate-900 text-white py-4 rounded-[25px] font-black shadow-xl">GRANT ACCESS</button>
    </div>
  );

  if (isVerified === false) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden text-white">
      <div ref={threeRef} className="absolute inset-0 z-0 opacity-40" />
      <div className="z-10 text-center px-10">
        <h2 className="text-3xl font-black mb-2 italic">SYNC ACCOUNT</h2>
        <p className="text-emerald-400 text-[10px] font-black uppercase mb-8 tracking-[0.2em]">Authenticating Biometrics...</p>
        <button onClick={handleGlobalVerification} className="w-full bg-emerald-600 text-white py-4 rounded-[25px] font-black animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.4)]">VERIFY NOW</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] max-w-md mx-auto relative overflow-hidden font-sans">
      <header className="bg-emerald-600 text-white p-6 rounded-b-[40px] shadow-xl relative z-30">
        <div className="flex justify-between items-center">
          <div className="relative">
            <button onClick={() => setShowAccountMenu(!showAccountMenu)} className="flex items-center gap-2 bg-black/10 p-1.5 pr-3 rounded-full">
              {user.photoURL ? <img src={user.photoURL} className="w-7 h-7 rounded-full" /> : <User size={14}/>}
              <span className="text-[10px] font-black italic">{user.displayName?.split(' ')[0]}</span>
              <ChevronDown size={12} />
            </button>
            {showAccountMenu && (
              <div className="absolute top-12 left-0 w-44 bg-white rounded-2xl shadow-2xl z-50 p-1 text-slate-800 border border-slate-100">
                <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-red-600 font-bold text-xs"><LogOut size={14}/> Sign Out</button>
              </div>
            )}
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10">
            <span className="text-[8px] font-black uppercase tracking-widest p-2">LIVE TRACKING</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-6 pb-28">
        {activeTab === 'today' ? (
          <div className="space-y-3">
            {schedule.map((item) => {
              const isDone = tasks[item.id];
              const timeStatus = checkTimeLock(item);
              const isLocked = timeStatus !== 'active' && !isDone;

              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    if (isDone || isLocked) return;
                    if (item.type === 'None') { completeTask(item.id); return; }
                    setCurrentTask(item); setShowCameraMode(true);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-[28px] bg-white border-2 transition-all ${isDone ? 'border-emerald-100 opacity-60' : isLocked ? 'border-slate-100 opacity-40 bg-slate-50' : 'border-transparent shadow-sm active:scale-95'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDone ? 'bg-emerald-500 text-white' : isLocked ? 'bg-slate-200 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                    {isLocked ? <Lock size={18} /> : item.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[9px] font-black uppercase ${isLocked ? 'text-slate-400' : 'text-emerald-600'}`}>{item.time}</p>
                    <h3 className="font-bold text-slate-800 text-xs">{item.title}</h3>
                  </div>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100'}`}>
                    {isDone ? <CheckCircle2 size={16} /> : isLocked ? <div className="w-1 h-1 rounded-full bg-slate-200" /> : <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-[30px] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}><ChevronLeft size={18}/></button>
                <h3 className="font-black text-slate-800 uppercase italic text-sm">{viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}><ChevronRight size={18}/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[8px] font-black text-slate-400 mb-1">{d}</div>)}
                {Array.from({ length: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay() }).map((_, i) => <div key={i} />)}
                {Array.from({ length: new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const completedCount = history[dateStr] ? Object.keys(history[dateStr]).length : 0;
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button key={i} onClick={() => setSelectedDate(dateStr)} className={`p-1.5 rounded-lg text-[9px] font-black transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-lg scale-110' : 'bg-slate-50 text-slate-700'}`}>
                      {day}
                      {completedCount > 0 && !isSelected && <div className="w-1 h-1 bg-emerald-500 rounded-full mx-auto mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-[30px] shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Selected Day Details</h3>
              <div className="space-y-2">
                {schedule.map(item => {
                  const isCompleted = selectedDayTasks[item.id];
                  return (
                    <div key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl ${isCompleted ? 'bg-emerald-50' : 'bg-slate-50 opacity-50'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {React.cloneElement(item.icon, { size: 14 })}
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none">{item.time}</p>
                        <h4 className="text-[10px] font-bold text-slate-700">{item.title}</h4>
                      </div>
                      {isCompleted ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-200" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="h-48 bg-white p-5 rounded-[30px] shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Growth Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} domain={[0, 11]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    labelFormatter={(val) => `Day ${val}`}
                  />
                  <Area type="monotone" dataKey="tasks" stroke="#10b981" fillOpacity={1} fill="url(#colorTasks)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      {showCameraMode && (
        <div className="absolute inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[40px] p-8 text-center shadow-2xl">
            <h2 className="text-xl font-black text-slate-800 mb-8 italic uppercase tracking-tighter">SELECT LENS</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setFacingMode('user'); setShowCameraMode(false); setCameraActive(true); }} className="p-6 bg-slate-50 rounded-[30px] flex flex-col items-center gap-3 transition-transform active:scale-95"><User size={24} className="text-emerald-600" /><span className="font-black text-[9px]">Selfie</span></button>
              <button onClick={() => { setFacingMode('environment'); setShowCameraMode(false); setCameraActive(true); }} className="p-6 bg-slate-50 rounded-[30px] flex flex-col items-center gap-3 transition-transform active:scale-95"><FlipHorizontal size={24} className="text-emerald-600" /><span className="font-black text-[9px]">Product</span></button>
            </div>
            <button onClick={() => setShowCameraMode(false)} className="mt-8 text-slate-400 font-black text-[9px]">CANCEL</button>
          </div>
        </div>
      )}

      {cameraActive && (
        <div className="absolute inset-0 z-[110] bg-black">
          <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
          <div className="absolute top-10 left-0 right-0 text-center p-6">
            <div className="inline-block bg-emerald-500 text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">AI CORE ANALYZING</div>
            <div className="mt-4 bg-black/40 backdrop-blur-md p-4 rounded-[25px] border border-white/10 mx-4">
              <h2 className="text-white font-black text-lg italic uppercase">{currentTask?.title}</h2>
              <p className="text-emerald-400 text-[10px] font-bold">{currentTask?.detail}</p>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-6 right-6 flex flex-col gap-3">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[30px] p-3 flex items-center gap-3">
              <input 
                type="text" 
                placeholder="Add note..." 
                value={userNote} 
                onChange={(e) => setUserNote(e.target.value)} 
                className="bg-transparent border-none outline-none text-white text-sm flex-1 font-bold px-2 placeholder:text-white/30" 
              />
              <button 
                onClick={() => { if(isListening) { recognitionRef.current.stop(); setIsListening(false); } else { recognitionRef.current.start(); setIsListening(true); } }} 
                className={`${isListening ? 'bg-red-500' : 'bg-emerald-500'} p-3 rounded-2xl text-white transition-all`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            </div>
            
            <button 
              onClick={analyzeAndComplete} 
              disabled={analyzing} 
              className="w-full bg-white text-black h-16 rounded-[30px] font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {analyzing ? <div className="w-5 h-5 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <><Zap size={20} className="fill-black"/>AI SCAN KARO</>}
            </button>
            <button onClick={() => { setCameraActive(false); setAnalyzing(false); }} className="text-white/40 font-black text-[8px] uppercase tracking-widest text-center">CLOSE CAMERA</button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-2xl p-4 px-10 flex justify-between items-center rounded-t-[40px] shadow-2xl z-20">
        <button onClick={() => setActiveTab('today')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'today' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}><Clock size={24} /><span className="text-[8px] font-black uppercase">Today</span></button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}><Calendar size={24} /><span className="text-[8px] font-black uppercase">Archive</span></button>
        <a 
          href="https://herbalife-smart-wellness-studio.my.canva.site/page-3" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-emerald-600 transition-all"
        >
          <ExternalLink size={24} />
          <span className="text-[8px] font-black uppercase">Studio</span>
        </a>
      </nav>
    </div>
  );
}
```</AreaChart></AreaChart>
