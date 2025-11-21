document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');

    // Função para aplicar o tema com base no localStorage
    function applyTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const isDarkMode = currentTheme === 'dark';
        
        document.body.classList.toggle('dark-mode', isDarkMode);

        if (themeToggleButton) {
            const newLabel = isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro';
            themeToggleButton.setAttribute('aria-label', newLabel);
        }
    }

    // Adiciona o evento de clique se o botão existir
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            applyTheme(); // Re-aplica para atualizar o aria-label
        });
    }

    // Aplica o tema assim que a página carrega
    applyTheme();
});