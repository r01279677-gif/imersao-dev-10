document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('books.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const books = await response.json();
        renderBooks(books);
    } catch (error) {
        console.error('Erro ao buscar ou processar os livros:', error);
        const bookList = document.getElementById('book-list');
        if (bookList) {
            bookList.innerHTML = '<p>Não foi possível carregar os livros. Tente novamente mais tarde.</p>';
        }
    }
});

function renderBooks(books) {
    const bookList = document.getElementById('book-list');
    if (!bookList) {
        console.error('Elemento com id "book-list" não encontrado.');
        return;
    }

    // Limpa a lista antes de adicionar novos itens (útil para filtros futuros)
    bookList.innerHTML = '';

    books.forEach(book => {
        // 1. Cria o item da lista para cada livro
        const listItem = document.createElement('li');
        listItem.className = 'book-card';

        // 2. Usa a tradução para pt-br se disponível, senão usa os dados principais
        const displayData = book.translations?.['pt-br'] || book;

        // 3. Cria a imagem com texto alternativo descritivo
        const coverImage = document.createElement('img');
        coverImage.src = book.cover_image || 'images/placeholder.jpg'; // Usa um placeholder se não houver imagem
        coverImage.alt = `Capa do livro ${displayData.title} de ${displayData.author}`;

        // 4. Cria o título do livro com a tag de cabeçalho apropriada
        const bookTitle = document.createElement('h3');
        bookTitle.textContent = displayData.title;

        // 5. Cria o parágrafo para o autor
        const bookAuthor = document.createElement('p');
        bookAuthor.className = 'book-author';
        bookAuthor.textContent = displayData.author;

        // 6. Adiciona um link envolvendo o conteúdo para navegação
        const bookLink = document.createElement('a');
        const bookTitleForUrl = encodeURIComponent(displayData.title); // Codifica o título para a URL
        bookLink.href = `book.html?title=${bookTitleForUrl}`; // Formato correto do link
        bookLink.setAttribute('aria-label', `Ver detalhes sobre ${displayData.title}`);

        bookLink.append(coverImage, bookTitle, bookAuthor);
        listItem.appendChild(bookLink);
        bookList.appendChild(listItem);
    });
}