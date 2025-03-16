require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,      
  user: process.env.MYSQLUSER,      
  password: process.env.MYSQLPASSWORD,  
  database: process.env.MYSQLDATABASE,  
  port: process.env.MYSQLPORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco de dados:', err.stack);
    return;
  }
  console.log('Conexão estabelecida com o banco de dados!');
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

const chavePix = process.env.PIX_KEY;

app.post('/intencao-compra', (req, res) => {
  const { nome, numero, telefone } = req.body;

  console.log(`📝 Intenção de compra recebida: Nome: ${nome}, Número: ${numero}, Telefone: ${telefone}`);

  db.query('SELECT * FROM compras_rifa WHERE numero = ?', [numero], (err, result) => {
    if (err) {
      console.error('Erro na consulta de número: ', err);
      return res.status(500).json({ error: err });
    }
    if (result.length > 0) {
      console.log(`⚠️ Número ${numero} já foi comprado!`);
      return res.json({ success: false, message: 'Número já comprado!' });
    }

    db.query(
      'INSERT INTO compras_rifa (nome, numero, telefone, pago) VALUES (?, ?, ?, ?)',
      [nome, numero, telefone, false],
      (err) => {
        if (err) {
          console.error('Erro ao registrar a compra: ', err);
          return res.status(500).json({ error: err });
        }

        console.log(`✅ Compra registrada com sucesso para ${nome}, número: ${numero}.`);
        res.json({
          success: true,
          message: 'Intenção de compra registrada. Agora, faça o pagamento!',
          pixCode: chavePix
        });
      }
    );
  });
});

app.get('/numeros', (req, res) => {
  db.query('SELECT numero FROM compras_rifa', (err, result) => {
    if (err) {
      console.error('Erro ao buscar os números comprados: ', err);
      return res.status(500).json({ error: err });
    }

    const numerosComprados = result.map(row => row.numero);
    const numeros = [];

    for (let i = 1; i <= 1000; i++) {
      numeros.push({ numero: i, comprado: numerosComprados.includes(i) });
    }

    res.json(numeros);
  });
});

app.listen(3000, "0.0.0.0", () => console.log('Servidor rodando na porta 3000'));
