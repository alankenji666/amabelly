document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos da UI ---
    const vendasSection = document.getElementById('vendas-section');
    const buscaInput = document.getElementById('venda-produto-busca');
    const resultadosDiv = document.getElementById('venda-resultados-busca');
    const sacolaDiv = document.getElementById('vendas-sacola-lista');
    const subtotalSpan = document.getElementById('vendas-sacola-subtotal');
    const totalFinalSpan = document.getElementById('vendas-sacola-total-final');
    const freteInput = document.getElementById('venda-frete');
    const descontoInput = document.getElementById('venda-desconto');
    const descontoMaximoSpan = document.getElementById('venda-desconto-maximo');
    const finalizarBtn = document.getElementById('finalizar-venda-btn');
    const feedbackDiv = document.getElementById('venda-feedback');
    const paginacaoDiv = document.getElementById('venda-paginacao');
    // NOVOS CAMPOS
    const nomeClienteInput = document.getElementById('venda-nome-cliente');
    const formaPagamentoSelect = document.getElementById('venda-forma-pagamento');

    // --- Estado da Aplicação ---
    let todosProdutos = [];
    let produtosFiltrados = [];
    let sacola = [];
    let produtosCarregados = false;
    const ITENS_POR_PAGINA = 12;
    let paginaAtual = 1;

    // --- Lógica Principal ---

    // Carrega os produtos quando a aba de vendas se torna visível.
    const observer = new MutationObserver(() => {
        if (!vendasSection.classList.contains('hidden')) {
            carregarProdutos();
        }
    });
    observer.observe(vendasSection, { attributes: true, attributeFilter: ['class'] });

    async function carregarProdutos() {
        if (produtosCarregados) return;
        resultadosDiv.innerHTML = `<p class="venda-search-placeholder">Carregando produtos...</p>`;
        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos');
            if (!response.ok) throw new Error('Falha ao carregar produtos.');
            const data = await response.json();
            todosProdutos = data.filter(p => p.ativo === "Sim") || [];
            produtosFiltrados = todosProdutos;
            produtosCarregados = true;
            paginaAtual = 1;
            renderizarPagina();
        } catch (error) {
            resultadosDiv.innerHTML = `<p class="venda-search-placeholder">❌ Erro ao carregar produtos.</p>`;
            console.error(error);
        }
    }

    function renderizarPagina() {
        resultadosDiv.innerHTML = '';
        if (produtosFiltrados.length === 0) {
            resultadosDiv.innerHTML = `<p class="venda-search-placeholder">Nenhum produto encontrado.</p>`;
            paginacaoDiv.innerHTML = '';
            return;
        }
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const produtosDaPagina = produtosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
        produtosDaPagina.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'venda-resultado-card';
            card.dataset.codigo = produto.codigo;
            const imagemHTML = produto.imagem1 ? `<img src="${produto.imagem1}" alt="${produto.descricao}">` : '<div class="venda-image-placeholder">Sem Imagem</div>';
            card.innerHTML = `${imagemHTML}<div class="desc">${produto.descricao}</div><div class="price">R$ ${parseFloat(produto.precoVenda).toFixed(2)}</div>`;
            card.addEventListener('click', () => adicionarASacola(produto));
            resultadosDiv.appendChild(card);
        });
        renderizarPaginacao();
    }

    function renderizarPaginacao() {
        paginacaoDiv.innerHTML = '';
        const totalPaginas = Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA);
        if (totalPaginas <= 1) return;
        const btnAnterior = document.createElement('button');
        btnAnterior.textContent = '< Anterior';
        btnAnterior.disabled = paginaAtual === 1;
        btnAnterior.addEventListener('click', () => { if (paginaAtual > 1) { paginaAtual--; renderizarPagina(); } });
        const paginaInfo = document.createElement('span');
        paginaInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        const btnProxima = document.createElement('button');
        btnProxima.textContent = 'Próxima >';
        btnProxima.disabled = paginaAtual === totalPaginas;
        btnProxima.addEventListener('click', () => { if (paginaAtual < totalPaginas) { paginaAtual++; renderizarPagina(); } });
        paginacaoDiv.appendChild(btnAnterior); paginacaoDiv.appendChild(paginaInfo); paginacaoDiv.appendChild(btnProxima);
    }

    function filtrarProdutos() {
        const termo = buscaInput.value.toLowerCase();
        produtosFiltrados = todosProdutos.filter(p => p.descricao.toLowerCase().includes(termo) || p.codigo.toLowerCase().includes(termo));
        paginaAtual = 1;
        renderizarPagina();
    }

    function adicionarASacola(produto) {
        const itemExistente = sacola.find(item => item.codigo === produto.codigo);
        if (itemExistente) { itemExistente.quantidade++; } else { sacola.push({ ...produto, quantidade: 1 }); }
        renderizarSacola();
    }

    function removerDaSacola(codigo) {
        sacola = sacola.filter(item => item.codigo !== codigo);
        renderizarSacola();
    }

    function atualizarQuantidade(codigo, quantidade) {
        const item = sacola.find(item => item.codigo === codigo);
        if (item) { quantidade > 0 ? item.quantidade = quantidade : removerDaSacola(codigo); }
        renderizarSacola();
    }

    function renderizarSacola() {
        sacolaDiv.innerHTML = sacola.length === 0 ? '<p>A sacola está vazia.</p>' : '';
        sacola.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'sacola-item';
            itemDiv.innerHTML = `
                <div class="sacola-item-details"><span class="sacola-item-descricao">${item.descricao}</span><span class="sacola-item-codigo">Cód: ${item.codigo}</span></div>
                <div class="sacola-item-quantidade"><input type="number" value="${item.quantidade}" min="1" data-codigo="${item.codigo}"></div>
                <div class="sacola-item-preco">R$ ${(item.quantidade * item.precoVenda).toFixed(2)}</div>
                <button class="sacola-item-remover" data-codigo="${item.codigo}">❌</button>
            `;
            sacolaDiv.appendChild(itemDiv);
        });
        sacolaDiv.querySelectorAll('.sacola-item-remover').forEach(btn => btn.addEventListener('click', () => removerDaSacola(btn.dataset.codigo)));
        atualizarTotais();
    }
    
    function parseCurrency(value) { return parseFloat(String(value).replace(/[^0-9,-]/g, '').replace(',', '.')) || 0; }
    function formatCurrency(value) { return `R$ ${value.toFixed(2).replace('.', ',')}`; }
    
    function atualizarTotais() {
        const subtotal = sacola.reduce((acc, item) => acc + (item.quantidade * item.precoVenda), 0);
        const frete = parseCurrency(freteInput.value);
        const desconto = parseCurrency(descontoInput.value);
        subtotalSpan.textContent = formatCurrency(subtotal);
        totalFinalSpan.textContent = formatCurrency(subtotal + frete - desconto);
        const descontoMaximo = sacola.reduce((acc, item) => acc + (((parseFloat(item.precoVenda) || 0) - ((parseFloat(item.precoCusto) || 0) + (parseFloat(item.despesa) || 0))) * item.quantidade), 0);
        descontoMaximoSpan.textContent = descontoMaximo > 0 ? `(Sugestão máx: ${formatCurrency(descontoMaximo)})` : '';
    }

    async function finalizarVenda() {
        if (sacola.length === 0) {
            feedbackDiv.textContent = 'A sacola está vazia.';
            feedbackDiv.style.color = 'orange';
            setTimeout(() => feedbackDiv.textContent = '', 3000);
            return;
        }

        // **NOVA VALIDAÇÃO E CAPTURA**
        const nomeCliente = nomeClienteInput.value.trim();
        if (!nomeCliente) {
            feedbackDiv.textContent = 'Por favor, informe o nome do cliente.';
            feedbackDiv.style.color = 'orange';
            setTimeout(() => feedbackDiv.textContent = '', 3000);
            nomeClienteInput.focus();
            return;
        }
        const formaPagamento = formaPagamentoSelect.value;

        finalizarBtn.disabled = true;
        finalizarBtn.textContent = 'Finalizando...';

        try {
            const userData = JSON.parse(sessionStorage.getItem('userData') || 'null');
            const codVendedor = userData ? userData.codigo : 'VEND-OFFLINE';
            const frete = parseCurrency(freteInput.value);
            const desconto = parseCurrency(descontoInput.value);
            const totalFinal = sacola.reduce((acc, item) => acc + (item.quantidade * item.precoVenda), 0) + frete - desconto;

            const vendaParaAPI = {
                codigo: `V-${Date.now()}`,
                nome_cliente: nomeCliente, // Usando valor capturado
                cod_vendedor: codVendedor,
                valor_total: totalFinal,
                valor_frete: frete,
                forma_pagamento: formaPagamento, // Usando valor capturado
                desconto: desconto,
                itens: sacola.map(item => ({ cod: item.codigo, qtd: item.quantidade, preco: parseFloat(item.precoVenda) || 0 }))
            };

            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/vendas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vendaParaAPI)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro ao registrar a venda.');

            feedbackDiv.textContent = `✅ Venda ${result.codigo} registrada com sucesso!`;
            feedbackDiv.style.color = 'green';
            
            // **Limpando todos os campos**
            sacola = [];
            freteInput.value = '0,00';
            descontoInput.value = '0,00';
            nomeClienteInput.value = '';
            formaPagamentoSelect.value = 'PIX'; // Reset para o padrão
            renderizarSacola(); 

        } catch (error) {
            feedbackDiv.textContent = `❌ Erro: ${error.message}`;
            feedbackDiv.style.color = 'red';
        } finally {
            setTimeout(() => {
                finalizarBtn.disabled = false;
                finalizarBtn.textContent = 'Finalizar Venda';
                feedbackDiv.textContent = '';
                feedbackDiv.style.color = '';
            }, 5000);
        }
    }

    // --- Listeners ---
    buscaInput.addEventListener('input', filtrarProdutos);
    finalizarBtn.addEventListener('click', finalizarVenda);
    sacolaDiv.addEventListener('change', e => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
            atualizarQuantidade(e.target.dataset.codigo, parseInt(e.target.value, 10));
        }
    });
    freteInput.addEventListener('change', atualizarTotais);
    descontoInput.addEventListener('change', atualizarTotais);
});
