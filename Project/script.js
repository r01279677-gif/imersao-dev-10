document.addEventListener('DOMContentLoaded', () => {
    // Variável global para armazenar a lista de livros carregada
    let allBooks = [];
    let originalBookOrder = []; // Armazena a ordem original dos livros

    const bookContainer = document.getElementById('book-container');
    const searchInput = document.getElementById('search-input');
    const sortButton = document.getElementById('sort-button');
    const languageSelect = document.getElementById('language-select');
    const paginationContainer = document.getElementById('pagination-container');
    const loadingMessage = document.getElementById('loading-message');
    const filterNav = document.querySelector('.filter-nav');

    // Variável para controlar o estado da ordenação: 'asc' (ascendente) ou 'desc' (descendente)
    let currentSortOrder = 'asc';
    // Lê o idioma salvo ou usa 'pt-br' como padrão
    let currentLanguage = localStorage.getItem('selectedLanguage') || 'pt-br';
    // Estado da paginação
    // Estado dos favoritos
    let favoriteBooks = [];

    let currentPage = 1;
    const booksPerPage = 12; // Defina quantos livros por página

    // Função principal para carregar e inicializar o site
    function showSkeletonLoaders() {
        bookContainer.innerHTML = ''; // Limpa o container
        for (let i = 0; i < booksPerPage; i++) {
            const skeletonCard = `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    <div class="skeleton skeleton-text" style="width: 90%;"></div>
                    <div class="skeleton skeleton-text" style="width: 70%;"></div>
                </div>
            `;
            bookContainer.insertAdjacentHTML('beforeend', skeletonCard);
        }
    }

    async function initializeApp() {
        try {
            loadFavorites(); // Carrega os favoritos do localStorage
            const response = await fetch('./books.json');
            languageSelect.value = currentLanguage; // Sincroniza o dropdown com o idioma carregado
            allBooks = await response.json();
            originalBookOrder = [...allBooks]; // Salva a ordem original
            createCategoryFilters(); // 1. Cria os filtros primeiro
            displayBooks(getCurrentFilteredList()); // Usa a lista já filtrada na inicialização
            setupEventListeners();
            loadingMessage.style.display = 'none'; // Esconde a mensagem de carregamento
            updateClearButtonVisibility(); // Verifica o estado inicial
        } catch (error) {
            console.error('Erro ao carregar os livros:', error);
            bookContainer.innerHTML = '<p class="no-results-message">Não foi possível carregar a lista de livros.</p>';
            loadingMessage.style.display = 'none'; // Esconde a mensagem de carregamento em caso de erro
        }
    }

    showSkeletonLoaders(); // Mostra os esqueletos imediatamente

    // Cria e gerencia os botões de paginação
    function setupPagination(bookList) {
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(bookList.length / booksPerPage);

        if (pageCount <= 1) return; // Não mostra paginação se houver apenas 1 página

        for (let i = 1; i <= pageCount; i++) {
            const button = document.createElement('button');
            button.className = 'pagination-button';
            button.innerText = i;

            if (i === currentPage) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                currentPage = i;
                // Redesenha os livros para a nova página, mantendo a lista filtrada/ordenada atual
                const currentFilteredList = getCurrentFilteredList();
                displayBooks(currentFilteredList);
                window.scrollTo(0, 0); // Rola para o topo da página
            });
            paginationContainer.appendChild(button);
        }
    }

    // Função auxiliar para obter a versão traduzida de um livro, se aplicável
    function getTranslatedBook(book) {
        // Verifica se o livro tem um idioma definido, se há traduções e se a tradução para o idioma atual existe.
        if (book.language && currentLanguage !== book.language && book.translations && book.translations[currentLanguage]) {
            // Retorna uma nova versão do livro com os campos traduzidos
            return { ...book, ...book.translations[currentLanguage] };
        }
        // Retorna o livro original se não houver tradução
        return book;
    }

    function displayBooks(bookList) {
        setupPagination(bookList); // Configura a paginação para a lista atual

        bookContainer.innerHTML = ''; // Limpa o container

        if (bookList.length === 0) {
            const searchTerm = searchInput.value.trim();
            let message = 'Nenhum livro encontrado para os filtros aplicados.';
            
            if (searchTerm) {
                // Escapa o HTML para segurança
                const safeSearchTerm = searchTerm.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                message = `Nenhum livro encontrado para a busca "<strong>${safeSearchTerm}</strong>".`;
            }
            bookContainer.innerHTML = `<p class="no-results-message">${message}</p>`;
            return; // Encerra a função aqui se não houver livros
        }

        // Calcula os livros para a página atual
        const startIndex = (currentPage - 1) * booksPerPage;
        const endIndex = startIndex + booksPerPage;
        const paginatedBooks = bookList.slice(startIndex, endIndex);

        paginatedBooks.forEach((book, index) => {
            const displayBook = getTranslatedBook(book);
            // Usaremos o título como identificador único para os favoritos
            const bookId = displayBook.title;
            const isFavorite = favoriteBooks.includes(bookId);

            const cardLink = document.createElement('a');
            const bookTitleForUrl = encodeURIComponent(bookId);
            cardLink.href = `./book.html?title=${bookTitleForUrl}`;
            cardLink.className = 'book-card fade-in';
            
            cardLink.style.animationDelay = `${index * 0.05}s`;
            
            cardLink.innerHTML = `
                <div class="book-card-content">
                    <h2>${displayBook.title} (${displayBook.year})</h2>
                    <p class="author">por ${displayBook.author}</p>
                    <p>${displayBook.description}</p>
                    <span class="book-category">${displayBook.category}</span>
                    <button class="favorite-button ${isFavorite ? 'favorited' : ''}" data-book-id="${bookId}" aria-label="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9.8 1.5 13.7 13.5 6.6 20.5l-111.3 108.6 26.2 153.1c1.7 9.8-8.7 17.5-17.5 12.9L288 439.6l-136.8 72.2c-8.9 4.7-19.2-3.1-17.5-12.9l26.2-153.1L6.6 200.5c-7.1-7-3.2-19 6.6-20.5l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0z"/></svg>
                    </button>
                </div>
            `;
            bookContainer.appendChild(cardLink);
        });
    }

    // --- Funções para Gerenciar Favoritos ---
    function loadFavorites() {
        favoriteBooks = JSON.parse(localStorage.getItem('favoriteBooks')) || [];
    }

    function saveFavorites() {
        localStorage.setItem('favoriteBooks', JSON.stringify(favoriteBooks));
    }

    function toggleFavorite(bookId) {
        const bookIndex = favoriteBooks.indexOf(bookId);
        if (bookIndex > -1) {
            favoriteBooks.splice(bookIndex, 1); // Remove dos favoritos
        } else {
            favoriteBooks.push(bookId); // Adiciona aos favoritos
        }
        saveFavorites();
    }

    // Adiciona um ouvinte de evento delegado para os botões de favorito
    if (bookContainer) {
        bookContainer.addEventListener('click', (event) => {
            const favoriteButton = event.target.closest('.favorite-button');
            if (favoriteButton) {
                event.preventDefault(); // Impede a navegação ao clicar no botão
                event.stopPropagation(); // Impede que o clique se propague para o link do card
                const bookId = favoriteButton.dataset.bookId;
                toggleFavorite(bookId);
                favoriteButton.classList.toggle('favorited'); // Atualiza a aparência do botão
                favoriteButton.setAttribute('aria-label', favoriteButton.classList.contains('favorited') ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
            }
            updateFavoriteCount(); // Atualiza o contador de favoritos no filtro
        });
    }

    // Função para atualizar o contador de favoritos no botão de filtro
    function updateFavoriteCount() {
        const favoritesButton = document.querySelector('.filter-button[data-category="Favoritos"] .category-count');
        if (favoritesButton) {
            favoritesButton.textContent = favoriteBooks.length;
        }
    }

    // Cria e configura os botões de filtro de categoria
    function createCategoryFilters() {
        const savedCategory = localStorage.getItem('selectedCategory') || 'Todos';
        // Extrai categorias únicas da lista de livros
        const categories = ['Todos', ...new Set(allBooks.map(book => book.category))];

        // Calcula a contagem de livros para cada categoria
        const categoryCounts = allBooks.reduce((acc, book) => {
            acc[book.category] = (acc[book.category] || 0) + 1;
            return acc;
        }, {});
        categoryCounts['Todos'] = allBooks.length;


        // Mapeia categorias para ícones do Font Awesome
        const categoryIcons = {
            'Todos': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 32c12.5 0 24.1 6.4 30.8 17L503.4 304.2c11.4 17.8-1.7 40.2-22.8 40.2H31.4c-21.1 0-34.2-22.4-22.8-40.2L225.2 49c6.6-10.6 18.3-17 30.8-17zM256 128L96 384h320L256 128z"/></svg>',
            'Clássico': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M224 0c-17.7 0-32 14.3-32 32V49.9C142.4 60.3 96 108.3 96 168V448l-32 32v32h320v-32l-32-32V168c0-59.7-46.4-107.7-96.1-118.1V32c0-17.7-14.3-32-32-32zM48 480h352v-1.3L368 448V168c0-44.2-35.8-80-80-80H160c-44.2 0-80 35.8-80 80v280L48 478.7V480z"/></svg>',
            'Romance': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>',
            'Poesia': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M32 64C32 28.7 60.7 0 96 0H256c35.3 0 64 28.7 64 64V256c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V64zm96 64H96v64c0 17.7 14.3 32 32 32H224c17.7 0 32-14.3 32-32V128H128zM384 320c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32V352c0-17.7-14.3-32-32-32h-64z"/></svg>',
            'Contos': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z"/></svg>',
            'Ficção Científica': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8L24 288c-8.6 0-16.6-4.6-20.9-12.1s-4.2-16.7 .2-24.1l52.5-88.5c16.2-27.3 45.1-45.3 76.8-45.3H384c17.7 0 32 14.3 32 32s-14.3 32-32 32H132.6c-11.2 0-21.7 5.9-27.4 15.4l-23.4 39.5L146.3 256H208c17.7 0 32 14.3 32 32s-14.3 32-32 32h-25.7l34.6 34.6c2.1 2.1 3.1 4.8 3.1 7.5c0 8.3-6.7 15-15 15s-15-6.7-15-15c0-1.5-.3-2.9-.9-4.3l-4.3-11.4c-3.1-8.1-12.1-12.8-20.6-11.1s-15.4 9.2-15.2 18.2c.2 8.3 5.4 15.7 12.4 20.3l11.7 7.8c-1.8 5.9-3.1 11.2-3.8 15.9c-1.8 11.9 2.6 23.7 12.3 33.4l30.9 30.9c8.5 8.5 20.8 11.5 32.2 7.7c8.9-3 20.5-7 33.8-11.8l0 0 0 0c13.3-4.8 27.9-11.8 43.5-21.2c10.7-6.5 24.2-3.7 31.8 5.9l34.4 43.2c8.2 10.3 7.4 24.9-1.9 34.1l-79.8 79.8c-9.2 9.2-24.1 9.2-33.3 0l-30.9-30.9c-8.5-8.5-11.5-20.8-7.7-32.2c3-8.9 7-20.5 11.8-33.8l0 0c-15.6 9.4-30.2 16.4-43.5 21.2c-10.7 6.5-24.2 3.7-31.8-5.9l-34.4-43.2c-8.2-10.3-7.4-24.9 1.9-34.1l79.8-79.8c9.2-9.2 24.1-9.2 33.3 0l30.9 30.9z"/></svg>',
            'Fantasia': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M288 32c-82.3 0-148.6 66.3-148.6 148.6c0 82.3 66.3 148.6 148.6 148.6s148.6-66.3 148.6-148.6C436.6 98.3 370.3 32 288 32zm0 224c-44.2 0-80-35.8-80-80s35.8-80 80-80s80 35.8 80 80s-35.8 80-80 80zM576 320c0-35.3-28.7-64-64-64H64c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64v-32z"/></svg>',
            'Mistério': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>',
            'Filosofia': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 0c-17.7 0-32 14.3-32 32V64c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32zM128 64c-17.7 0-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32s-14.3-32-32-32zm256 0c-17.7 0-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32s-14.3-32-32-32zM256 416c17.7 0 32 14.3 32 32v32c0 17.7-14.3 32-32 32s-32-14.3-32-32v-32c0-17.7 14.3-32 32-32zM128 416c17.7 0 32 14.3 32 32s-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32zm256 0c17.7 0 32 14.3 32 32s-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32zM32 256c0-17.7 14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32s-32-14.3-32-32zm448 0c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32z"/></svg>',
            'Teatro': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM176.4 144.2c-15.2-15.2-15.2-39.9 0-55.2c15.2-15.2 39.9-15.2 55.2 0L256 113.4l24.4-24.4c15.2-15.2 39.9-15.2 55.2 0c15.2 15.2 15.2 39.9 0 55.2L281.2 168.6l24.4 24.4c15.2 15.2 15.2 39.9 0 55.2c-15.2 15.2-39.9 15.2-55.2 0L256 223.8l-24.4 24.4c-15.2 15.2-39.9 15.2-55.2 0c-15.2-15.2-15.2-39.9 0-55.2l24.4-24.4-24.4-24.4zM368 368c-26.5 0-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48z"/></svg>',
            'Não-Ficção': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M96 0C43 0 0 43 0 96V416c0 53 43 96 96 96H384h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V384c17.7 0 32-14.3 32-32V96c0-53-43-96-96-96H96zM48 96c0-26.5 21.5-48 48-48H352c26.5 0 48 21.5 48 48V352c0 26.5-21.5 48-48 48H96c-26.5 0-48-21.5-48-48V96z"/></svg>'
        };

        // Adiciona o botão de filtro de Favoritos no início
        const favoritesButton = document.createElement('button');
        favoritesButton.className = 'filter-button';
        favoritesButton.dataset.category = 'Favoritos';
        favoritesButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9.8 1.5 13.7 13.5 6.6 20.5l-111.3 108.6 26.2 153.1c1.7 9.8-8.7 17.5-17.5 12.9L288 439.6l-136.8 72.2c-8.9 4.7-19.2-3.1-17.5-12.9l26.2-153.1L6.6 200.5c-7.1-7-3.2-19 6.6-20.5l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0z"/></svg> Favoritos <span class="category-count">${favoriteBooks.length}</span>`;
        favoritesButton.addEventListener('click', () => {
            currentPage = 1;
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            favoritesButton.classList.add('active');
            localStorage.setItem('selectedCategory', 'Favoritos');

            displayBooks(getCurrentFilteredList());
            searchInput.value = '';
            updateClearButtonVisibility();
        });
        filterNav.appendChild(favoritesButton);

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.dataset.category = category; // Usa um data-attribute para o nome da categoria
            const iconSvg = categoryIcons[category] || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M0 80V224c0 17.7 14.3 32 32 32H224c17.7 0 32-14.3 32-32V80c0-17.7-14.3-32-32-32H32C14.3 48 0 62.3 0 80zM288 80V224c0 17.7 14.3 32 32 32H480c17.7 0 32-14.3 32-32V80c0-17.7-14.3-32-32-32H320c-17.7 0-32 14.3-32 32zM0 336V432c0 17.7 14.3 32 32 32H224c17.7 0 32-14.3 32-32V336c0-17.7-14.3-32-32-32H32c-17.7 0-32 14.3-32 32z"/></svg>'; // Ícone de tag padrão
            const count = categoryCounts[category] || 0;
            button.innerHTML = `${iconSvg} ${category} <span class="category-count">${count}</span>`;
            
            // Adiciona uma classe específica para o botão da categoria Mistério
            if (category === 'Mistério') {
                button.classList.add('filter-button--mystery');
            }

            if (category === savedCategory) {
                button.classList.add('active'); // O botão "Todos" começa ativo
            }

            button.addEventListener('click', () => {
                currentPage = 1; // Reseta para a primeira página ao clicar no filtro
                // Remove a classe 'active' de todos os botões e a adiciona ao clicado
                document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                localStorage.setItem('selectedCategory', category); // Salva a categoria selecionada

                // Redesenha os livros com a nova lista filtrada
                displayBooks(getCurrentFilteredList());
                searchInput.value = '';
                updateClearButtonVisibility(); // Atualiza a visibilidade do botão
            });
            filterNav.appendChild(button);
        });
    }

    // Função de Debounce para otimizar a busca
    function debounce(func, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // Configura os ouvintes de eventos após os dados serem carregados
    function setupEventListeners() {
        // Evento para mudar o idioma
        languageSelect.addEventListener('change', () => {
            currentLanguage = languageSelect.value;
            localStorage.setItem('selectedLanguage', currentLanguage); // Salva a preferência
            // Redesenha os livros no novo idioma, limpando filtros e busca
            localStorage.removeItem('selectedCategory'); // Reseta a categoria ao mudar de idioma
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.filter-button[data-category="Todos"]').classList.add('active'); // Ativa o botão "Todos"
            currentPage = 1;
            searchInput.value = '';
            displayBooks(getCurrentFilteredList());
        });

        // Usa a função debounce para evitar buscas excessivas enquanto o usuário digita
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            displayBooks(getCurrentFilteredList());
            updateClearButtonVisibility(); // Atualiza a visibilidade do botão
        }));

        // Evento de clique para ordenar os livros
        sortButton.addEventListener('click', () => {
            if (currentSortOrder === 'asc') {
                // Muda para descendente (mais novo primeiro)
                allBooks.sort((a, b) => b.year - a.year);
                currentSortOrder = 'desc';
                sortButton.innerHTML = 'Ordenado: Mais Novos <svg class="sort-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg>';
            } else {
                // Muda para ascendente (mais antigo primeiro)
                allBooks.sort((a, b) => a.year - b.year);
                currentSortOrder = 'asc';
                sortButton.innerHTML = 'Ordenado: Mais Antigos <svg class="sort-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>';
            }
            // Limpa a busca para mostrar a lista completa ordenada
            currentPage = 1;
            displayBooks(getCurrentFilteredList());
            updateClearButtonVisibility(); // Atualiza a visibilidade do botão
        });

        // Evento para o botão de redefinir idioma
        const resetLanguageButton = document.getElementById('reset-language-button');
        if (resetLanguageButton) {
            resetLanguageButton.addEventListener('click', () => {
                localStorage.clear(); // Limpa todo o localStorage para um reset completo
                window.location.reload(); // Recarrega a página para aplicar a redefinição
            });
        }
    }

    // Função para limpar os filtros de busca e categoria
    function clearFilters() {
        // 1. Limpa o campo de busca
        searchInput.value = '';

        // 2. Reseta o filtro de categoria para "Todos"
        localStorage.removeItem('selectedCategory');
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-button[data-category="Todos"]').classList.add('active');

        // 3. Reseta a ordenação para o padrão
        allBooks = [...originalBookOrder]; // Restaura a ordem original dos livros
        currentSortOrder = 'asc'; // Reseta o estado da ordenação
        sortButton.innerHTML = 'Ordenar por Ano'; // Reseta o texto do botão

        // 4. Reseta a paginação e exibe a lista completa
        currentPage = 1;
        displayBooks(getCurrentFilteredList());
        updateClearButtonVisibility(); // Esconde o botão após limpar
    }

    // Adiciona o evento de clique ao novo botão
    const clearFiltersButton = document.getElementById('clear-filters-button');
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', clearFilters);
    }

    // Função para mostrar ou esconder o botão "Limpar Filtros"
    function updateClearButtonVisibility() {
        const clearButton = document.getElementById('clear-filters-button');
        if (!clearButton) return;

        const isSearchActive = searchInput.value.trim() !== '';
        const isCategoryActive = (localStorage.getItem('selectedCategory') || 'Todos') !== 'Todos';
        const isSortActive = sortButton.textContent !== 'Ordenar por Ano';

        // Se qualquer filtro estiver ativo, mostra o botão. Senão, esconde.
        if (isSearchActive || isCategoryActive || isSortActive) {
            clearButton.classList.remove('hidden');
        } else {
            clearButton.classList.add('hidden');
        }
    }

    // Função auxiliar para obter a lista de livros atualmente filtrada
    function getCurrentFilteredList() {
        const searchTerm = searchInput.value.toLowerCase();
        const activeCategoryButton = document.querySelector('.filter-button.active');
        const activeCategory = activeCategoryButton ? activeCategoryButton.dataset.category : 'Todos';

        let filteredList = allBooks;

        if (activeCategory === 'Favoritos') {
            // Filtra para mostrar apenas os livros cujo título está na lista de favoritos
            filteredList = filteredList.filter(book => favoriteBooks.includes(book.title));
        } else if (activeCategory !== 'Todos') {
            filteredList = filteredList.filter(book => book.category === activeCategory);
        }

        if (searchTerm) {
            // Traduz temporariamente para buscar no idioma correto
            filteredList = filteredList.filter(book => {
                const bookToCheck = getTranslatedBook(book);
                return bookToCheck.title.toLowerCase().includes(searchTerm) || 
                       bookToCheck.author.toLowerCase().includes(searchTerm);
            });
        }
        return filteredList;
    }

    // Inicia a aplicação
    initializeApp(); // A chamada para mostrar os esqueletos já foi feita
});