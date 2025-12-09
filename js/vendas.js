document.addEventListener('DOMContentLoaded', () => {
    const vendasSection = document.getElementById('vendas-section');
    if (!vendasSection) return;

    const buscaInput = document.getElementById('venda-produto-busca');
    const resultadosDiv = document.getElementById('venda-resultados-busca');
    const paginacaoDiv = document.getElementById('venda-paginacao');
    const sacolaDiv = document.getElementById('vendas-sacola-lista');
    const subtotalSpan = document.getElementById('vendas-sacola-subtotal');
    const totalFinalSpan = document.getElementById('vendas-sacola-total-final');
    const freteInput = document.getElementById('venda-frete');
    const descontoInput = document.getElementById('venda-desconto');
    const descontoMaximoSpan = document.getElementById('venda-desconto-maximo');
    const finalizarBtn = document.getElementById('finalizar-venda-btn');
    const feedbackDiv = document.getElementById('venda-feedback');

    let todosProdutos = [];
    let produtosFiltrados = [];
    let sacola = [];
    let produtosCarregados = false;
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 12;

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
        paginacaoDiv.innerHTML = '';
        if (produtosFiltrados.length === 0) {
            const termo = buscaInput.value;
            resultadosDiv.innerHTML = termo
                ? `<p class="venda-search-placeholder">Nenhum produto encontrado para "${termo}".</p>`
                : `<p class="venda-search-placeholder">Nenhum produto ativo encontrado.</p>`;
            return;
        }
        const totalPaginas = Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA);
        paginaAtual = Math.max(1, Math.min(paginaAtual, totalPaginas));
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        const produtosDaPagina = produtosFiltrados.slice(inicio, fim);
        produtosDaPagina.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'venda-resultado-card';
            const imageHtml = produto.imagem1 ? `<img src="${produto.imagem1}" alt="${produto.descricao}">` : `<div class="venda-image-placeholder">Sem Imagem</div>`;
            card.innerHTML = `${imageHtml}<div class="venda-card-codigo">#${produto.codigo}</div><div class="desc">${produto.descricao}</div><div class="price">${formatCurrency(produto.precoVenda)}</div>`;
            card.addEventListener('click', () => adicionarASacola(produto));
            resultadosDiv.appendChild(card);
        });
        if (totalPaginas > 1) renderizarPaginacao(totalPaginas);
    }

    function renderizarPaginacao(totalPaginas) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Anterior';
        prevBtn.disabled = paginaAtual === 1;
        prevBtn.addEventListener('click', () => { if (paginaAtual > 1) { paginaAtual--; renderizarPagina(); } });
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Próxima';
        nextBtn.disabled = paginaAtual === totalPaginas;
        nextBtn.addEventListener('click', () => { if (paginaAtual < totalPaginas) { paginaAtual++; renderizarPagina(); } });
        const infoPagina = document.createElement('span');
        infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        paginacaoDiv.appendChild(prevBtn);
        paginacaoDiv.appendChild(infoPagina);
        paginacaoDiv.appendChild(nextBtn);
    }

    function filtrarProdutos() {
        const termo = buscaInput.value.toLowerCase();
        produtosFiltrados = todosProdutos.filter(p => (p.descricao || '').toLowerCase().includes(termo) || (String(p.codigo) || '').toLowerCase().includes(termo));
        paginaAtual = 1;
        renderizarPagina();
    }

    function adicionarASacola(produto) {
        const itemExistente = sacola.find(item => item.codigo === produto.codigo);
        if (itemExistente) {
            if (itemExistente.quantidade < produto.estoque) itemExistente.quantidade++;
        } else {
            if (produto.estoque > 0) sacola.push({ ...produto, quantidade: 1 });
        }
        buscaInput.value = '';
        filtrarProdutos();
        renderizarSacola();
    }

    function renderizarSacola() {
        sacolaDiv.innerHTML = '';
        const isSacolaEmpty = sacola.length === 0;
        freteInput.disabled = isSacolaEmpty;
        descontoInput.disabled = isSacolaEmpty;
        if (isSacolaEmpty) {
            sacolaDiv.innerHTML = '<p style="text-align: center; color: #888;">A sacola está vazia.</p>';
            freteInput.value = '0,00';
            descontoInput.value = '0,00';
        }
        descontoMaximoSpan.textContent = '';
        sacola.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'sacola-item';
            itemDiv.innerHTML = `
                <div class="sacola-item-details">
                    <div class="sacola-item-codigo">#${item.codigo}</div>
                    <div class="sacola-item-descricao">${item.descricao}</div>
                </div>
                <div class="sacola-item-quantidade"><input type="number" value="${item.quantidade}" min="1" max="${item.estoque}" data-codigo="${item.codigo}"></div>
                <div class="sacola-item-subtotal">${formatCurrency(item.quantidade * item.precoVenda)}</div>
                <button class="sacola-item-remover" data-codigo="${item.codigo}">&times;</button>
            `;
            sacolaDiv.appendChild(itemDiv);
        });
        calcularTotal();
    }

    function parseCurrency(value) {
        return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }

    function calcularTotal() {
        const subtotalVenda = sacola.reduce((acc, item) => acc + (item.quantidade * item.precoVenda), 0);
        const subtotalMinimo = sacola.reduce((acc, item) => acc + (item.quantidade * item.precoMinimo), 0);
        const descontoMaximo = subtotalVenda - subtotalMinimo;
        if (descontoMaximo > 0) {
            descontoMaximoSpan.textContent = `(Máx: ${formatCurrency(descontoMaximo)})`;
        } else {
            descontoMaximoSpan.textContent = '';
        }
        let frete = parseCurrency(freteInput.value);
        let desconto = parseCurrency(descontoInput.value);
        if (desconto > subtotalVenda) {
            desconto = subtotalVenda;
            descontoInput.value = subtotalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        }
        const totalFinal = subtotalVenda + frete - desconto;
        subtotalSpan.textContent = formatCurrency(subtotalVenda);
        totalFinalSpan.textContent = formatCurrency(Math.max(0, totalFinal));
    }

    function formatInputAsCurrency(input) {
        let value = input.value.replace(/\D/g, '');
        value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        if (value === 'NaN') value = '0,00';
        input.value = value;
    }

    freteInput.addEventListener('input', () => { formatInputAsCurrency(freteInput); calcularTotal(); });
    descontoInput.addEventListener('input', () => { formatInputAsCurrency(descontoInput); calcularTotal(); });

    function atualizarQuantidade(codigo, quantidade) {
        const item = sacola.find(i => i.codigo === codigo);
        if (item) {
            const estoqueMax = todosProdutos.find(p => p.codigo === codigo).estoque;
            item.quantidade = Math.min(Math.max(quantidade, 1), estoqueMax);
        }
        renderizarSacola();
    }

    function removerDaSacola(codigo) {
        sacola = sacola.filter(item => item.codigo !== codigo);
        renderizarSacola();
    }

    function finalizarVenda() {
        if (sacola.length === 0) {
            feedbackDiv.textContent = 'A sacola está vazia.';
            feedbackDiv.style.color = 'orange';
            setTimeout(() => feedbackDiv.textContent = '', 3000);
            return;
        }
        const subtotal = sacola.reduce((acc, item) => acc + (item.quantidade * item.precoVenda), 0);
        const frete = parseCurrency(freteInput.value);
        const desconto = parseCurrency(descontoInput.value);
        const totalFinal = subtotal + frete - desconto;
        const venda = { itens: sacola, subtotal, frete, desconto, totalFinal, data: new Date().toISOString() };
        console.log('Venda Finalizada:', JSON.stringify(venda, null, 2));
        feedbackDiv.textContent = '✅ Venda simulada com sucesso!';
        feedbackDiv.style.color = 'green';
        sacola = [];
        renderizarSacola();
        setTimeout(() => { feedbackDiv.textContent = ''; feedbackDiv.style.color = ''; }, 3000);
    }

    buscaInput.addEventListener('input', filtrarProdutos);
    finalizarBtn.addEventListener('click', finalizarVenda);
    sacolaDiv.addEventListener('change', (e) => { if (e.target.tagName === 'INPUT') atualizarQuantidade(e.target.dataset.codigo, parseInt(e.target.value, 10)); });
    sacolaDiv.addEventListener('click', (e) => { if (e.target.classList.contains('sacola-item-remover')) removerDaSacola(e.target.dataset.codigo); });

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class' && !vendasSection.classList.contains('hidden') && !produtosCarregados) {
                carregarProdutos();
            }
        }
    });
    observer.observe(vendasSection, { attributes: true });

    if (!vendasSection.classList.contains('hidden')) carregarProdutos();
    renderizarSacola();
});