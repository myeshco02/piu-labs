export function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 72;
    const lightness = 70;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function createId(prefix = 'shape') {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
