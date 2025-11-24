// Messenger demo using Firebase (modular SDK) — improved UI
// IMPORTANT: Replace firebaseConfig values with your Firebase project config.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, addDoc, onSnapshot, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDiucvw2P_V1sS_GcLB8Bctq7zmDntdOJk",
  authDomain: "fir-messenger-b046a.firebaseapp.com",
  projectId: "fir-messenger-b046a",
  storageBucket: "fir-messenger-b046a.firebasestorage.app",
  messagingSenderId: "780021757000",
  appId: "1:780021757000:web:022a717033cdc60fb3947d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utility
const path = location.pathname.split('/').pop();
function el(id){return document.getElementById(id)}

// Common: logout
if (el('logoutBtn')) el('logoutBtn').addEventListener('click', ()=>signOut(auth));
if (el('logoutBtn2')) el('logoutBtn2').addEventListener('click', ()=>signOut(auth));

// INDEX — signup / login
if(path === '' || path === 'index.html'){
  const signup = el('signupForm');
  const login = el('loginForm');
  const toLogin = el('toLogin');
  const toSignup = el('toSignup');
  const authMsg = el('authMsg');

  toLogin?.addEventListener('click', ()=>{ signup.classList.add('hidden'); login.classList.remove('hidden'); authMsg.textContent='';});
  toSignup?.addEventListener('click', ()=>{ login.classList.add('hidden'); signup.classList.remove('hidden'); authMsg.textContent='';});

  signup?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = el('su_name').value.trim();
    const email = el('su_email').value.trim();
    const pass = el('su_pass').value;
    try{
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      // create user document
      await setDoc(doc(db, 'users', cred.user.uid), { name, email, createdAt: Date.now() });
      authMsg.textContent = 'Account created — redirecting...';
      setTimeout(()=> location='chats.html', 700);
    }catch(err){
      authMsg.textContent = err.message;
    }
  });

  login?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = el('li_email').value.trim();
    const pass = el('li_pass').value;
    try{
      await signInWithEmailAndPassword(auth, email, pass);
      location = 'chats.html';
    }catch(err){
      el('authMsg').textContent = err.message;
    }
  });
}

// CHATS PAGE
if(path === 'chats.html'){
  const chatsList = el('chatsList');
  const searchInput = el('searchUser');
  const searchResults = el('searchResults');
  const panelEmpty = el('panelEmpty');

  onAuthStateChanged(auth, async user=>{
    if(!user) return location='index.html';
    // Listen to chats and show those containing current uid
    const q = query(collection(db,'chats'));
    onSnapshot(q, snap=>{
      chatsList.innerHTML = '';
      snap.forEach(docSnap=>{
        const data = docSnap.data();
        if(data.participants && data.participants.includes(user.uid)){
          const otherId = data.participants.find(p=>p!==user.uid);
          const name = data.name || data.title || otherId;
          const item = document.createElement('div'); item.className='item';
          item.innerHTML = `<div class="avatar">${(name[0]||'U').toUpperCase()}</div><div style="flex:1"><div class="name">${name}</div><div class="small-muted">${data.lastMessage || ''}</div></div><div><a href="chat.html?chatId=${docSnap.id}" class="btn ghost">Open</a></div>`;
          chatsList.appendChild(item);
        }
      });
    });

    // search users
    let t;
    searchInput.addEventListener('input', ()=>{ clearTimeout(t); t = setTimeout(async ()=>{
      const term = searchInput.value.trim().toLowerCase();
      searchResults.innerHTML = '';
      if(!term) return;
      // naive: fetch all users and filter client-side (ok for demo)
      const snaps = await getDocs(query(collection(db,'users')));
      snaps.forEach(s=>{
        const u = s.data();
        if((u.name && u.name.toLowerCase().includes(term)) || (u.email && u.email.toLowerCase().includes(term))){
          const entry = document.createElement('div'); entry.className='item';
          entry.innerHTML = `<div class="avatar">${(u.name||u.email)[0].toUpperCase()}</div><div style="flex:1"><div class="name">${u.name || u.email}</div><div class="small-muted">${u.email}</div></div><div><button class="btn primary start-chat" data-uid="${s.id}" data-name="${u.name||u.email}">Chat</button></div>`;
          searchResults.appendChild(entry);
        }
      });

      // bind start buttons
      searchResults.querySelectorAll('.start-chat').forEach(btn=>{
        btn.addEventListener('click', async (ev)=>{
          const otherId = ev.target.dataset.uid;
          const otherName = ev.target.dataset.name;
          // create chat doc (in production dedupe)
          const chatDoc = await addDoc(collection(db,'chats'), { participants:[user.uid, otherId], createdAt: Date.now(), name: otherName, lastMessage: '' });
          location = `chat.html?chatId=${chatDoc.id}`;
        });
      });
    }, 300)});
  });
}

// CHAT PAGE
if(path === 'chat.html'){
  const messagesEl = el('messages');
  const sendForm = el('sendForm');
  const msgInput = el('msgInput');
  const chatWithEl = el('chatWith');
  const chatAvatar = el('chatAvatar');
  const chatSubtitle = el('chatSubtitle');

  const params = new URLSearchParams(location.search);
  const chatId = params.get('chatId');
  if(!chatId) location='chats.html';

  let currentUser;
  onAuthStateChanged(auth, async user=>{
    if(!user) return location='index.html';
    currentUser = user;

    // load chat meta to show name
    const chatRef = doc(db,'chats',chatId);
    onSnapshot(chatRef, snap=>{
      if(!snap.exists()) return;
      const data = snap.data();
      const name = data.name || 'Chat';
      chatWithEl.textContent = name;
      chatAvatar.textContent = (name[0]||'C').toUpperCase();
      chatSubtitle.textContent = data.lastActive ? 'Active' : ' ';
    });

    // listen messages subcollection
    const msgsCol = collection(db, 'chats', chatId, 'messages');
    const q = query(msgsCol, orderBy('ts'));
    onSnapshot(q, snap=>{
      messagesEl.innerHTML = '';
      snap.forEach(s=>{
        const m = s.data();
        const div = document.createElement('div');
        div.className = 'msg ' + (m.from === currentUser.uid ? 'me' : 'other');
        div.textContent = m.text;
        messagesEl.appendChild(div);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  });

  sendForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(!msgInput.value.trim()) return;
    await addDoc(collection(db,'chats',chatId,'messages'), { text: msgInput.value.trim(), from: auth.currentUser.uid, ts: Date.now() });
    // update last message on chat
    const chatRef = doc(db,'chats',chatId);
    await setDoc(chatRef, { lastMessage: msgInput.value.trim(), lastActive: Date.now() }, { merge: true });
    msgInput.value = '';
  });
}
