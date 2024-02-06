const PAGE_SIZE = 10;
const BOOKS_FETCH_URL = 'https://y1jyo2lk58.execute-api.eu-central-1.amazonaws.com/books';
const SUBSCRIBE_URL = 'https://t.me/shellf_bot?start=subscribe_%';
const BUTTON_LABEL = 'Подписаться';

const ICON_AVAILABLE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/></svg>';
const ICON_UNAVAILABLE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>';

const createElement = (tagName, attributes) => {
    const tag = document.createElement(tagName);
    attributes.forEach((item) => {
        tag[item.name] = item.value;
    });
    return tag;
};

const showElement = ($el) => {
    $el.classList.remove('hidden');
};

const hideElement = ($el) => {
    $el.classList.add('hidden');
};

class View {
    constructor({ booksData, $shelfFilter, $bookListWrapper, $pagerBackButton, $pagerForwardButton, $currentPageNumber, $totalPagesNumber, $notFoundMessage, $pager }) {
        this.booksData = booksData;
        this.currentPage = 0;

        this.$bookListWrapper = $bookListWrapper;
        this.$pagerBackButton = $pagerBackButton;
        this.$pagerForwardButton = $pagerForwardButton;
        this.$currentPageNumber = $currentPageNumber;
        this.$totalPagesNumber = $totalPagesNumber;
        this.$notFoundMessage = $notFoundMessage;
        this.$pager = $pager;

        const shelves = [...new Set(booksData.map((item) => item.shelf))];
        this.renderShelfFilter($shelfFilter, shelves);

        this.refreshView();
    }

    refreshView() {
        const currentBookList = this.booksData
            .filter((item) => {
                let show = true;
                if (this.currentShelf) {
                    show = show && item.shelf === this.currentShelf;
                }
                if (this.currentSearchValue) {
                    show = show && (
                        item.title.toLowerCase().indexOf(this.currentSearchValue) !== -1 ||
                        item.author.toLowerCase().indexOf(this.currentSearchValue) !== -1
                    );
                }
                return show;
            });

        if (currentBookList.length) {
            showElement(this.$pager);
            hideElement(this.$notFoundMessage);
        } else {
            hideElement(this.$pager);
            showElement(this.$notFoundMessage);
        }

        this.renderBookList(currentBookList);
        this.pageCount = Math.ceil(currentBookList.length / PAGE_SIZE);
        this.refreshPager(this.pageCount);
    }

    setCurrentSearchValue(value) {
        this.currentSearchValue = value.toLowerCase();
        this.currentPage = 0;
        this.refreshView();
    }

    renderShelfFilter ($shelfFilter, shelves) {
        $shelfFilter.appendChild(createElement('option', [
            { name: 'value', value: '' },
            { name: 'innerText', value: 'Все' },
        ]));

        shelves.forEach((item) => {
            $shelfFilter.appendChild(createElement('option', [
                { name: 'value', value: item },
                { name: 'innerText', value: item },
            ]));
        });
    };

    renderMainCell(item) {
        const cell = createElement('div', [
            { name: 'className', value: 'book-list__info-column' },
        ]);
        cell.innerHTML = `
                <div class="book-list__title">${item.title}</div> 
                <div class="book-list__author">${item.author}</div> 
            `;
        return cell;
    }

    renderActionsCell(item) {
        const cell = createElement('div', [
            { name: 'className', value: 'book-list__shelf-column' },
        ]);
        if (item.free) {
            cell.innerHTML = `
                    <div class="book-list__shelf-info">                                             
                        <div>${item.shelf}</div>
                        <div class="book-list__availability book-list__availability--available">${ICON_AVAILABLE}</div>
                    </div>
                `;
        } else {
            cell.innerHTML = `
                    <div class="book-list__shelf-info">                         
                        <div>${item.shelf}</div>
                        <div class="book-list__availability">${ICON_UNAVAILABLE}</div>
                    </div>
                    <a href="${this.getSubscribeUrl(item.id)}" class="book-list__subscribe-button" target="_blank">${BUTTON_LABEL}</a>
                `;
        }
        return cell;
    }

    renderBookList(bookList) {
        this.$bookListWrapper.innerHTML = '';

        const startBookIndex = this.currentPage * PAGE_SIZE;
        const booksToRender = bookList.slice(startBookIndex, startBookIndex + PAGE_SIZE);

        booksToRender.forEach((item) => {
            const row = createElement('div', [
                { name: 'className', value: 'book-list__row' },
            ]);
            row.appendChild(this.renderMainCell(item));
            row.appendChild(this.renderActionsCell(item));

            this.$bookListWrapper.appendChild(row);
        });
    }

    getSubscribeUrl(bookId) {
        return SUBSCRIBE_URL.replace(`%`, bookId)
    }

    refreshPager(pageCount) {
        this.$pagerBackButton.disabled = this.currentPage <= 0;
        this.$pagerForwardButton.disabled = this.currentPage + 1 >= pageCount;
        this.$currentPageNumber.innerText = this.currentPage + 1;
        this.$totalPagesNumber.innerText = pageCount;
    }

    setCurrentShelf(currentShelf) {
        this.currentShelf = currentShelf;
        this.currentPage = 0;
        this.refreshView();
    }

    handleBackClick() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.refreshView();
        }
    }

    handleForwardClick() {
        if (this.currentPage + 1 < this.pageCount) {
            this.currentPage++;
            this.refreshView();
        }
    }
}

window.onload = async () => {
    const $search = document.getElementById('search');
    const $shelfFilter = document.getElementById('shelf-filter');
    const $loader = document.getElementById('loader');
    const $errorMessage = document.getElementById('error-message');
    const $notFoundMessage = document.getElementById('not-found-message');
    const $bookListWrapper = document.getElementById('book-list');
    const $pager = document.getElementById('pager');
    const $pagerBackButton = document.getElementById('pager-back-button');
    const $pagerForwardButton = document.getElementById('pager-forward-button');
    const $currentPageNumber = document.getElementById('current-page-number');
    const $totalPagesNumber = document.getElementById('total-pages-number');

    try {
        const response = await fetch(BOOKS_FETCH_URL);
        const data = await response.json();
        const booksData = data.books;

        showElement($pager);

        const view = new View({
            booksData,
            $shelfFilter,
            $bookListWrapper,
            $pagerBackButton,
            $pagerForwardButton,
            $currentPageNumber,
            $totalPagesNumber,
            $notFoundMessage,
            $pager,
        });

        $search.addEventListener('input', (e) => {
            view.setCurrentSearchValue(e.target.value);
        });
        $search.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                view.setCurrentSearchValue('');
            }
        });

        $shelfFilter.addEventListener('change', (e) => {
            view.setCurrentShelf(e.target.value);
        });

        $pagerBackButton.addEventListener('click', () => {
            view.handleBackClick();
        });

        $pagerForwardButton.addEventListener('click', () => {
            view.handleForwardClick();
        });
    } catch (err) {
        showElement($errorMessage);
    } finally {
        hideElement($loader);
    }
};
