document.addEventListener('DOMContentLoaded', async () => {
    const bookDetailContainer = document.getElementById('book-detail-container');

    // 1. Pega o parâmetro 'title' da URL
    const languageSelect = document.getElementById('language-select');
    // Tenta pegar o idioma do localStorage, se não, usa o valor do select
    let currentLanguage = localStorage.getItem('selectedLanguage') || (languageSelect ? languageSelect.value : 'pt-br');

    const params = new URLSearchParams(window.location.search);
    const bookTitle = params.get('title');

    if (!bookTitle) {
        // Se não houver título, mostra a mensagem de erro e para.
        // O esqueleto não é necessário aqui.
        bookDetailContainer.innerHTML = '<p>Livro não especificado.</p>';
        return;
    }

    try {
        // 2. Carrega a lista completa de livros
        const response = await fetch('./books.json');
        const allBooks = await response.json();

        // 3. Encontra o livro correspondente
        // Procura pelo título original ou pelo título traduzido
        const book = allBooks.find(b => {
            // Verifica se o título original corresponde
            const originalTitleMatch = b.title === bookTitle;
            // Verifica se algum dos títulos traduzidos corresponde
            const translatedTitleMatch = b.translations ? Object.values(b.translations).some(t => t.title === bookTitle) : false;

            return originalTitleMatch || translatedTitleMatch;
        });

        // Aplica a tradução se disponível
        let displayedBook = book;
        if (book && currentLanguage !== book.language && book.translations && book.translations[currentLanguage]) {
            displayedBook = { ...book, ...book.translations[currentLanguage] };
        }

        if (displayedBook) {
            // 4. Atualiza o título da página e preenche os detalhes
            // Acessa a galeria de forma segura, usando um array vazio como padrão

            // --- MELHORIAS DE SEO ---
            // 1. Atualiza o <title> da página
            document.title = displayedBook.title;

            // 2. Cria e adiciona a meta description
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.setAttribute('name', 'description');
                document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute('content', displayedBook.description);

            // 3. Adiciona meta tags Open Graph (para compartilhamento em redes sociais)
            document.head.insertAdjacentHTML('beforeend', `
                <meta property="og:title" content="${displayedBook.title}">
                <meta property="og:description" content="${displayedBook.description}">
                <meta property="og:image" content="${window.location.origin}/${displayedBook.cover_image}">
                <meta property="og:type" content="book">
            `);

            // 4. Adiciona Dados Estruturados (JSON-LD) para o Google entender que isso é um livro
            const structuredData = {
                "@context": "https://schema.org",
                "@type": "Book",
                "name": displayedBook.title,
                "author": {
                    "@type": "Person",
                    "name": displayedBook.author
                },
                "datePublished": displayedBook.year,
                "inLanguage": displayedBook.language,
                "description": displayedBook.description,
                "image": `${window.location.origin}/${displayedBook.cover_image}`
            };

            const script = document.createElement('script');
            script.setAttribute('type', 'application/ld+json');
            script.textContent = JSON.stringify(structuredData);
            document.head.appendChild(script);

            // --- LÓGICA DE FAVORITOS ---
            const bookId = displayedBook.title;
            let favoriteBooks = JSON.parse(localStorage.getItem('favoriteBooks')) || [];
            const isFavorite = favoriteBooks.includes(bookId);

            bookDetailContainer.innerHTML = `
                <div class="book-detail-layout">
                    <div class="book-detail-image-wrapper"></div>
                    <div class="book-detail-text-wrapper">
                        <div class="book-title-wrapper">
                            <h1 class="book-title">${displayedBook.title}</h1>
                            <button class="favorite-button ${isFavorite ? 'favorited' : ''}" data-book-id="${bookId}" aria-label="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9.8 1.5 13.7 13.5 6.6 20.5l-111.3 108.6 26.2 153.1c1.7 9.8-8.7 17.5-17.5 12.9L288 439.6l-136.8 72.2c-8.9 4.7-19.2-3.1-17.5-12.9l26.2-153.1L6.6 200.5c-7.1-7-3.2-19 6.6-20.5l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0z"/></svg>
                            </button>
                        </div>
                        <p class="book-author-detail">por ${displayedBook.author} (${displayedBook.year})</p>
                        <p class="book-description-detail">${displayedBook.description}</p>
                        <span class="book-category">${displayedBook.category}</span>
                    </div>
                </div>
            `;

            // Adiciona evento ao botão de favorito na página de detalhes
            const favoriteButton = bookDetailContainer.querySelector('.favorite-button');
            if (favoriteButton) {
                favoriteButton.addEventListener('click', () => {
                    const bookId = favoriteButton.dataset.bookId;
                    let favorites = JSON.parse(localStorage.getItem('favoriteBooks')) || [];
                    const bookIndex = favorites.indexOf(bookId);

                    if (bookIndex > -1) {
                        favorites.splice(bookIndex, 1);
                    } else {
                        favorites.push(bookId);
                    }
                    localStorage.setItem('favoriteBooks', JSON.stringify(favorites));
                    favoriteButton.classList.toggle('favorited');
                });
            }

        } else {
            bookDetailContainer.innerHTML = '<p>Livro não encontrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes do livro:', error);
        bookDetailContainer.innerHTML = '<p>Não foi possível carregar os detalhes do livro.</p>';
    }

    // Sincroniza o seletor de idioma e salva a preferência
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        languageSelect.addEventListener('change', () => {
            localStorage.setItem('selectedLanguage', languageSelect.value);
            window.location.reload(); // Recarrega a página para aplicar o novo idioma
        });
    }
});