import styles from './MainImgDialog.module.css';
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { Artwork } from "@/types";
import { formatSize } from "@/common/format";
import { ARTWORK_QUALITY } from "@/common/image";

// 그림을 누르면 뜨는 창 (홈 화면과 2D 화면이 같이 씀).
// 흰 상자 없이 화면 전체를 반투명하게 흐리고, 그 위에 그림을 크게 놓음.
// 그림 오른쪽 위에 정보(제목·크기·재료·연도: 홈 화면 카드 옆 설명과 같은 글씨), 그 아래에 설명 글(2D 화면의 설명과 같은 글씨).
// 세로 화면(모바일)은 오른쪽에 자리가 없어서 정보와 설명이 그림 아래로 내려감.
//
// previewSrc: 이 창을 열려고 누른 그림(화면에 이미 떠 있던 것)의 주소. 새로 받을 게 없어서 창이 열리자마자 보여 줄 수 있음
//
// 그림은 두 장을 같은 자리에 겹쳐 둠:
//  - 아래: 누른 그림 (바로 보임)
//  - 위  : 이 창 크기에 맞춘 사본 → 올린 원본 파일(수 MB). 다 받아서 뜬 다음에 보이게 하고, 그때 아래 그림을 치움
// 한 img의 주소를 "누른 그림 → 사본"으로 바꾸는 방식은 쓰지 않음: 사본 목록(srcset)을 붙이는 순간 브라우저가 떠 있던 그림을 지워서,
// 사본이 올 때까지 그림 자리가 비었음 (사본을 처음 만들 때는 1초 넘게 걸림)
const MainImgDialog = ({ targetImg: { poster_path, title, width, height, material, year, overview }, previewSrc, dialogClose }:
    { targetImg: Artwork, previewSrc?: string, dialogClose: () => void; }) => {

    const { dialogOverlay, dialogContent, dialogImageBox, dialogImage, dialogInfo, dialogInfoLines, dialogInfoTitle, dialogInfoOverView } = styles;

    // 위 그림이 원본인지. 누른 그림이 이미 원본이면(홈 화면에서 확대해 둔 그림) 처음부터 원본
    const [original, setOriginal] = useState(previewSrc === poster_path);
    // 위 그림이 떴는지 (뜨기 전에는 숨겨 두고 아래 그림을 보여 줌)
    const [shown, setShown] = useState(false);

    // 그림의 가로/세로 비율. 그림 자리를 이 비율로 딱 맞게 잡아야 정보가 그림의 오른쪽 위 모서리에 붙음.
    // 처음에는 입력해 둔 실제 크기(cm)로 어림하고, 그림 파일의 진짜 비율을 알게 되면 그걸로 바꿈
    const sizeRatio = width > 0 && height > 0 ? width / height : null;
    const [ratio, setRatio] = useState(sizeRatio || 1);
    const readRatio = (image: HTMLImageElement | null) => {
        if (image && image.naturalWidth > 0 && image.naturalHeight > 0) setRatio(image.naturalWidth / image.naturalHeight);
    };
    // 누른 그림은 이미 받아 둔 것이라, 화면에 그리기 전에 진짜 비율을 읽을 수 있음 (그림 자리가 한 번 움찔하지 않게)
    const previewRef = useRef<HTMLImageElement>(null);
    useLayoutEffect(() => { readRatio(previewRef.current); }, []);

    // 원본은 창이 열리자마자 따로 받기 시작해서, 다 받고 풀어 둔(decode) 다음에 위 그림을 원본으로 바꿈.
    // (사본을 기다렸다가 받기 시작하면 그만큼 늦어지고, 풀기 전에 바꾸면 푸는 동안 그림 자리가 잠깐 비어서 번쩍임)
    useEffect(() => {
        let alive = true;
        const image = new window.Image();
        image.crossOrigin = 'anonymous';
        image.src = poster_path;
        image.decode().then(() => { if (alive) setOriginal(true); }).catch(() => { /* 원본을 못 받으면 사본을 계속 보여 줌 */ });
        return () => { alive = false; };
    }, [poster_path]);

    // Esc 키로도 닫힘
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dialogClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [dialogClose]);

    // 그림과 글씨를 누른 것은 닫는 것으로 치지 않음 (그 밖의 빈 곳을 누르면 닫힘)
    const keepOpen = (e: React.MouseEvent) => { e.stopPropagation(); };

    // 사본을 고를 때 알려 주는 그림 너비: 가로 화면은 화면 높이의 84%에 맞춘 너비(최대 화면 폭의 74%), 세로 화면은 화면 폭의 92%
    // (MainImgDialog.module.css의 그림 자리 크기와 같은 값. 비율은 어림이라 10% 여유를 둠)
    const sizes = sizeRatio
        ? `(max-aspect-ratio: 1/1) min(92vw, ${(66 * sizeRatio * 1.1).toFixed(1)}vh), min(74vw, ${(84 * sizeRatio * 1.1).toFixed(1)}vh)`
        : '(max-aspect-ratio: 1/1) 92vw, 74vw';

    // data-picture-dialog: 홈 화면이 "이 창 위에서 굴린 휠"을 알아보는 표시 (그때는 뒤의 전시장을 넘기지 않음. Gallery.tsx)
    return (
        <div className={dialogOverlay} data-picture-dialog role="dialog" aria-modal="true" aria-label={title} onClick={() => { dialogClose(); }}>
            {/* --picture-ratio: 그림의 가로/세로 비율. 그림 자리의 크기를 이 값으로 계산함 */}
            <div className={dialogContent} style={{ '--picture-ratio': ratio } as React.CSSProperties}>
                <div className={dialogImageBox} onClick={keepOpen}>
                    {previewSrc && !shown && (
                        <img className={dialogImage} ref={previewRef} src={previewSrc} alt="" draggable={false}
                            onLoad={e => readRatio(e.currentTarget)} onContextMenu={e => e.preventDefault()} />
                    )}
                    <Image
                        className={dialogImage}
                        style={{ visibility: shown ? 'visible' : 'hidden' }}
                        src={poster_path}
                        alt={title}
                        width={0}
                        height={0}
                        // 원본: 위에서 미리 받아 둔 파일을 그대로 쓰려면 같은 방식(crossOrigin)으로 받아야 함
                        // 사본: 그림이 화면에 그려지는 너비에 맞는 것
                        {...(original
                            ? { unoptimized: true, crossOrigin: 'anonymous' as const }
                            : { sizes, quality: ARTWORK_QUALITY })}
                        // 그림이 바뀔 때 새 그림을 다 푼 다음에 한 번에 바꿔 그림 (기본값 async는 푸는 동안 그 자리를 비워 둬서 번쩍임)
                        decoding="sync"
                        // 항상 화면에 보이는 그림이라 늦게 받기(lazy)를 끔 (숨겨 둔 동안에도 받아야 함)
                        loading="eager"
                        onLoad={(e) => { readRatio(e.currentTarget); setShown(true); }}
                        draggable={false}
                        onContextMenu={e => e.preventDefault()}
                    />
                </div>
                <div className={dialogInfo}>
                    {/* 정보: 홈 화면 카드 옆 설명과 같은 글씨·같은 순서 (제목 / 크기 / 재료 / 연도) */}
                    <div className={dialogInfoLines} onClick={keepOpen}>
                        <span className={dialogInfoTitle}>{title}</span>
                        <span>{formatSize(width, height)}</span>
                        {material && <span>{material}</span>}
                        {!!year && <span>{year}</span>}
                    </div>
                    {/* 설명 글: 2D 화면의 그림 아래 설명과 같은 글씨 */}
                    {overview && <span className={dialogInfoOverView} onClick={keepOpen}>{overview}</span>}
                </div>
            </div>
        </div>
    );
};
export default MainImgDialog;
