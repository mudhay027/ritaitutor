import { create } from 'zustand';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AppState {
    user: User | null;
    token: string | null;
    darkMode: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    toggleDarkMode: () => void;
    logout: () => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    darkMode: localStorage.getItem('theme') === 'dark',
    setUser: (user) => set({ user }),
    setToken: (token) => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
        set({ token });
    },
    toggleDarkMode: () => set((state) => {
        const newMode = !state.darkMode;
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        return { darkMode: newMode };
    }),
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },
}));
