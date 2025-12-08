document.addEventListener('DOMContentLoaded', () => {
    const menuLinks = {
        'menu-dashboard': 'dashboard-section',
        'menu-produtos': 'produtos-section',
        'menu-vendas': 'vendas-section',
        'menu-compras': 'compras-section'
    };

    const mainContent = document.getElementById('main-content');
    const sections = mainContent.children;
    const navLinks = document.querySelectorAll('header nav a');

    function switchTab(targetId) {
        // Hide the currently visible section, if it's not the target
        for (let section of sections) {
            if (!section.classList.contains('hidden') && section.id !== targetId) {
                section.classList.add('hidden');
            }
        }

        // Deactivate all nav links
        navLinks.forEach(link => link.classList.remove('active'));

        // Show the target section and activate the corresponding link
        const targetSection = document.getElementById(targetId);
        const targetLink = document.getElementById(Object.keys(menuLinks).find(key => menuLinks[key] === targetId));

        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    // Add click event listeners to all nav links
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

    // Set the initial active tab (e.g., Dashboard)
    switchTab('dashboard-section');
});