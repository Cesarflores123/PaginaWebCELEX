const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const submitButton = document.getElementById('submit-button');

        submitButton.addEventListener('click', (e) => {
            e.preventDefault();
            const username = usernameInput.value;
            const password = passwordInput.value;
            if (username === 'admin' && password === 'Adminpass*1') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Acceso concedido!',
                    text: 'Redirigiendo al panel de administración...',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    window.location.href = './administrador.html';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Acceso denegado',
                    text: 'Usuario o contraseña incorrectos.',
                    confirmButtonText: 'Intentar de nuevo'
                });
            }
        });