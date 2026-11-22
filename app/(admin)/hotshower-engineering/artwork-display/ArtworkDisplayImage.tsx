"use client";

import React, { useState, useEffect, useRef } from 'react';
import FramedImage from "../../../components/MainImage/FramedImage";
import { Artwork } from "@/types";


interface params {
    targetArtworks: Artwork;
    setTargetItem: (item: Artwork) => void; // 타겟 아이템 설정 함수
    posterFrameRef: React.RefObject<HTMLDivElement | null>; // 포스터 프레임 참조
    refreshZindex: (id: string) => void; // zIndex 업데이트 함수
    onRatio?: (id: string, ratio: number) => void; // 이미지를 불러온 뒤 가로/세로 비율 알림
    locked?: boolean; // 잠겨 있으면 그림을 옮길 수 없음 (그룹 순서를 바꾸는 중)
}


// 전시창 카드 한 변의 화면 크기는 화면 폭의 40%, 화면 높이의 80%를 넘지 않음 (ArtworkDisplayPanel의 카드 크기).
// 설명 순서 목록이 옆에 생기는 그룹은 카드가 이보다 작아서, 필요한 것보다 한 단계 큰 사본을 받을 수 있음 (흐려지지는 않음)
const CARD_VW = 40;
const CARD_VH = 80;

const ArtworkDisplayImage = ({ posterFrameRef, targetArtworks, setTargetItem, refreshZindex, onRatio, locked }: params) => {

    const dragging = useRef(false);
    const imgRef = useRef<HTMLImageElement | null>(null);
    // 이미지 x시작위치 
    const imgStartX = useRef(0);
    // 이미지 y시작위치
    const imgStartY = useRef(0);

    const { id, poster_path, title, top, width, groupWinSize, left, zIndex } = targetArtworks;

    // 이 그림이 카드에서 차지하는 비율 (전시창보다 큰 그림은 1로 봄)
    const share = Math.min(1, width / (groupWinSize || 1000));

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
        if (locked) return;
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
        <FramedImage
            width={0}
            height={0}
            // 화면에 그려지는 너비에 맞는 사본을 받음. 카드 전체 너비로 알려 주면 작게 놓인 그림도 큰 파일을 받음 (이 화면은 확대가 없음).
            // sizes="auto"는 쓰지 않음: 그룹을 다시 고르면 브라우저가 화면 전체 폭으로 계산해 가장 큰 사본(3840)을 받았음
            sizes={`min(${(CARD_VW * share).toFixed(1)}vw, ${(CARD_VH * share).toFixed(1)}vh)`}
            ref={imgRef}
            style={{ top: `${top ?? 0}%`, width: `${(width / (groupWinSize || 1000)) * 100}%`, height: 'auto', left: `${left ?? 0}%`, zIndex: zIndex ?? undefined }}
            src={poster_path}
            alt={title}
            draggable={false}
            onLoad={(e) => onRatio?.(id, e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
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