(() => {
    // Imediatamente verifica o status de login a partir do sessionStorage.
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');

    // Se o usuário NÃO estiver logado ('isLoggedIn' não for 'true')...
    if (isLoggedIn !== 'true') {
        // ...redireciona imediatamente para a página de login.
        // Isso acontece antes que o navegador tenha chance de renderizar o conteúdo do index.html.
        window.location.href = 'login.html';
    }
    // Se o usuário ESTIVER logado, o script simplesmente termina,
    // e a execução normal da página (index.html) continua.
})();
