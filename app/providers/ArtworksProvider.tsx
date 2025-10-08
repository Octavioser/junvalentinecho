'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { Artwork } from "@/types";

type ArtworksContextValue = {
    artworks: Artwork[];
    setArtworks: React.Dispatch<React.SetStateAction<Artwork[]>>;
};

// 기본 context 생성
const ArtworksContext = createContext<ArtworksContextValue | undefined>(undefined);

// 🎨 Provider 구현
export function ArtworksProvider({ children, initialArtworks = [], }: {
    children: ReactNode;
    initialArtworks?: Artwork[];
}) {
    const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);


    return (
        <ArtworksContext.Provider value={{ artworks, setArtworks }}>
            {children}
        </ArtworksContext.Provider>
    );
}

// 🎨 Hook (Context 소비용)
export function useArtworks() {
    const ctx = useContext(ArtworksContext);
    if (!ctx) {
        throw new Error('useArtworks must be used within an ArtworksProvider');
    }
    return ctx;
}
