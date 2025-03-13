require('dotenv').config();  
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios'); 


const db = mysql.createConnection({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME 
});

db.connect(function(err) {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err.stack);
    return;
  }
  console.log('Conectado ao MySQL como ID ' + db.threadId);
});

const app = express();
app.use(cors());
app.use(bodyParser.json());


const numeroPromotora = process.env.NUMERO_PROMOTORA; 


app.get('/verificar-numero/:numero', (req, res) => {
  const numero = req.params.numero;
  db.query('SELECT * FROM compras_rifa WHERE numero = ?', [numero], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length > 0) {
      return res.json({ disponivel: false });
    }
    res.json({ disponivel: true });
  });
});


app.post('/intencao-compra', (req, res) => {
  const { nome, numero, telefone } = req.body;

  db.query('SELECT * FROM compras_rifa WHERE numero = ?', [numero], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.length > 0) {
      return res.json({ success: false, message: 'Número já comprado!' });
    }

    db.query('INSERT INTO compras_rifa (nome, numero, telefone, pago) VALUES (?, ?, ?, ?)', 
    [nome, numero, telefone, false], (err) => {
      if (err) return res.status(500).json({ error: err });

      res.json({ success: true, message: 'Intenção de compra registrada. Agora, faça o pagamento!' });

      
      const mensagemPromotora = `💥 Nova intenção de compra! 💥\n\nNome: ${nome}\nNúmero(s) escolhido(s): ${numero}\nTelefone: ${telefone}\n\nAguarde o pagamento para confirmar a compra.`;
      
      
      axios.post('https://api.twilio.com/envio-whatsapp', {
        message: mensagemPromotora,
        phone: numeroPromotora
      })
      .catch((err) => {
        console.error('Erro ao enviar mensagem para a promotora:', err);
      });
    });
  });
});


app.post('/confirmar-pagamento', (req, res) => {
  const { numero, statusPagamento } = req.body;  

  if (statusPagamento === 'pago') {
    db.query('UPDATE compras_rifa SET pago = true WHERE numero = ?', [numero], (err) => {
      if (err) return res.status(500).json({ error: err });

      
      const mensagemPromotora = `🎉 O número ${numero} foi pago e confirmado como comprado!`;

      
      axios.post('https://api.twilio.com/envio-whatsapp', {
        message: mensagemPromotora,
        phone: numeroPromotora
      })
      .then(() => {
        res.json({ success: true, message: 'Pagamento confirmado. Número comprado!' });
      })
      .catch((err) => {
        res.status(500).json({ error: 'Erro ao enviar WhatsApp para a promotora' });
      });
    });
  } else {
    res.json({ success: false, message: 'Pagamento não confirmado.' });
  }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
