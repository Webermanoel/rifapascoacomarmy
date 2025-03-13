const twilio = require('twilio');
const client = new twilio('TWILIO_SID', 'TWILIO_AUTH_TOKEN');

function enviarWhatsApp(mensagem, telefone) {
    client.messages.create({
        body: mensagem,
        from: 'whatsapp:+14155238886',  // Número do Twilio
        to: `whatsapp:+55${telefone}`
    }).then(message => console.log("Mensagem enviada:", message.sid));
}
