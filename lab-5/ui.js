import { store as defaultStore } from './store.js';

export function initUI(store = defaultStore) {
    const board = document.querySelector('[data-role="board"]');
    const controls = document.querySelector('.controls');
    const countSquaresEl = document.querySelector('[data-role="count-squares"]');
    const countCirclesEl = document.querySelector('[data-role="count-circles"]');

    if (!board || !controls || !countSquaresEl || !countCirclesEl) {
        console.warn('Brak wymaganych elementów UI.');
        return;
    }

    controls.addEventListener('click', (event) => {
        const action = event.target.dataset.action;
        if (!action) return;

        if (action === 'add-square') store.addShape('square');
        if (action === 'add-circle') store.addShape('circle');
        if (action === 'recolor-squares') store.recolorType('square');
        if (action === 'recolor-circles') store.recolorType('circle');
    });

    board.addEventListener('click', (event) => {
        const shapeEl = event.target.closest('.shape');
        if (!shapeEl || !board.contains(shapeEl)) return;
        store.removeShape(shapeEl.dataset.id);
    });

    store.subscribe((state, meta) => {
        updateCounters();
        renderFromMeta(state.shapes, meta);
    });

    function updateCounters() {
        countSquaresEl.textContent = store.countByType('square');
        countCirclesEl.textContent = store.countByType('circle');
    }

    function renderFromMeta(shapes, meta) {
        if (!meta || meta.action === 'init') {
            renderAll(shapes);
            return;
        }

        if (meta.action === 'add') {
            const shape = shapes.find((s) => s.id === meta.payload?.id);
            if (shape) board.append(buildShape(shape));
            return;
        }

        if (meta.action === 'remove') {
            removeShape(meta.payload?.id);
            return;
        }

        if (meta.action === 'recolorShape') {
            const shape = shapes.find((s) => s.id === meta.payload?.id);
            if (shape) updateShapeColor(shape);
            return;
        }

        if (meta.action === 'recolorType') {
            const targetType = meta.payload?.type;
            shapes
                .filter((s) => s.type === targetType)
                .forEach((shape) => updateShapeColor(shape));
            return;
        }

        renderAll(shapes);
    }

    function renderAll(shapes) {
        board.innerHTML = '';
        shapes.forEach((shape) => board.append(buildShape(shape)));
    }

    function buildShape(shape) {
        const el = document.createElement('div');
        el.className = `shape ${shape.type}`;
        el.dataset.id = shape.id;
        el.dataset.type = shape.type;
        el.style.backgroundColor = shape.color;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${shape.type} - kliknij, aby usunąć`);
        return el;
    }

    function updateShapeColor(shape) {
        const el = board.querySelector(`[data-id="${shape.id}"]`);
        if (!el) return;
        el.style.backgroundColor = shape.color;
    }

    function removeShape(id) {
        const el = board.querySelector(`[data-id="${id}"]`);
        if (el) el.remove();
    }
}
