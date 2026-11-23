import styles from './MainImgDialog.module.css';
import { Fragment, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Artwork } from "@/types";
import { formatSize } from "@/common/format";
import { ARTWORK_QUALITY } from "@/common/image";

const MainImgDialog = ({ targetImg: { poster_path, title, width, height, material, year, overview }, dialogClose }:
    { targetImg: Artwork, dialogClose: () => void; }) => {

    const { dialogOverlay, dialogContainer, dialogImageContainer, dialogImage, dialogInfo, dialogInfoTitle, dialogInfoOverView } = styles;

    // 화면 크기에 맞춘 사본을 먼저 보여 주고, 사본이 뜬 다음에 올린 원본 파일을 받아서 바꿈.
    // 같은 img의 주소만 바뀌므로 원본이 다 받아질 때까지는 사본이 그대로 보임 (원본은 수 MB라 바로 뜨지 않음)
    const [original, setOriginal] = useState(false);

    return <div className={dialogOverlay} onClick={() => { dialogClose(); }}>
        <div className={dialogContainer} onClick={e => e.stopPropagation()}>
            <div className={dialogImageContainer}>
                <Image
                    className={dialogImage}
                    src={poster_path}
                    alt={title}
                    width={0}
                    height={0}
                    // 원본: 홈 화면에서 확대해 받아 둔 그림이면 다시 받지 않고 바로 뜸 (같은 방식으로 받아야 해서 crossOrigin을 맞춤).
                    // 사본: 그림 칸은 가로 화면에서 높이의 60%, 세로 화면에서 너비의 63%
                    {...(original
                        ? { unoptimized: true, crossOrigin: 'anonymous' as const }
                        : { sizes: '(max-aspect-ratio: 1/1) 63vw, 60vh', quality: ARTWORK_QUALITY })}
                    onLoad={() => setOriginal(true)}
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                />
            </div>
            <div className={dialogInfo}>
                <span className={dialogInfoTitle}>{title}</span>
                <span>{year}</span>
                <span>{formatSize(width, height)}</span>
                <span>{material}</span>
                <span className={dialogInfoOverView}>{overview}</span>
            </div>
        </div>
    </div>;
};
export default MainImgDialog;