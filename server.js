require('dotenv').config();
console.log("🔍 Variáveis de ambiente carregadas:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PORT:", process.env.DB_PORT);

const { Pool } = require('pg'); 
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const pool = new Pool({
  host: process.env.DB_HOST, 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, 
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false } 
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no banco de dados:', err);
    return;
  }
  console.log('✅ Conexão estabelecida com o banco de dados PostgreSQL!');
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

const chavePix = process.env.PIX_KEY;

app.post('/intencao-compra', async (req, res) => {
  const { nome, numero, telefone } = req.body;

  console.log(`📝 Intenção de compra recebida: Nome: ${nome}, Número: ${numero}, Telefone: ${telefone}`);

  try {
    const { rows } = await pool.query('SELECT * FROM compras_rifa WHERE numero = $1', [numero]);
    
    if (rows.length > 0) {
      console.log(`⚠️ Número ${numero} já foi comprado!`);
      return res.json({ success: false, message: 'Número já comprado!' });
    }

    await pool.query(
      'INSERT INTO compras_rifa (nome, numero, telefone, pago) VALUES ($1, $2, $3, $4)',
      [nome, numero, telefone, false]
    );

    console.log(`✅ Compra registrada com sucesso para ${nome}, número: ${numero}.`);
    res.json({
      success: true,
      message: 'Intenção de compra registrada. Agora, faça o pagamento!',
      pixCode: chavePix
    });
  } catch (err) {
    console.error('Erro ao registrar a compra: ', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/numeros', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT numero FROM compras_rifa');
    const numerosComprados = rows.map(row => row.numero);
    const numeros = [];

    for (let i = 1; i <= 1000; i++) {
      numeros.push({ numero: i, comprado: numerosComprados.includes(i) });
    }

    res.json(numeros);
  } catch (err) {
    console.error('Erro ao buscar os números comprados: ', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, "0.0.0.0", () => console.log('🚀 Servidor rodando na porta 3000'));
