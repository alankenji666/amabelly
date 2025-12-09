document.addEventListener('DOMContentLoaded', function() {
    const catalogoGrid = document.getElementById('catalogo-grid');

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    // CORREÇÃO: Buscar os produtos da API online, em vez de um arquivo local.
    fetch('https://project-445845663010.southamerica-east1.run.app/produtos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar produtos do servidor: ' + response.statusText);
            }
            return response.json();
        })
        .then(produtos => {
            if (!catalogoGrid) {
                console.error('Elemento com ID "catalogo-grid" não encontrado.');
                return;
            }

            // Assumindo que a API retorna somente produtos ativos.
            // Se houver um campo como `ativo`, o filtro pode ser reativado aqui.
            const produtosAtivos = produtos; // produtos.filter(p => p.ativo);
            catalogoGrid.innerHTML = '';

            produtosAtivos.forEach(produto => {
                const card = document.createElement('div');
                card.className = 'catalogo-card';

                let imageHtml;
                // Verificando se a propriedade `imagem1` existe e não está vazia
                if (produto.imagem1 && produto.imagem1.trim() !== '') {
                    imageHtml = `<div class="catalogo-image-container"><img src="${produto.imagem1}" alt="${produto.descricao}" class="catalogo-card-image"></div>`;
                } else {
                    imageHtml = `<div class="catalogo-image-container"><div class="image-placeholder"><span>Amabelly</span></div></div>`;
                }

                card.innerHTML = `
                    ${imageHtml}
                    <div class="catalogo-card-content">
                        <div class="catalogo-card-codigo">#${produto.codigo}</div>
                        <h2 class="catalogo-card-descricao">${produto.descricao}</h2>
                        <p class="catalogo-card-preco">${formatCurrency(produto.precoVenda)}</p>
                    </div>
                `;

                catalogoGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar os produtos:', error);
            if (catalogoGrid) {
                catalogoGrid.innerHTML = '<p>Não foi possível carregar os produtos. Verifique a conexão e tente novamente.</p>' ;
            }
        });
});
