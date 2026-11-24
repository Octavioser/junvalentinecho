"use client";
import { useCallback, useEffect, useRef } from "react";

/**
 * 홈 카드 옆 설명이 정해진 높이 안에 다 들어가게 줄임 (그림이 많은 그룹은 설명이 길어서 화면 위로 넘쳤음)
 * - 가로 화면(PC): 카드 높이 안에
 * - 세로 화면(모바일): 카드가 작아서 카드 위·아래 빈 곳까지 씀 (위는 화면 위 가운데 이름 아래부터, 아래는 플레이어 위까지)
 * 넘치면 먼저 설명 사이 간격을 줄이고(32px → 8px), 그래도 넘치면 글자 크기를 줄임.
 * 줄인 값은 home.module.css의 --caption-gap·--caption-font·--caption-shift로 넘김
 */
const MIN_GAP = 0.25;  // 설명 사이 간격은 원래의 25%까지
const MIN_FONT = 0.3;  // 글자는 원래(11px)의 30%까지. 그래도 넘치면 그 크기로 둠
const MOBILE_TOP = 64; // 세로 화면에서 설명이 올라갈 수 있는 맨 위(px): 화면 위 가운데 이름의 아래. 2D 시리즈 목록이 시작하는 높이와 같음

// 줄이는 정도. 0이면 그대로, 1이면 가장 많이 줄임: 앞 절반은 간격만, 뒤 절반은 글자 크기
const setLevel = (box: HTMLElement, level: number) => {
    const gap = level < 0.5 ? 1 - (1 - MIN_GAP) * level * 2 : MIN_GAP;
    const font = level <= 0.5 ? 1 : 1 - (1 - MIN_FONT) * (level - 0.5) * 2;
    box.style.setProperty('--caption-gap', gap.toFixed(4));
    box.style.setProperty('--caption-font', font.toFixed(4));
};

// 설명 칸(box) 하나를 맞춤. box는 카드 틀(posterCardFrame) 안에 있고, 틀은 화면 한 칸(posterTrack) 안에 있음
const fitCaptions = (box: HTMLElement) => {
    const first = box.firstElementChild, last = box.lastElementChild;
    const frame = box.parentElement, track = frame?.parentElement;
    if (!first || !last || !frame || !track) return;

    const portrait = window.matchMedia('(max-aspect-ratio: 1/1)').matches;
    const card = frame.getBoundingClientRect();
    const area = portrait ? track.getBoundingClientRect() : card;
    const top = portrait ? Math.max(area.top, MOBILE_TOP) : area.top;
    const room = area.bottom - top;
    // 설명 전체의 높이. 설명은 카드 아래 끝에 맞춰 위로 쌓이므로 넘친 부분(칸 위로 나간 부분)까지 셈
    const height = () => last.getBoundingClientRect().bottom - first.getBoundingClientRect().top;

    setLevel(box, 0);
    if (height() > room) {
        // 들어가는 가장 작은 단계를 찾음 (줄일수록 높이가 줄어듦)
        let low = 0, high = 1;
        setLevel(box, 1);
        if (height() <= room) {
            for (let i = 0; i < 10; i++) {
                const middle = (low + high) / 2;
                setLevel(box, middle);
                if (height() <= room) high = middle; else low = middle;
            }
        }
        setLevel(box, high);
    }

    // 세로 화면: 카드 아래 끝에 맞춘 설명의 맨 위가 이름에 닿으면 그만큼 아래로 내려서 카드 아래 빈 곳을 씀
    const shift = portrait ? Math.max(0, top - (card.bottom - height())) : 0;
    box.style.setProperty('--caption-shift', `${shift.toFixed(1)}px`);
};

// 설명 칸에 ref로 붙임. 처음 그릴 때, 화면 크기가 바뀔 때, 글꼴을 다 받았을 때, 설명 내용이 바뀔 때(deps) 다시 맞춤
export function useCaptionFit(deps: unknown) {
    const boxes = useRef(new Set<HTMLElement>());

    useEffect(() => {
        let frame = 0;
        const fitAll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => boxes.current.forEach(fitCaptions));
        };
        fitAll();
        window.addEventListener('resize', fitAll);
        document.fonts?.ready.then(fitAll);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', fitAll);
        };
    }, [deps]);

    return useCallback((box: HTMLDivElement | null) => {
        if (!box) return;
        boxes.current.add(box);
        return () => { boxes.current.delete(box); };
    }, []);
}
