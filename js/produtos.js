document.addEventListener('DOMContentLoaded', () => {
    const produtosGrid = document.getElementById('produtos-grid');
    const buscaInput = document.getElementById('produtos-busca-input');
    const menuProdutos = document.getElementById('menu-produtos');

    // Modal de Edição
    const editModal = document.getElementById('edit-modal');
    const formEditProduto = document.getElementById('form-edit-produto');
    const editFeedback = document.getElementById('edit-feedback');
    const closeEditButton = editModal.querySelector('.close-button');

    // Modal de Visualização
    const viewModal = document.getElementById('view-modal');
    const closeViewButton = viewModal ? viewModal.querySelector('.close-button') : null;

    let produtosCache = [];

    async function fetchAndRenderProdutos() {
        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos');
            if (!response.ok) throw new Error('Erro ao carregar os produtos.');
            produtosCache = await response.json();
            renderProdutos(produtosCache);
        } catch (error) {
            produtosGrid.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    function renderProdutos(produtos) {
        if (!produtosGrid || !buscaInput) return;
        const searchTerm = buscaInput.value.toLowerCase();
        
        const produtosAtivos = produtos.filter(p => p.ativo === 'Sim');

        const produtosFiltrados = produtosAtivos.filter(p =>
            (p.codigo && p.codigo.toLowerCase().includes(searchTerm)) ||
            (p.descricao && p.descricao.toLowerCase().includes(searchTerm))
        );

        produtosGrid.innerHTML = '';
        produtosFiltrados.forEach(produto => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const imageHtml = produto.imagem1
                ? `<img src="${produto.imagem1}" alt="${produto.descricao}" class="product-card-image">`
                : `<div class="product-card-image-placeholder">Sem Imagem</div>`;

            card.innerHTML = `
                <div class="product-image-container">
                    ${imageHtml}
                </div>
                <h3>${produto.descricao} (${produto.codigo})</h3>
                <p><strong>Preço Venda:</strong> R$ ${parseFloat(produto.precoVenda || 0).toFixed(2)}</p>
                <p><strong>Estoque:</strong> ${produto.estoque || 0}</p>
                <div class="product-actions">
                    <button class="view-button">Visualizar</button>
                    <button class="edit-button">Editar</button>
                    <button class="inactive-button">Inativar</button>
                </div>
            `;
            card.querySelector('.view-button').addEventListener('click', () => openViewModal(produto));
            card.querySelector('.edit-button').addEventListener('click', () => openEditModal(produto));
            card.querySelector('.inactive-button').addEventListener('click', () => handleInactivateProduct(produto));
            produtosGrid.appendChild(card);
        });
    }

    function openViewModal(produto) {
        if (!viewModal) return;

        for (const key in produto) {
            const field = document.getElementById(`view-${key}`);
            if (field) {
                let value = produto[key] || 'N/A';
                field.textContent = value;
            }
        }

        const viewImage = document.getElementById('view-imagem1-display');
        const viewImagePlaceholder = document.getElementById('view-image-placeholder');
        if (produto.imagem1) {
            viewImage.src = produto.imagem1;
            viewImage.alt = produto.descricao;
            viewImage.classList.remove('hidden');
            viewImagePlaceholder.classList.add('hidden');
        } else {
            viewImage.classList.add('hidden');
            viewImagePlaceholder.classList.remove('hidden');
        }

        const viewLinkProduto = document.getElementById('view-linkProduto-link');
        if(viewLinkProduto) {
            viewLinkProduto.href = produto.linkProduto || '#';
            viewLinkProduto.textContent = produto.linkProduto ? 'Link para o produto' : 'N/A';
        }

        viewModal.classList.remove('hidden');
    }

    function setupEditPriceCalculators() {
        const fields = {
            precoCusto: document.getElementById('edit-precoCusto'),
            despesa: document.getElementById('edit-despesa'),
            margemLucro: document.getElementById('edit-margemLucro'),
            margemMinimo: document.getElementById('edit-margemMinimo'),
            margemMaximo: document.getElementById('edit-margemMaximo'),
            custoFinal: document.getElementById('edit-custoFinal'),
            precoVenda: document.getElementById('edit-precoVenda'),
            precoMinimo: document.getElementById('edit-precoMinimo'),
            precoMaximo: document.getElementById('edit-precoMaximo'),
            lucro: document.getElementById('edit-lucro'),
        };

        const calculate = () => {
            const precoCusto = parseFloat(fields.precoCusto.value) || 0;
            const despesa = parseFloat(fields.despesa.value) || 0;
            const margemLucro = parseFloat(fields.margemLucro.value) || 0;
            const margemMinimo = parseFloat(fields.margemMinimo.value) || 0;
            const margemMaximo = parseFloat(fields.margemMaximo.value) || 0;

            const custoFinal = precoCusto + despesa;
            const precoVenda = custoFinal * (1 + margemLucro / 100);
            const lucro = precoVenda - custoFinal;
            const precoMinimo = custoFinal * (1 + margemMinimo / 100);
            const precoMaximo = custoFinal * (1 + margemMaximo / 100);

            if(fields.custoFinal) fields.custoFinal.value = custoFinal.toFixed(2);
            if(fields.precoVenda) fields.precoVenda.value = precoVenda.toFixed(2);
            if(fields.lucro) fields.lucro.value = lucro.toFixed(2);
            if(fields.precoMinimo) fields.precoMinimo.value = precoMinimo.toFixed(2);
            if(fields.precoMaximo) fields.precoMaximo.value = precoMaximo.toFixed(2);
        };

        Object.values(fields).forEach(field => {
            if(field && !field.readOnly) field.addEventListener('input', calculate);
        });
        calculate();
    }

    function setupEditLinkProdutoParser() {
        const linkProdutoInput = document.getElementById('edit-linkProduto');
        const siteInput = document.getElementById('edit-site');
        const fornecedorInput = document.getElementById('edit-fornecedor');

        if (!linkProdutoInput || !siteInput || !fornecedorInput) return;

        linkProdutoInput.addEventListener('input', () => {
            setTimeout(() => {
                try {
                    const url = new URL(linkProdutoInput.value);
                    siteInput.value = url.origin;
                    const hostnameParts = url.hostname.replace('www.', '').split('.');
                    if (hostnameParts.length > 0) {
                        fornecedorInput.value = hostnameParts[0];
                    }
                } catch (error) {
                    // Ignora erros de URL inválida
                }
            }, 100);
        });
    }

    function openEditModal(produto) {
        formEditProduto.reset();
        document.getElementById('edit-linha').value = produto.linha;

        for (const key in produto) {
            const field = document.getElementById(`edit-${key}`);
            if (field) {
                 if (['margemLucro', 'margemMinimo', 'margemMaximo'].includes(key)) {
                    field.value = parseFloat(String(produto[key]).replace('%', '')) || 0;
                } else if (key === 'dataCompra' && produto[key]) {
                     try {
                        const dateParts = produto[key].split('/');
                        let formattedDate;
                        if (dateParts.length === 3) {
                           formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                        } else {
                           formattedDate = new Date(produto[key]).toISOString().split('T')[0];
                        }
                        field.value = formattedDate;
                     } catch(e) {
                        field.value = '';
                     }
                } else {
                    field.value = produto[key];
                }
            }
        }

        setupEditPriceCalculators();
        setupEditLinkProdutoParser();
        editModal.classList.remove('hidden');
    }

    formEditProduto.addEventListener('submit', async (event) => {
        event.preventDefault();
        editFeedback.textContent = 'Salvando...';
        editFeedback.style.color = 'blue';

        const formData = new FormData(formEditProduto);
        const data = Object.fromEntries(formData.entries());

        data.precoVenda = document.getElementById('edit-precoVenda').value;
        data.precoMinimo = document.getElementById('edit-precoMinimo').value;
        data.precoMaximo = document.getElementById('edit-precoMaximo').value;
        data.lucro = document.getElementById('edit-lucro').value;

        data.margemLucro = `${data.margemLucro}%`;
        data.margemMinimo = `${data.margemMinimo}%`;
        data.margemMaximo = `${data.margemMaximo}%`;

        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Falha ao atualizar.');

            editFeedback.textContent = '✅ Salvo com sucesso!';
            editFeedback.style.color = 'green';

            setTimeout(() => {
                editModal.classList.add('hidden');
                fetchAndRenderProdutos();
            }, 1000);

        } catch (error) {
            editFeedback.textContent = `❌ Erro: ${error.message}`;
            editFeedback.style.color = 'red';
        }
    });

    // **CORREÇÃO: Lógica de inativação ajustada para usar DELETE e o código do produto**
    async function handleInactivateProduct(produto) {
        if (!confirm(`Confirma a inativação do produto "${produto.descricao}" (${produto.codigo})?`)) return;

        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos', {
                method: 'DELETE', // Método DELETE
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: produto.codigo }) // Envia o código do produto
            });

            const result = await response.json();

            if (result.erro || !response.ok) {
                throw new Error(result.erro || result.message || 'Falha ao inativar.');
            }

            alert(result.mensagem || 'Produto inativado com sucesso!');
            fetchAndRenderProdutos(); // Re-renderiza a lista para remover o produto inativo

        } catch (error) {
            alert(`Erro ao inativar o produto: ${error.message}`);
        }
    }

    if (closeEditButton) closeEditButton.addEventListener('click', () => editModal.classList.add('hidden'));
    if (closeViewButton) closeViewButton.addEventListener('click', () => viewModal.classList.add('hidden'));
    if (buscaInput) buscaInput.addEventListener('input', () => renderProdutos(produtosCache));
    if (menuProdutos) {
        menuProdutos.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('produtos-section').classList.remove('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
            document.getElementById('vendas-section').classList.add('hidden');
            document.getElementById('compras-section').classList.add('hidden');
            buscaInput.value = '';
            fetchAndRenderProdutos();
        });
    }
});
