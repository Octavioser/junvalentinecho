import styles from './MainImgDialog.module.css';
import { useState, useEffect } from "react";
import Image from "next/image";
import { Artwork } from "@/types";
import { formatSize } from "@/common/format";
import { ARTWORK_QUALITY } from "@/common/image";

// previewSrc: 이 창을 열려고 누른 그림(화면에 이미 떠 있던 것)의 주소. 새로 받을 게 없어서 창이 열리자마자 보여 줄 수 있음
//
// 그림은 두 장을 같은 자리에 겹쳐 둠:
//  - 아래: 누른 그림 (바로 보임)
//  - 위  : 이 창 크기에 맞춘 사본 → 올린 원본 파일(수 MB). 다 받아서 뜬 다음에 보이게 하고, 그때 아래 그림을 치움
// 한 img의 주소를 "누른 그림 → 사본"으로 바꾸는 방식은 쓰지 않음: 사본 목록(srcset)을 붙이는 순간 브라우저가 떠 있던 그림을 지워서,
// 사본이 올 때까지 그림 자리가 비었음 (사본을 처음 만들 때는 1초 넘게 걸림)
const MainImgDialog = ({ targetImg: { poster_path, title, width, height, material, year, overview }, previewSrc, dialogClose }:
    { targetImg: Artwork, previewSrc?: string, dialogClose: () => void; }) => {

    const { dialogOverlay, dialogContainer, dialogImageContainer, dialogImageBox, dialogImage, dialogInfo, dialogInfoTitle, dialogInfoOverView } = styles;

    // 위 그림이 원본인지. 누른 그림이 이미 원본이면(홈 화면에서 확대해 둔 그림) 처음부터 원본
    const [original, setOriginal] = useState(previewSrc === poster_path);
    // 위 그림이 떴는지 (뜨기 전에는 숨겨 두고 아래 그림을 보여 줌)
    const [shown, setShown] = useState(false);

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

    return <div className={dialogOverlay} onClick={() => { dialogClose(); }}>
        <div className={dialogContainer} onClick={e => e.stopPropagation()}>
            <div className={dialogImageContainer}>
                {/* --picture-ratio: 그림의 가로/세로 비율 (입력해 둔 실제 크기로 어림). 세로 화면에서 그림 자리를 이 비율로 잡아 창 폭을 꽉 채움 */}
                <div className={dialogImageBox} style={{ '--picture-ratio': width > 0 && height > 0 ? width / height : 1 } as React.CSSProperties}>
                    {previewSrc && !shown && (
                        <img className={dialogImage} src={previewSrc} alt="" draggable={false} onContextMenu={e => e.preventDefault()} />
                    )}
                    <Image
                        className={dialogImage}
                        style={{ visibility: shown ? 'visible' : 'hidden' }}
                        src={poster_path}
                        alt={title}
                        width={0}
                        height={0}
                        // 원본: 위에서 미리 받아 둔 파일을 그대로 쓰려면 같은 방식(crossOrigin)으로 받아야 함
                        // 사본: 그림 칸은 가로 화면에서 높이의 60%, 세로 화면에서 너비의 94%
                        {...(original
                            ? { unoptimized: true, crossOrigin: 'anonymous' as const }
                            : { sizes: '(max-aspect-ratio: 1/1) 94vw, 60vh', quality: ARTWORK_QUALITY })}
                        // 그림이 바뀔 때 새 그림을 다 푼 다음에 한 번에 바꿔 그림 (기본값 async는 푸는 동안 그 자리를 비워 둬서 번쩍임)
                        decoding="sync"
                        // 항상 화면에 보이는 그림이라 늦게 받기(lazy)를 끔 (숨겨 둔 동안에도 받아야 함)
                        loading="eager"
                        onLoad={() => setShown(true)}
                        draggable={false}
                        onContextMenu={e => e.preventDefault()}
                    />
                </div>
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
