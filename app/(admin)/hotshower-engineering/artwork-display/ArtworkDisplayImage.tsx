"use client"

import React, { useState, useEffect, useRef } from 'react';
import ImageStyle from "../../../components/MainImage/MainImage.module.css";
import { Artwork } from "@/types";


interface params {
    targetArtworks: Artwork;
    setTargetItem: (item: Artwork) => void; // 타겟 아이템 설정 함수
    posterFrameRef: React.RefObject<HTMLDivElement>; // 포스터 프레임 참조
}


const ArtworkDisplayImage = ({ posterFrameRef, targetArtworks, setTargetItem }: params) => {

    const dragging = useRef(false);
    const imgRef = useRef<HTMLImageElement | null>(null);
    // 이미지 x시작위치 
    const imgStartX = useRef(0);
    // 이미지 y시작위치
    const imgStartY = useRef(0);

    const { id, poster_path, title, top, width, left, zIndex } = targetArtworks;

    return (
        <img className={ImageStyle.metalFrame}
            ref={imgRef}
            style={{ top: `${top}%`, width: `${width}%`, left: `${left}%`, zIndex }}
            src={poster_path}
            alt={title}
            draggable={false}
            onMouseMove={(e: React.MouseEvent<HTMLImageElement>) => {
                if (!dragging.current || !posterFrameRef.current) return;
                // 드래그 중일 때 마우스 위치에 따라 이미지 이동
                const { width: posterFrameWidth, height: posterFrameHeight } = posterFrameRef.current.getBoundingClientRect();
                const { width: imgWidth, height: imgHeight } = imgRef.current.getBoundingClientRect();

                // 이동 거리(px)
                const movePxX = e.clientX - imgStartX.current;
                const movePxY = e.clientY - imgStartY.current;

                // % 단위로 변환
                const deltaPctX = (movePxX / posterFrameWidth) * 100;
                const deltaPctY = (movePxY / posterFrameHeight) * 100;

                const maxPctX = 100 - (imgWidth / posterFrameWidth) * 100; // 최대 이동 가능 비율 (100% - 이미지 너비)
                const maxPxtY = 100 - (imgHeight / posterFrameHeight) * 100; // 최대 이동 가능 비율 (100% - 이미지 높이)

                setTargetItem({
                    ...targetArtworks,
                    left: Math.min(Math.max(left + deltaPctX, 0), maxPctX),
                    top: Math.min(Math.max(top + deltaPctY, 0), maxPxtY)
                });

                // 기준점을 업데이트 (다음 move에 대비)
                imgStartX.current = e.clientX;
                imgStartY.current = e.clientY;
            }}
            onMouseDown={(e: React.MouseEvent<HTMLImageElement>) => {
                if (!imgRef.current || !posterFrameRef.current) return;
                // 드래그 시작
                dragging.current = true;
                // 마우스 클릭 시 이미지 X 시작 위치 계산
                imgStartX.current = e.clientX
                // 마우스 클릭 시 이미지 Y 시작 위치 계산
                imgStartY.current = e.clientY
            }}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
        >
        </img>
    )
}
export default ArtworkDisplayImage;