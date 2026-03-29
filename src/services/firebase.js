// ─────────────────────────────────────────────
//  services/firebase.js
//  Substitua firebaseConfig com os dados do seu
//  projeto em console.firebase.google.com
// ─────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs, doc,
  updateDoc, deleteDoc, query, orderBy, onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyDNYHvwCMLTyqQcKXDbsKAjJRPsK-yS7yw",
  authDomain:        "portal-afastamento.firebaseapp.com",
  projectId:         "portal-afastamento",
  storageBucket:     "portal-afastamento.firebasestorage.app",
  messagingSenderId: "671557450883",
  appId:             "1:671557450883:web:2556e00512996ca4e8efb6",
};

const app       = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);

// ── Auth ──────────────────────────────────────
export const loginRH = (email, senha) =>
  signInWithEmailAndPassword(auth, email, senha);

export const logoutRH = () => signOut(auth);

// ── Afastamentos ──────────────────────────────
export const listarAfastamentos = (callback) => {
  const q = query(collection(db, "afastamentos"), orderBy("criadoEm", "desc"));
  return onSnapshot(q, (snap) => {
    const dados = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(dados);
  });
};

export const aprovarAfastamento = (id) =>
  updateDoc(doc(db, "afastamentos", id), { status: "aprovado", atualizadoEm: new Date() });

export const recusarAfastamento = (id, motivo = "") =>
  updateDoc(doc(db, "afastamentos", id), { status: "recusado", motivo, atualizadoEm: new Date() });

export const excluirAfastamento = (id) =>
  deleteDoc(doc(db, "afastamentos", id));

export const getUrlFoto = (path) =>
  getDownloadURL(ref(storage, path));