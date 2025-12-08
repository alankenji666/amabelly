document.addEventListener('DOMContentLoaded', () => {
    const vendasSection = document.getElementById('vendas-section');
    if (!vendasSection) return;

    // Seletores de Elementos
    const buscaInput = document.getElementById('venda-produto-busca');
    const resultadosDiv = document.getElementById('venda-resultados-busca');
    const paginacaoDiv = document.getElementById('venda-paginacao');
    const sacolaDiv = document.getElementById('vendas-sacola-lista');
    const totalSpan = document.getElementById('vendas-sacola-total');
    const finalizarBtn = document.getElementById('finalizar-venda-btn');
    const feedbackDiv = document.getElementById('venda-feedback');

    // Estado da Aplicação
    let todosProdutos = [];
    let produtosFiltrados = [];
    let sacola = [];
    let produtosCarregados = false;
    let paginaAtual = 1;
    const ITENS_POR_PAGINA = 12; // Aumentado para preencher melhor a tela

    // --- CARREGAMENTO E RENDERIZAÇÃO INICIAL ---

    async function carregarProdutos() {
        if (produtosCarregados) return;

        resultadosDiv.innerHTML = `<p class="venda-search-placeholder">Carregando produtos...</p>`;
        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos');
            if (!response.ok) throw new Error('Falha ao carregar produtos.');
            const data = await response.json();

            todosProdutos = data.filter(p => p.ativo === "Sim") || [];
            produtosFiltrados = todosProdutos; // Inicialmente, todos os produtos estão visíveis
            produtosCarregados = true;
            paginaAtual = 1;
            renderizarPagina(); // Renderiza a primeira página
        } catch (error) {
            resultadosDiv.innerHTML = `<p class="venda-search-placeholder">❌ Erro ao carregar produtos.</p>`;
            console.error(error);
        }
    }

    // --- LÓGICA DE RENDERIZAÇÃO E PAGINAÇÃO ---

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

            const imageHtml = produto.imagem1
                ? `<img src="${produto.imagem1}" alt="${produto.descricao}">`
                : `<div class="venda-image-placeholder">Sem Imagem</div>`;

            card.innerHTML = `
                ${imageHtml}
                <div class="desc">${produto.descricao}</div>
                <div class="price">R$ ${parseFloat(produto.precoVenda).toFixed(2)}</div>
            `;
            card.addEventListener('click', () => adicionarASacola(produto));
            resultadosDiv.appendChild(card);
        });

        if (totalPaginas > 1) {
            renderizarPaginacao(totalPaginas);
        }
    }

    function renderizarPaginacao(totalPaginas) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = 'Anterior';
        prevBtn.disabled = paginaAtual === 1;
        prevBtn.addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarPagina();
            }
        });

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Próxima';
        nextBtn.disabled = paginaAtual === totalPaginas;
        nextBtn.addEventListener('click', () => {
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarPagina();
            }
        });

        const infoPagina = document.createElement('span');
        infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;

        paginacaoDiv.appendChild(prevBtn);
        paginacaoDiv.appendChild(infoPagina);
        paginacaoDiv.appendChild(nextBtn);
    }

    // --- LÓGICA DE BUSCA ---

    function filtrarProdutos() {
        const termo = buscaInput.value.toLowerCase();
        produtosFiltrados = todosProdutos.filter(p =>
            (p.descricao || '').toLowerCase().includes(termo) ||
            (String(p.codigo) || '').toLowerCase().includes(termo)
        );
        paginaAtual = 1; // Reseta para a primeira página a cada nova busca
        renderizarPagina();
    }

    // --- LÓGICA DA SACOLA (Preservada) ---

    function adicionarASacola(produto) {
        const itemExistente = sacola.find(item => item.codigo === produto.codigo);
        if (itemExistente) {
            if (itemExistente.quantidade < produto.estoque) {
                itemExistente.quantidade++;
            }
        } else {
             if (produto.estoque > 0) {
                sacola.push({ ...produto, quantidade: 1 });
            }
        }
        buscaInput.value = ''; // Limpa a busca após adicionar
        filtrarProdutos();      // Mostra todos os produtos novamente
        renderizarSacola();
    }

    function renderizarSacola() {
        sacolaDiv.innerHTML = '';
        if (sacola.length === 0) {
            sacolaDiv.innerHTML = '<p style="text-align: center; color: #888;">A sacola está vazia.</p>';
            calcularTotal();
            return;
        }

        sacola.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'sacola-item';
            itemDiv.innerHTML = `
                <div class="sacola-item-descricao">${item.descricao}</div>
                <div class="sacola-item-quantidade">
                    <input type="number" value="${item.quantidade}" min="1" max="${item.estoque}" data-codigo="${item.codigo}">
                </div>
                <div class="sacola-item-subtotal">R$ ${(item.quantidade * item.precoVenda).toFixed(2)}</div>
                <button class="sacola-item-remover" data-codigo="${item.codigo}">&times;</button>
            `;
            sacolaDiv.appendChild(itemDiv);
        });
        calcularTotal();
    }

    function calcularTotal() {
        const total = sacola.reduce((acc, item) => acc + (item.quantidade * item.precoVenda), 0);
        totalSpan.textContent = `R$ ${total.toFixed(2)}`;
    }

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
        console.log('Venda Finalizada:', JSON.stringify(sacola, null, 2));
        feedbackDiv.textContent = '✅ Venda simulada com sucesso!';
        feedbackDiv.style.color = 'green';
        sacola = [];
        renderizarSacola();
        setTimeout(() => { feedbackDiv.textContent = ''; feedbackDiv.style.color = ''; }, 3000);
    }

    // --- EVENT LISTENERS ---

    buscaInput.addEventListener('input', filtrarProdutos);
    finalizarBtn.addEventListener('click', finalizarVenda);

    sacolaDiv.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT') {
            atualizarQuantidade(e.target.dataset.codigo, parseInt(e.target.value, 10));
        }
    });

    sacolaDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('sacola-item-remover')) {
            removerDaSacola(e.target.dataset.codigo);
        }
    });

    // Observer para carregar produtos quando a aba se tornar visível
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!vendasSection.classList.contains('hidden') && !produtosCarregados) {
                    carregarProdutos();
                }
            }
        }
    });

    observer.observe(vendasSection, { attributes: true });

    // Carregamento inicial se a aba já estiver visível ao carregar a página
    if (!vendasSection.classList.contains('hidden')) {
        carregarProdutos();
    }
    
    // Renderiza a sacola vazia inicialmente
    renderizarSacola();
});
