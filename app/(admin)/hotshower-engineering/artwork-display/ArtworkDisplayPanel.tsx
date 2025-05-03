"use client"

import React, { useState } from 'react';
import MainImage from "../../../components/MainImage/MainImage";

const ArtworkDisplayPanel = () => {

    const [id, setId] = useState<number>(0);
    const [title, setTitle] = useState<string>('개인작업실');
    const [poster_path, setPosterPath] = useState<string>('https://image.tmdb.org/t/p/w780/1sQA7lfcF9yUyoLYC0e6Zo3jmxE.jpg');
    const [top, setTop] = useState<number>(0);
    const [width, setWidth] = useState<number>(50);
    const [left, setLeft] = useState<number>(0);
    const [zIndex, setZIndex] = useState<number>(0);

    return (
        <div style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '90%', aspectRatio: 1 / 1 }}>
                <MainImage
                    title={title}
                    id={id}
                    poster_path={poster_path}
                    top={top}
                    width={width}
                    left={left}
                    zIndex={zIndex}
                    setId={setId}
                />
            </div>
        </div>
    )
}
export default ArtworkDisplayPanel;