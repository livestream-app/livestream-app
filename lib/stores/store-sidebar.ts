import { create } from "zustand";

interface SidebarStore {
    isOpen: boolean;
    onExpand: () => void;
    onCollapse: () => void;
}

export const useSidebar = create<SidebarStore>((set) => ({
    isOpen: false,
    onExpand: () => set(() => ({ isOpen: false })),
    onCollapse() {
        set(() => ({ isOpen: true }));
    },
}));
