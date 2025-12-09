document.addEventListener('DOMContentLoaded', () => {
    // --- USER GREETING ---
    const userGreeting = document.getElementById('user-greeting');
    try {
        const userDataString = sessionStorage.getItem('userData');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            
            // CORREÇÃO: Usando a propriedade 'usuario' em vez de 'apelido'
            if (userData && userData.usuario) {
                // Transforma a primeira letra em maiúscula para um toque final
                const displayName = userData.usuario.charAt(0).toUpperCase() + userData.usuario.slice(1);
                userGreeting.textContent = `Olá, ${displayName}`;
            }
        }
    } catch (e) {
        console.error("Erro ao processar dados do usuário:", e);
        userGreeting.textContent = 'Olá!';
    }

    const menuLinks = {
        'menu-dashboard': 'dashboard-section',
        'menu-produtos': 'produtos-section',
        'menu-vendas': 'vendas-section',
        'menu-compras': 'compras-section'
    };

    const mainContent = document.getElementById('main-content');
    const sections = mainContent.children;
    const navLinks = document.querySelectorAll('.main-menu a'); // Atualizado para o novo seletor
    const logoutButton = document.getElementById('menu-logout');

    function switchTab(targetId) {
        for (let section of sections) {
            if (!section.classList.contains('hidden') && section.id !== targetId) {
                section.classList.add('hidden');
            }
        }

        navLinks.forEach(link => link.classList.remove('active'));

        const targetSection = document.getElementById(targetId);
        const targetLink = document.getElementById(Object.keys(menuLinks).find(key => menuLinks[key] === targetId));

        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    Object.keys(menuLinks).forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSectionId = menuLinks[linkId];
                switchTab(targetSectionId);
            });
        }
    });

    // --- LOGOUT LOGIC ---
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userData');
        window.location.href = 'login.html';
    });

    // Set the initial active tab (e.g., Dashboard)
    switchTab('dashboard-section');
});
