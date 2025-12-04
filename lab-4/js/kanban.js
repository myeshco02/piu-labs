const STORAGE_KEY = 'kanban-lab4-state';

const columns = [
    { key: 'todo', label: 'Do zrobienia' },
    { key: 'inProgress', label: 'W trakcie' },
    { key: 'done', label: 'Zrobione' },
];

const board = document.getElementById('board');
const colorPicker = buildColorPicker();
document.body.appendChild(colorPicker);

let state = loadState();
let activeColorTarget = null;

initBoard();

function initBoard() {
    columns.forEach((column) => {
        const columnElement = createColumn(column);
        board.appendChild(columnElement);
        renderColumn(column.key);
    });
}

function createColumn(definition) {
    const column = document.createElement('section');
    column.className = 'column';
    column.dataset.column = definition.key;

    const header = document.createElement('div');
    header.className = 'column-header';

    const title = document.createElement('div');
    title.className = 'column-title';
    const heading = document.createElement('h2');
    heading.textContent = definition.label;
    const counter = document.createElement('span');
    counter.className = 'counter';
    counter.textContent = '0';
    counter.dataset.role = 'counter';
    title.append(heading, counter);

    const actions = document.createElement('div');
    actions.className = 'column-actions';
    actions.append(
        buildButton('+', 'add-card', ['btn', 'primary', 'icon']),
        buildButton('Koloruj kolumnę', 'color-column', ['btn']),
        buildButton('Sortuj', 'sort-column', ['btn'])
    );

    header.append(title, actions);

    const cards = document.createElement('div');
    cards.className = 'cards';
    cards.dataset.role = 'cards';

    column.append(header, cards);

    column.addEventListener('click', handleClick);
    column.addEventListener('input', handleInput);

    return column;
}

function buildButton(label, action, classList = []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.action = action;
    button.classList.add(...classList);
    return button;
}

function renderColumn(columnKey) {
    const columnElement = board.querySelector(`[data-column="${columnKey}"]`);
    if (!columnElement) return;

    const cardsContainer = columnElement.querySelector('[data-role="cards"]');
    cardsContainer.innerHTML = '';

    state[columnKey].forEach((card) => {
        cardsContainer.appendChild(buildCard(card, columnKey));
    });

    updateCounter(columnKey);
}

function buildCard(card, columnKey) {
    const cardElement = document.createElement('article');
    cardElement.className = 'card';
    cardElement.dataset.id = card.id;
    cardElement.style.backgroundColor = card.color;

    const body = document.createElement('div');
    body.className = 'card-body';
    body.contentEditable = 'true';
    body.textContent = card.title || '';
    body.dataset.role = 'card-body';
    body.setAttribute('aria-label', 'Treść karty');

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const isFirstColumn = isFirst(columnKey);
    const isLastColumn = isLast(columnKey);

    const left = buildButton('←', 'move-left', ['btn', 'icon']);
    left.disabled = isFirstColumn;
    const right = buildButton('→', 'move-right', ['btn', 'icon']);
    right.disabled = isLastColumn;
    const colorButton = buildButton('🎨', 'color-card', ['btn', 'icon']);
    const remove = buildButton('×', 'delete-card', ['btn', 'icon', 'danger']);

    actions.append(left, right, colorButton, remove);
    cardElement.append(body, actions);

    return cardElement;
}

function handleClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const columnElement = event.currentTarget;
    const columnKey = columnElement.dataset.column;
    const action = button.dataset.action;

    if (['add-card', 'color-column', 'sort-column'].includes(action)) {
        handleColumnAction(action, columnKey, event);
        return;
    }

    const cardElement = button.closest('.card');
    if (!cardElement) return;

    const cardId = cardElement.dataset.id;
    handleCardAction(action, columnKey, cardId, event);
}

function handleInput(event) {
    if (!event.target.matches('[data-role="card-body"]')) return;

    const columnKey = event.currentTarget.dataset.column;
    const cardElement = event.target.closest('.card');
    if (!cardElement) return;

    const cardId = cardElement.dataset.id;
    const newTitle = event.target.textContent.trim();

    updateCardTitle(columnKey, cardId, newTitle);
}

function handleColumnAction(action, columnKey, originEvent) {
    if (action === 'add-card') {
        addCard(columnKey);
    }
    if (action === 'color-column') {
        openColorPicker({ type: 'column', columnKey, originEvent });
    }
    if (action === 'sort-column') {
        sortColumn(columnKey);
    }
}

function handleCardAction(action, columnKey, cardId, originEvent) {
    if (action === 'delete-card') {
        deleteCard(columnKey, cardId);
    }
    if (action === 'move-left') {
        moveCard(columnKey, cardId, -1);
    }
    if (action === 'move-right') {
        moveCard(columnKey, cardId, 1);
    }
    if (action === 'color-card') {
        openColorPicker({ type: 'card', columnKey, cardId, originEvent });
    }
}

function addCard(columnKey) {
    const newCard = {
        id: createId(),
        title: 'Nowa karta',
        color: randomColor(),
        createdAt: Date.now(),
    };

    state[columnKey].push(newCard);
    persist();
    renderColumn(columnKey);
    focusCard(columnKey, newCard.id);
}

function updateCardTitle(columnKey, cardId, title) {
    const card = findCard(columnKey, cardId);
    if (!card) return;

    card.title = title;
    persist();
}

