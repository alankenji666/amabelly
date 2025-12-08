document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('header nav ul li a');
    const sections = {
        'menu-dashboard': document.getElementById('dashboard-section'),
        'menu-produtos': document.getElementById('produtos-section'),
        'menu-vendas': document.getElementById('vendas-section'),
        'menu-compras': document.getElementById('compras-section'),
    };

    const showSection = (targetId) => {
        // Esconde todas as seções
        Object.values(sections).forEach(section => {
            if (section) section.classList.add('hidden');
        });

        // Remove a classe 'active' de todos os menus
        menuItems.forEach(item => item.classList.remove('active'));

        // Mostra a seção correta e ativa o menu correspondente
        const targetSection = sections[targetId];
        const targetMenuItem = document.getElementById(targetId);

        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        if (targetMenuItem) {
            targetMenuItem.classList.add('active');
        }

        // Executa a função de carregamento de dados específica da seção
        if (targetId === 'menu-dashboard' && typeof window.updateDashboard === 'function') {
            window.updateDashboard();
        } else if (targetId === 'menu-produtos' && typeof window.fetchAndRenderProdutos === 'function') {
            window.fetchAndRenderProdutos();
        }
    };

    // Adiciona o listener de clique para TODOS os itens do menu
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(e.target.id);
        });
    });

    // Exibe a seção inicial do Dashboard e carrega seus dados
    showSection('menu-dashboard');
});