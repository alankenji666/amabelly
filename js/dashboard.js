document.addEventListener('DOMContentLoaded', () => {
    const menuDashboard = document.getElementById('menu-dashboard');
    const totalInvestidoEl = document.getElementById('total-investido');
    const lucroPotencialEl = document.getElementById('lucro-potencial');
    const valorVendaTotalEl = document.getElementById('valor-venda-total');

    const formatCurrency = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const updateDashboard = async () => {
        if (!totalInvestidoEl || !lucroPotencialEl || !valorVendaTotalEl) return;

        totalInvestidoEl.textContent = 'Calculando...';
        lucroPotencialEl.textContent = 'Calculando...';
        valorVendaTotalEl.textContent = 'Calculando...';

        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos');
            if (!response.ok) {
                throw new Error('Falha ao carregar dados dos produtos.');
            }
            const produtos = await response.json();

            let totalInvestido = 0;
            let lucroPotencial = 0;
            let valorVendaTotal = 0;

            produtos.forEach(produto => {
                const estoque = parseInt(produto.estoque, 10) || 0;
                if (estoque > 0) { // Considera apenas produtos com estoque
                    const precoCusto = parseFloat(produto.precoCusto) || 0;
                    const despesa = parseFloat(produto.despesa) || 0;
                    const lucro = parseFloat(produto.lucro) || 0;
                    const precoVenda = parseFloat(produto.precoVenda) || 0;

                    totalInvestido += (precoCusto + despesa) * estoque;
                    lucroPotencial += lucro * estoque;
                    valorVendaTotal += precoVenda * estoque;
                }
            });

            totalInvestidoEl.textContent = formatCurrency(totalInvestido);
            lucroPotencialEl.textContent = formatCurrency(lucroPotencial);
            valorVendaTotalEl.textContent = formatCurrency(valorVendaTotal);

        } catch (error) {
            totalInvestidoEl.textContent = 'Erro';
            lucroPotencialEl.textContent = 'Erro';
            valorVendaTotalEl.textContent = 'Erro';
            console.error("Erro ao atualizar dashboard:", error);
        }
    };

    // Atualiza o dashboard quando o menu é clicado
    if (menuDashboard) {
        menuDashboard.addEventListener('click', (e) => {
            e.preventDefault();
            // Mostra a seção do dashboard e esconde as outras
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('produtos-section').classList.add('hidden');
            document.getElementById('vendas-section').classList.add('hidden');
            document.getElementById('compras-section').classList.add('hidden');
            
            updateDashboard(); // Chama a função para calcular e exibir os dados
        });
    }

    // Carrega os dados do dashboard na primeira vez que a página é aberta
    updateDashboard();
});