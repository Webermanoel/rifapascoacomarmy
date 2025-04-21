const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); 
const { Pool } = require('pg'); 

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

pool.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no banco de dados:', err);
    return;
  }
  console.log('✅ Conexão estabelecida com o banco de dados PostgreSQL!');
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

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

app.get('/exportar-rifas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compras_rifa');

    let csv = 'ID,Nome,Telefone,Número,Pago\n';
    result.rows.forEach(r => {
      csv += `${r.id},${r.nome},${r.telefone},${r.numero},${r.pago}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=rifas.csv');
    res.send(csv);
  } catch (err) {
    console.error('Erro ao exportar rifas: ', err);
    res.status(500).send('Erro ao exportar rifas');
  }
});

app.get('/listar', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM compras_rifa WHERE pago = true ORDER BY numero ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar dados' });
  }
});

app.get('/imprimir', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compras_rifa ORDER BY numero ASC');

    let html = `<!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Rifas - Impressão</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📄 Rifas</h1>
        <button onclick="window.print()">🖨️ Imprimir</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Número</th>
              <th>Pago</th>
            </tr>
          </thead>
          <tbody>`;

    result.rows.forEach(r => {
      html += `
        <tr>
          <td>${r.id || ''}</td>
          <td>${r.nome || ''}</td>
          <td>${r.telefone || ''}</td>
          <td>${r.numero || ''}</td>
          <td>${r.pago ? 'Sim' : 'Não'}</td>
        </tr>`;
    });

    html += `</tbody></table></body></html>`;

    res.send(html);

  } catch (err) {
    console.error('❌ Erro ao gerar página de impressão:', err);
    res.status(500).send('Erro ao carregar os dados para impressão.');
  }
});



app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
