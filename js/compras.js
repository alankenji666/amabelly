document.addEventListener('DOMContentLoaded', () => {
    const formAddProduto = document.getElementById('form-add-produto');
    if (!formAddProduto) return;

    const feedbackDiv = document.getElementById('compras-feedback');
    const codigoInput = document.getElementById('codigo');
    const dataCompraInput = document.getElementById('dataCompra');

    async function setNextProductCode() {
        if (!codigoInput) return;
        codigoInput.value = 'Gerando...';
        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos');
            if (!response.ok) throw new Error('API indisponível para gerar código.');
            
            const produtos = await response.json();
            let nextCode = 'A100001'; // Default for the very first product

            if (produtos && produtos.length > 0) {
                const relevantCodes = produtos
                    .map(p => p.codigo)
                    .filter(c => c && c.match(/^A\d+$/i));

                if (relevantCodes.length > 0) {
                    const maxNumber = relevantCodes.reduce((max, code) => {
                        const numberPart = parseInt(code.substring(1), 10);
                        return numberPart > max ? numberPart : max;
                    }, 0);
                    nextCode = `A${maxNumber + 1}`;
                }
            }
            codigoInput.value = nextCode;
        } catch (error) {
            console.error("Erro ao gerar código do produto:", error);
            codigoInput.value = 'Erro ao gerar';
            if (feedbackDiv) {
                feedbackDiv.textContent = `❌ ${error.message}`;
                feedbackDiv.style.color = 'red';
            }
        }
    }

    function setupLinkProdutoParser() {
        const linkProdutoInput = document.getElementById('linkProduto');
        const siteInput = document.getElementById('site');
        const fornecedorInput = document.getElementById('fornecedor');

        if (!linkProdutoInput || !siteInput || !fornecedorInput) return;

        linkProdutoInput.addEventListener('input', () => {
            setTimeout(() => { // Use um pequeno delay para o valor ser colado
                try {
                    const url = new URL(linkProdutoInput.value);
                    siteInput.value = url.origin;
                    
                    const hostnameParts = url.hostname.replace('www.', '').split('.');
                    fornecedorInput.value = hostnameParts[0];
                } catch (error) {
                    // Ignora erros de URL inválida para permitir digitação manual
                }
            }, 100);
        });
    }

    if (dataCompraInput) dataCompraInput.value = new Date().toISOString().split('T')[0];

    function setupPriceCalculators() {
        const fields = {
            precoCusto: document.getElementById('precoCusto'),
            despesa: document.getElementById('despesa'),
            margemLucro: document.getElementById('margemLucro'),
            margemMinimo: document.getElementById('margemMinimo'),
            margemMaximo: document.getElementById('margemMaximo'),
            custoFinal: document.getElementById('custoFinal'),
            precoVenda: document.getElementById('precoVenda'),
            precoMinimo: document.getElementById('precoMinimo'),
            precoMaximo: document.getElementById('precoMaximo'),
            lucro: document.getElementById('lucro'),
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

    formAddProduto.addEventListener('submit', async (event) => {
        event.preventDefault();
        feedbackDiv.textContent = 'Adicionando produto...';
        feedbackDiv.style.color = 'blue';

        const formData = new FormData(formAddProduto);
        const data = Object.fromEntries(formData.entries());

        // Assegurando que valores calculados sejam enviados
        data.precoVenda = document.getElementById('precoVenda').value;
        data.precoMinimo = document.getElementById('precoMinimo').value;
        data.precoMaximo = document.getElementById('precoMaximo').value;
        data.lucro = document.getElementById('lucro').value;

        // Formata as margens para enviar com "%"
        data.margemLucro = `${data.margemLucro}%`;
        data.margemMinimo = `${data.margemMinimo}%`;
        data.margemMaximo = `${data.margemMaximo}%`;

        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Falha ao adicionar o produto.');

            feedbackDiv.textContent = '✅ Produto adicionado com sucesso!';
            feedbackDiv.style.color = 'green';
            formAddProduto.reset();
            
            await setNextProductCode();
            if(dataCompraInput) dataCompraInput.value = new Date().toISOString().split('T')[0];
            setupPriceCalculators();

        } catch (error) {
            feedbackDiv.textContent = `❌ Erro: ${error.message}`;
            feedbackDiv.style.color = 'red';
        }
    });

    // Inicialização da página de Compras
    setupPriceCalculators();
    setNextProductCode();
    setupLinkProdutoParser();
});