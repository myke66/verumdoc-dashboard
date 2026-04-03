// services/notificacoes.js
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const VAPID_KEY = "BJgLVyM3xDhgQ53P7kv-AVj2Le_wJ6dsBOLOnHXg9kkGhSOPSdIbSM3p6mDDY_-ZNnVeWLjNJRE9p1rdj2Ka3Kk";

let messagingInstance = null;

const getMessagingInstance = () => {
  if (!messagingInstance) {
    const { initializeApp, getApps } = require("firebase/app");
    const app = getApps()[0];
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

// Solicitar permissão e salvar token do dispositivo
export const solicitarPermissaoNotificacao = async (usuarioId) => {
  try {
    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") {
      console.warn("Permissão de notificação negada.");
      return null;
    }

    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token && usuarioId) {
      // Salvar token no Firestore vinculado ao usuário
      await updateDoc(doc(db, "usuarios", usuarioId), {
        fcmToken: token,
        tokenAtualizado: new Date(),
      });
    }

    return token;
  } catch (error) {
    console.error("Erro ao obter token FCM:", error);
    return null;
  }
};

// Ouvir notificações com app aberto
export const ouvirNotificacoes = (callback) => {
  try {
    const messaging = getMessaging();
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (e) {
    console.warn("Firebase Messaging não disponível:", e);
    return () => {};
  }
};

// Enviar notificação via Cloud Function (backend)
// Esta função chama uma Firebase Cloud Function que envia o FCM
export const enviarNotificacao = async (afastamentoId, status) => {
  try {
    // Buscar token do funcionário no Firestore
    const afastDoc = await getDoc(doc(db, "afastamentos", afastamentoId));
    if (!afastDoc.exists()) return;

    const { matricula, nome } = afastDoc.data();

    // Buscar token FCM do funcionário
    const userQuery = await getDoc(doc(db, "usuarios", matricula));
    if (!userQuery.exists()) return;

    const { fcmToken } = userQuery.data();
    if (!fcmToken) return;

    const mensagens = {
      aprovado: {
        title: "✅ Afastamento aprovado",
        body: `Olá ${nome.split(" ")[0]}! Seu afastamento foi aprovado pelo RH.`,
      },
      recusado: {
        title: "❌ Afastamento recusado",
        body: `Olá ${nome.split(" ")[0]}! Seu afastamento foi recusado. Entre em contato com o RH.`,
      },
    };

    const msg = mensagens[status];
    if (!msg) return;

    // Chamar Cloud Function para enviar (ver README para configurar)
    await fetch("https://enviarnotificacao-671557450883.us-central1.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: fcmToken, ...msg }),
    });

  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
};