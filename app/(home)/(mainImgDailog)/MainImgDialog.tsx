import styles from './MainImgDialog.module.css';
import { useState, useEffect } from "react";
import Image from "next/image";
import { Artwork } from "@/types";
import { formatSize } from "@/common/format";
import { ARTWORK_QUALITY } from "@/common/image";

// 그림을 보여 주는 단계 (뒤로 갈수록 선명함). 같은 img의 주소만 바꾸므로, 다음 단계의 그림이 다 받아질 때까지는 지금 그림이 그대로 보임
//  - preview : 이 창을 열려고 누른 그림(화면에 이미 떠 있던 것). 새로 받을 게 없어서 창이 열리자마자 보임
//  - copy    : 이 창 크기에 맞춘 사본
//  - original: 올린 원본 파일 (수 MB)
type Stage = 'preview' | 'copy' | 'original';

// previewSrc: 누른 그림의 주소 (없으면 사본부터 받음)
const MainImgDialog = ({ targetImg: { poster_path, title, width, height, material, year, overview }, previewSrc, dialogClose }:
    { targetImg: Artwork, previewSrc?: string, dialogClose: () => void; }) => {

    const { dialogOverlay, dialogContainer, dialogImageContainer, dialogImage, dialogInfo, dialogInfoTitle, dialogInfoOverView } = styles;

    // 누른 그림이 이미 원본이면(홈 화면에서 확대해 둔 그림) 처음부터 원본
    const [stage, setStage] = useState<Stage>(!previewSrc ? 'copy' : previewSrc === poster_path ? 'original' : 'preview');

    // 원본은 창이 열리자마자 따로 받기 시작해서, 다 받아지면 바로 원본으로 바꿈 (사본을 기다렸다가 받기 시작하면 그만큼 늦어짐)
    useEffect(() => {
        const image = new window.Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => setStage('original');
        image.src = poster_path;
        return () => { image.onload = null; };
    }, [poster_path]);

    const source =
        stage === 'preview' ? { src: previewSrc!, unoptimized: true }
            // 그림 칸은 가로 화면에서 높이의 60%, 세로 화면에서 너비의 63%
            : stage === 'copy' ? { src: poster_path, sizes: '(max-aspect-ratio: 1/1) 63vw, 60vh', quality: ARTWORK_QUALITY }
                // 위에서 미리 받아 둔 파일을 그대로 쓰려면 같은 방식(crossOrigin)으로 받아야 함
                : { src: poster_path, unoptimized: true, crossOrigin: 'anonymous' as const };

    return <div className={dialogOverlay} onClick={() => { dialogClose(); }}>
        <div className={dialogContainer} onClick={e => e.stopPropagation()}>
            <div className={dialogImageContainer}>
                <Image
                    className={dialogImage}
                    alt={title}
                    width={0}
                    height={0}
                    {...source}
                    // 누른 그림이 뜨면 이 창 크기에 맞춘 사본을 받기 시작 (원본이 먼저 오면 원본으로 넘어감)
                    onLoad={() => setStage(prev => prev === 'preview' ? 'copy' : prev)}
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
