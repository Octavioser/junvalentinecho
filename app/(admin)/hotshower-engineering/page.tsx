
"use client"
import React, { useState } from 'react';
import MainImage from "../../components/MainImage/MainImage";


export const metadata = { title: '개인작업실' }


const hotshowerEngineering = () => {

    const [id, setId] = useState<number>(0);
    const [title, setTitle] = useState<string>('개인작업실');
    const [poster_path, setPosterPath] = useState<string>('https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDJ8fGhvdHNob3dlciUyMGVuZ2luZWVyaW5nfGVufDB8fHx8MTY5MjQ1NTQxNg&ixlib=rb-4.0.3&q=80&w=1080');
    const [top, setTop] = useState<number>(0);
    const [width, setWidth] = useState<number>(100);
    const [left, setLeft] = useState<number>(0);
    const [zIndex, setZIndex] = useState<number>(0);

    return <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        {/* 내용 입력영역 */}
        <div style={{ backgroundColor: 'red', width: '50%' }}>
            21312
        </div>
        {/* 이미지 위치 영역 */}
        <div style={{ backgroundColor: 'yellow', width: '50%' }}>
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
}

export default hotshowerEngineering;
