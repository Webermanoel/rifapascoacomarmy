const res = await fetch('/sortear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chave })
  });
  
    if (chave !== process.env.SORTEIO_KEY) {
      return res.status(401).json({ sucesso: false, mensagem: 'Acesso negado. Chave inválida.' });
    }
  
    try {
      const { rows } = await pool.query('SELECT * FROM compras_rifa WHERE pago = true');
  
      if (rows.length === 0) {
        return res.status(400).json({ sucesso: false, mensagem: 'Nenhum número pago encontrado para o sorteio.' });
      }
  
      const sorteado = rows[Math.floor(Math.random() * rows.length)];
  
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
  