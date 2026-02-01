"use client";

import React, { useState, useEffect, useRef } from 'react';
import ImageStyle from "../../../components/MainImage/MainImage.module.css";
import Image from "next/image";
import { Artwork } from "@/types";


interface params {
    targetArtworks: Artwork;
    setTargetItem: (item: Artwork) => void; // 타겟 아이템 설정 함수
    posterFrameRef: React.RefObject<HTMLDivElement | null>; // 포스터 프레임 참조
    refreshZindex: (id: string) => void; // zIndex 업데이트 함수
}


const ArtworkDisplayImage = ({ posterFrameRef, targetArtworks, setTargetItem, refreshZindex }: params) => {

    const dragging = useRef(false);
    const imgRef = useRef<HTMLImageElement | null>(null);
    // 이미지 x시작위치 
    const imgStartX = useRef(0);
    // 이미지 y시작위치
    const imgStartY = useRef(0);

    const { id, poster_path, title, top, width, galleryRaito, left, zIndex } = targetArtworks;

    const handleMove = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
        if (!dragging.current) return;

        // 드래그 중일때만 스크롤 및 전파 방지
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();

        if (!dragging.current || !posterFrameRef.current || !imgRef.current) return;
        // 드래그 중일 때 마우스 위치에 따라 이미지 이동
        const { width: posterFrameWidth, height: posterFrameHeight } = posterFrameRef.current.getBoundingClientRect();
        const { width: imgWidth, height: imgHeight } = imgRef.current.getBoundingClientRect();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // 이동 거리(px)
        const movePxX = clientX - imgStartX.current;
        const movePxY = clientY - imgStartY.current;

        // % 단위로 변환
        const deltaPctX = (movePxX / posterFrameWidth) * 100;
        const deltaPctY = (movePxY / posterFrameHeight) * 100;

        const maxPctX = 100 - (imgWidth / posterFrameWidth) * 100; // 최대 이동 가능 비율 (100% - 이미지 너비)
        const maxPxtY = 100 - (imgHeight / posterFrameHeight) * 100; // 최대 이동 가능 비율 (100% - 이미지 높이)

        setTargetItem({
            ...targetArtworks,
            left: Math.min(Math.max((left ?? 0) + deltaPctX, 0), maxPctX),
            top: Math.min(Math.max((top ?? 0) + deltaPctY, 0), maxPxtY)
        });

        // 기준점을 업데이트 (다음 move에 대비)
        imgStartX.current = clientX;
        imgStartY.current = clientY;
    };

    const handleDown = (e: React.MouseEvent<HTMLImageElement> | React.TouchEvent<HTMLImageElement>) => {
        e.stopPropagation();
        // handleDown에서 preventDefault를 하면 다음 이벤트가 씹힐 수 있음.
        // 대신 마우스 드래그 이미지 고스트 방지를 위해 draggable={false}는 이미 설정됨.

        if (!imgRef.current || !posterFrameRef.current) return;
        // 드래그 시작

        refreshZindex(id); // zIndex 업데이트

        dragging.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        // 마우스 클릭 시 이미지 X 시작 위치 계산
        imgStartX.current = clientX;
        // 마우스 클릭 시 이미지 Y 시작 위치 계산
        imgStartY.current = clientY;
    };

    return (
        <Image
            width={0}
            height={0}
            sizes="33vw"
            className={ImageStyle.metalFrame}
            ref={imgRef}
            style={{ top: `${top ?? 0}%`, width: `${width * (galleryRaito ?? 100) / 100}%`, height: 'auto', left: `${left ?? 0}%`, zIndex: zIndex ?? undefined }}
            src={poster_path}
            alt={title}
            draggable={false}
            onMouseDown={handleDown}
            onTouchStart={handleDown}
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchEnd={() => { dragging.current = false; }}

        />
    );
};
export default ArtworkDisplayImage;