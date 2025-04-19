const cors = require('cors');
app.use(cors()); // Permite que o frontend acesse o backend


app.post('/sortear', async (req, res) => {
    const chave = req.body.chave; // Recebe a chave do corpo da requisição
    
    if (chave !== process.env.SORTEIO_KEY) { // Verifica se a chave é válida
      return res.status(401).json({ sucesso: false, mensagem: 'Acesso negado. Chave inválida.' });
    }
  
    try {
      const { rows } = await pool.query('SELECT * FROM compras_rifa WHERE pago = true'); // A consulta ao banco
  
      if (rows.length === 0) { // Se não houver números pagos
        return res.status(400).json({ sucesso: false, mensagem: 'Nenhum número pago encontrado para o sorteio.' });
      }
  
      const sorteado = rows[Math.floor(Math.random() * rows.length)]; // Realiza o sorteio
  
      res.json({
        sucesso: true,
        mensagem: 'Sorteio realizado com sucesso!',
        vencedor: {
          id: sorteado.id,
          nome: sorteado.nome,
          telefone: sorteado.telefone,
          numero: sorteado.numero
        }
      });
    } catch (err) {
      console.error('Erro ao realizar sorteio: ', err);
      res.status(500).json({ sucesso: false, mensagem: 'Erro ao realizar sorteio.' });
    }
  });
  