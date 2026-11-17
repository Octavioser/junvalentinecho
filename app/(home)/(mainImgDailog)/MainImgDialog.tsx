import styles from './MainImgDialog.module.css';
import { Fragment, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Artwork } from "@/types";
import { formatSize } from "@/common/format";
import { ARTWORK_QUALITY } from "@/common/image";

const MainImgDialog = ({ targetImg: { poster_path, title, width, height, material, year, overview }, dialogClose }:
    { targetImg: Artwork, dialogClose: () => void; }) => {

    const { dialogOverlay, dialogContainer, dialogImageContainer, dialogImage, dialogInfo, dialogInfoTitle, dialogInfoOverView } = styles;

    return <div className={dialogOverlay} onClick={() => { dialogClose(); }}>
        <div className={dialogContainer} onClick={e => e.stopPropagation()}>
            <div className={dialogImageContainer}>
                {/* 원본 대신 화면 크기에 맞춘 사본을 받음 (원본을 통째로 받지 않아 빨리 뜸). 그림 칸은 가로 화면에서 높이의 60%, 세로 화면에서 너비의 63% */}
                <Image
                    className={dialogImage}
                    src={poster_path}
                    alt={title}
                    width={0}
                    height={0}
                    sizes="(max-aspect-ratio: 1/1) 63vw, 60vh"
                    quality={ARTWORK_QUALITY}
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