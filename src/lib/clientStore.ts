'use client';

import { useSyncExternalStore } from 'react';

/**
 * Lecture des préférences du navigateur (localStorage) branchée sur React.
 *
 * `useSyncExternalStore` est la bonne porte d'entrée ici, plutôt qu'un
 * `useState` alimenté par un effet : le snapshot serveur renvoie `null`, donc
 * le HTML rendu côté serveur et la première passe côté client coïncident, sans
 * le rendu supplémentaire qu'impose la version « lire dans un effet ».
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    // `storage` ne se déclenche que dans les AUTRES onglets : c'est justement ce
    // qu'il faut pour qu'un record battu ailleurs se propage ici.
    window.addEventListener('storage', listener);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

export function writeLocal(key: string, value: string) {
    localStorage.setItem(key, value);
    listeners.forEach((listener) => listener());
}

export function useLocalValue(key: string): string | null {
    return useSyncExternalStore(
        subscribe,
        () => localStorage.getItem(key),
        () => null,
    );
}