function deleteCard(columnKey, cardId) {
    state[columnKey] = state[columnKey].filter((card) => card.id !== cardId);
    persist();
    renderColumn(columnKey);
}

function moveCard(fromColumnKey, cardId, direction) {
    const fromIndex = columns.findIndex((col) => col.key === fromColumnKey);
    const targetIndex = fromIndex + direction;
    const targetColumn = columns[targetIndex];
    if (!targetColumn) return;

    const cardIndex = state[fromColumnKey].findIndex(
        (card) => card.id === cardId
    );
    if (cardIndex === -1) return;

    const [card] = state[fromColumnKey].splice(cardIndex, 1);
    state[targetColumn.key].push(card);

    persist();
    renderColumn(fromColumnKey);
    renderColumn(targetColumn.key);
}

function recolorColumn(columnKey, color) {
    state[columnKey] = state[columnKey].map((card) => ({
        ...card,
        color: color ?? randomColor(),
    }));

    persist();
    renderColumn(columnKey);
}

function recolorCard(columnKey, cardId, color) {
    const card = findCard(columnKey, cardId);
    if (!card) return;

    card.color = color ?? randomColor();
    persist();
    renderColumn(columnKey);
}

function sortColumn(columnKey) {
    state[columnKey].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'pl', {
            sensitivity: 'base',
        })
    );
    persist();
    renderColumn(columnKey);
}

function updateCounter(columnKey) {
    const columnElement = board.querySelector(`[data-column="${columnKey}"]`);
    if (!columnElement) return;
    const counter = columnElement.querySelector('[data-role="counter"]');
    counter.textContent = state[columnKey].length;
}

function findCard(columnKey, cardId) {
    return state[columnKey].find((card) => card.id === cardId);
}

function focusCard(columnKey, cardId) {
    const columnElement = board.querySelector(`[data-column="${columnKey}"]`);
    if (!columnElement) return;
    const card = columnElement.querySelector(
        `.card[data-id="${cardId}"] [data-role="card-body"]`
    );
    if (card) {
        card.focus();
        document.getSelection()?.selectAllChildren(card);
    }
}

function isFirst(columnKey) {
    return columns[0].key === columnKey;
}

function isLast(columnKey) {
    return columns[columns.length - 1].key === columnKey;
}

function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70;
    const lightness = 55;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function buildColorPicker() {
    const input = document.createElement('input');
    input.type = 'color';
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.width = '36px';
    input.style.height = '36px';
    input.style.border = 'none';
    input.style.padding = '0';
    input.style.margin = '0';
    input.style.zIndex = '9999';

    const handle = (event) => {
        if (!activeColorTarget) return;
        applyPickedColor(event.target.value);
    };

    input.addEventListener('input', handle);
    input.addEventListener('change', handle);
    input.addEventListener('blur', () => {
        activeColorTarget = null;
    });
    return input;
}

function openColorPicker(target) {
    activeColorTarget = target;
    const preset = pickStartingColor(target);
    colorPicker.value = preset;

    positionPicker(target.originEvent);

    if (typeof colorPicker.showPicker === 'function') {
        colorPicker.showPicker().catch(() => colorPicker.click());
    } else {
        colorPicker.click();
    }
}

function applyPickedColor(color) {
    if (!activeColorTarget) return;

    if (activeColorTarget.type === 'column') {
        recolorColumn(activeColorTarget.columnKey, color);
        return;
    }

    if (activeColorTarget.type === 'card') {
        recolorCard(
            activeColorTarget.columnKey,
            activeColorTarget.cardId,
            color
        );
    }
}

function pickStartingColor(target) {
    if (target.type === 'card') {
        const card = findCard(target.columnKey, target.cardId);
        if (card) return toHex(card.color);
    }
    if (target.type === 'column') {
        const firstCard = state[target.columnKey]?.[0];
        if (firstCard) return toHex(firstCard.color);
    }
    return '#60a5fa';
}

function toHex(color) {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return '#60a5fa';
    ctx.fillStyle = color || '#60a5fa';
    const rgb = ctx.fillStyle;
    if (rgb.startsWith('#')) return rgb;
    // rgb(r, g, b)
    const match = rgb.match(/rgba?\((\d+),\s?(\d+),\s?(\d+)/i);
    if (!match) return '#60a5fa';
    const [r, g, b] = match.slice(1, 4).map(Number);
    return (
        '#' +
        [r, g, b]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')
            .toLowerCase()
    );
}

function positionPicker(originEvent) {
    if (!originEvent || !originEvent.target) {
        colorPicker.style.top = '12px';
        colorPicker.style.left = '12px';
        return;
    }
    const rect = originEvent.target.getBoundingClientRect();
    colorPicker.style.top = `${rect.bottom + window.scrollY}px`;
    colorPicker.style.left = `${rect.left + window.scrollX}px`;
}

function createId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return defaultState();
        const parsed = JSON.parse(saved);
        return {
            todo: parsed.todo ?? [],
            inProgress: parsed.inProgress ?? [],
            done: parsed.done ?? [],
        };
    } catch (error) {
        console.warn('Nie udało się odczytać stanu z localStorage:', error);
        return defaultState();
    }
}

function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultState() {
    return {
        todo: [],
        inProgress: [],
        done: [],
    };
}
