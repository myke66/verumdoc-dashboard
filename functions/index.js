const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

// Cloud Function HTTP — chamada pelo dashboard ao aprovar/recusar
exports.enviarNotificacao = onRequest({ cors: true }, async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    res.status(400).json({ erro: "token, title e body são obrigatórios." });
    return;
  }

  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });
    res.status(200).json({ sucesso: true });
  } catch (error) {
    console.error("Erro FCM:", error);
    res.status(500).json({ erro: error.message });
  }
});

// Cloud Function Firestore — dispara automaticamente ao mudar status
exports.notificarMudancaStatus = onDocumentUpdated(
  "afastamentos/{id}",
  async (event) => {
    const antes  = event.data.before.data();
    const depois = event.data.after.data();

    if (antes.status === depois.status) return;

    const { matricula, nome, status } = depois;

    try {
      const userDoc = await admin.firestore()
        .collection("usuarios").doc(matricula).get();

      if (!userDoc.exists) return;

      const { fcmToken } = userDoc.data();
      if (!fcmToken) return;

      const mensagens = {
        aprovado: {
          title: "✅ Afastamento aprovado",
          body:  `Olá ${nome.split(" ")[0]}! Seu afastamento foi aprovado pelo RH.`,
        },
        recusado: {
          title: "❌ Afastamento recusado",
          body:  `Olá ${nome.split(" ")[0]}! Seu afastamento foi recusado. Entre em contato com o RH.`,
        },
      };

      const msg = mensagens[status];
      if (!msg) return;

      await admin.messaging().send({
        token: fcmToken,
        notification: msg,
        android: { priority: "high" },
        apns: { payload: { aps: { sound: "default" } } },
      });

      console.log(`Notificação enviada para ${nome} — ${status}`);
    } catch (error) {
      console.error("Erro ao notificar:", error);
    }
  }
);