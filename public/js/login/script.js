const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const submitButton = document.getElementById('submit-button');

        submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            const username = usernameInput.value;
            const password = passwordInput.value;
            if (username === 'admin' && password === 'password') {
                window.location.href = './administrador.html';
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        });