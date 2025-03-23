const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); 
const { Pool } = require('pg');
const Joi = require('joi');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

const schemaCompra = Joi.object({
  nome: Joi.string().min(3).required(),
  numero: Joi.number().integer().min(1).max(1000).required(),
  telefone: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
});

app.post('/intencao-compra', async (req, res) => {
  const { nome, numero, telefone } = req.body;
  
  const { error } = schemaCompra.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

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
    res.status(500).json({ error: 'Erro interno. Tente novamente mais tarde.' });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
