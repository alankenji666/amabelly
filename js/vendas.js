document.addEventListener('DOMContentLoaded', () => {
    const buscaCodigoInput = document.getElementById('venda-busca-codigo');
    const buscaBtn = document.getElementById('venda-busca-btn');
    const produtoDisplay = document.getElementById('venda-produto-display');
    const produtoDetalhesDiv = document.getElementById('venda-produto-detalhes');
    const quantidadeInput = document.getElementById('venda-quantidade');
    const confirmarBtn = document.getElementById('venda-confirmar-btn');
    const feedbackDiv = document.getElementById('venda-feedback');
    let produtoEncontrado = null;

    const buscarProduto = async () => {
        const codigo = buscaCodigoInput.value.trim();
        if (!codigo) {
            alert('Por favor, digite um código de produto.');
            return;
        }

        feedbackDiv.textContent = 'Buscando...';
        feedbackDiv.style.color = 'blue';
        produtoDisplay.classList.add('hidden');

        try {
            const response = await fetch(`https://project-445845663010.southamerica-east1.run.app/produtos/${codigo}`);
            const produto = await response.json();
            
            if (!response.ok || produto.error) {
                throw new Error(produto.error || 'Produto não encontrado.');
            }
            
            produtoEncontrado = produto;
            produtoDetalhesDiv.innerHTML = `
                <p><strong>Descrição:</strong> ${produto.descricao}</p>
                <p><strong>Estoque Atual:</strong> ${produto.estoque}</p>
                <p><strong>Preço de Venda:</strong> R$ ${parseFloat(produto.precoVenda || 0).toFixed(2)}</p>
            `;
            quantidadeInput.max = produto.estoque;
            quantidadeInput.value = 1;
            produtoDisplay.classList.remove('hidden');
            feedbackDiv.textContent = '';

        } catch (error) {
            feedbackDiv.textContent = `❌ ${error.message}`;
            feedbackDiv.style.color = 'red';
            produtoEncontrado = null;
        }
    };

    const confirmarVenda = async () => {
        if (!produtoEncontrado) {
            alert('Nenhum produto selecionado para venda.');
            return;
        }

        const quantidadeVendida = parseInt(quantidadeInput.value, 10);
        if (isNaN(quantidadeVendida) || quantidadeVendida <= 0) {
            alert('Quantidade inválida.');
            return;
        }

        const estoqueAtual = parseInt(produtoEncontrado.estoque, 10);
        if (quantidadeVendida > estoqueAtual) {
            alert('Estoque insuficiente.');
            return;
        }

        const novoEstoque = estoqueAtual - quantidadeVendida;

        feedbackDiv.textContent = 'Confirmando venda...';
        feedbackDiv.style.color = 'blue';

        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // Enviando o 'codigo' para identificar o produto e o 'estoque' para atualizar.
                body: JSON.stringify({ 
                    codigo: produtoEncontrado.codigo, 
                    estoque: novoEstoque 
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Falha ao dar baixa no estoque.');
            }

            feedbackDiv.textContent = '✅ Venda confirmada e estoque atualizado com sucesso!';
            feedbackDiv.style.color = 'green';
            
            // Resetar a interface
            produtoDisplay.classList.add('hidden');
            buscaCodigoInput.value = '';
            produtoEncontrado = null;

        } catch (error) {
            feedbackDiv.textContent = `❌ Erro: ${error.message}`;
            feedbackDiv.style.color = 'red';
        }
    };

    if (buscaBtn) buscaBtn.addEventListener('click', buscarProduto);
    if (buscaCodigoInput) buscaCodigoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarProduto();
    });
    if (confirmarBtn) confirmarBtn.addEventListener('click', confirmarVenda);
});