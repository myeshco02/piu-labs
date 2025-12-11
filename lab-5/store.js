import { createId, randomColor } from './helpers.js';

const STORAGE_KEY = 'lab5-shapes-state';

class Store {
    #state = { shapes: [] };
    #subscribers = new Set();

    constructor() {
        this.#state = this.#loadState();
    }

    subscribe(callback) {
        this.#subscribers.add(callback);
        callback(this.getState(), { action: 'init' });
        return () => this.#subscribers.delete(callback);
    }

    getState() {
        return {
            shapes: [...this.#state.shapes],
        };
    }

    getShapes() {
        return [...this.#state.shapes];
    }

    countByType(type) {
        return this.#state.shapes.filter((shape) => shape.type === type).length;
    }

    addShape(type) {
        const shape = {
            id: createId(),
            type,
            color: randomColor(),
            createdAt: Date.now(),
        };
        this.#state.shapes.push(shape);
        this.#notify({ action: 'add', payload: { id: shape.id, type: shape.type } });
        return shape;
    }

    removeShape(id) {
        const index = this.#state.shapes.findIndex((shape) => shape.id === id);
        if (index === -1) return;
        this.#state.shapes.splice(index, 1);
        this.#notify({ action: 'remove', payload: { id } });
    }

    recolorType(type, color) {
        let changed = false;
        this.#state.shapes = this.#state.shapes.map((shape) => {
            if (shape.type !== type) return shape;
            changed = true;
            return { ...shape, color: color ?? randomColor() };
        });
        if (changed) {
            this.#notify({ action: 'recolorType', payload: { type } });
        }
    }

    recolorShape(id, color) {
        const shape = this.#state.shapes.find((s) => s.id === id);
        if (!shape) return;
        shape.color = color ?? randomColor();
        this.#notify({ action: 'recolorShape', payload: { id } });
    }

    #notify(meta) {
        this.#persist();
        for (const cb of this.#subscribers) {
            cb(this.getState(), meta);
        }
    }

    #loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return { shapes: [] };
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed.shapes)) return { shapes: [] };
            return { shapes: parsed.shapes };
        } catch (error) {
            console.warn('Nie udało się odczytać stanu z localStorage:', error);
            return { shapes: [] };
        }
    }

    #persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#state));
        } catch (error) {
            console.warn('Nie udało się zapisać stanu do localStorage:', error);
        }
    }
}

export const store = new Store();
