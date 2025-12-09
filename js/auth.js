document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const feedbackDiv = document.getElementById('login-feedback');
    const usuarioInput = document.getElementById('usuario');
    const senhaInput = document.getElementById('senha');
    const rememberMeCheckbox = document.getElementById('remember-me');

    // --- PRE-FILL FROM LOCAL STORAGE ---
    const rememberedUser = localStorage.getItem('rememberedUser');
    const rememberedPassword = localStorage.getItem('rememberedPassword');

    if (rememberedUser && rememberedPassword) {
        usuarioInput.value = rememberedUser;
        senhaInput.value = rememberedPassword;
        rememberMeCheckbox.checked = true;
    }

    // --- FORM SUBMISSION LOGIC ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const usuario = usuarioInput.value;
        const senha = senhaInput.value;
        const feedbackMessage = document.getElementById('login-feedback');

        feedbackMessage.textContent = 'Autenticando...';
        feedbackMessage.className = 'feedback-message success';

        try {
            const response = await fetch('https://project-445845663010.southamerica-east1.run.app/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, senha })
            });

            const data = await response.json();

            if (response.ok) {
                feedbackMessage.textContent = data.mensagem || 'Login realizado com sucesso!';
                feedbackMessage.className = 'feedback-message success';
                
                // --- HANDLE "REMEMBER ME" --- 
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('rememberedUser', usuario);
                    localStorage.setItem('rememberedPassword', senha);
                } else {
                    localStorage.removeItem('rememberedUser');
                    localStorage.removeItem('rememberedPassword');
                }

                // Store session status
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userData', JSON.stringify(data.user));

                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);

            } else {
                throw new Error(data.mensagem || data.error || data.erro || 'Erro desconhecido');
            }

        } catch (err) {
            feedbackMessage.textContent = err.message;
            feedbackMessage.className = 'feedback-message error';
        }
    });
});
