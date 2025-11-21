document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (!header) return;

    const backToTopButton = document.getElementById('back-to-top');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // --- Lógica do botão "Voltar ao Topo" ---
        if (backToTopButton) {
            if (currentScrollY > 300) { // Mostra o botão após rolar 300px
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        }

        // Adiciona a classe 'scrolled' se o usuário rolar mais de 50 pixels
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Esconde o header ao rolar para baixo, mostra ao rolar para cima
        if (currentScrollY > lastScrollY && currentScrollY > 150) { // Rolando para baixo
            header.classList.add('header--hidden');
        } else { // Rolando para cima
            header.classList.remove('header--hidden');
        }

        lastScrollY = currentScrollY;
    });

    // --- Evento de clique para o botão "Voltar ao Topo" ---
    if (backToTopButton) {
        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth' // Rolagem suave
            });
        });
    }
});