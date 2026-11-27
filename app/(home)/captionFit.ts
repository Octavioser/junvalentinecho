"use client";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * 홈 카드 옆 설명을 카드 높이 안에 넣음: 설명은 카드 높이를 넘지 않음 (PC·모바일 같음).
 * 그림이 많은 그룹은 설명이 길어서, 그대로 두면 카드 위아래로 튀어나오고 심하면 화면 밖이나 플레이어 밑으로 잘림.
 * 넘칠 때 줄이는 순서:
 *  1) 설명 사이 간격을 줄이고(32px → 8px), 그래도 넘치면 글자를 원래의 80%까지 줄임
 *  2) 그래도 넘치면 제목과 크기만 남기고(재료·연도는 숨김) 다시 간격 → 글자(80%까지) 순서로 줄임
 *  3) 그래도 넘치면(작은 휴대폰 화면에 그림이 열 장 넘는 그룹) 간격을 거의 없애고(2px) 글자를 더 줄임
 * 줄인 뒤에는 실제로 그려진 높이를 다시 재서 들어갔는지 봄: 8px 아래로는 글자를 그려 주지 않는 브라우저(안드로이드 앱 안 브라우저 등)가
 * 있어서, 글자 크기만 믿고 계산하면 그런 곳에서는 덜 줄어들어 설명이 넘치고 잘렸음. 같은 이유로 줄 높이는 글자 크기와 따로 px로 줌
 * (home.module.css). 그래서 글자가 더 작아지지 못하는 브라우저에서도 줄 높이는 줄어들어 카드 높이 안에 들어감
 * 줄인 값은 home.module.css의 --caption-gap·--caption-font·--caption-shift와 data-compact로 넘김
 */
const GAP_STEPS = [1, 0.25, 0.0625]; // 설명 사이 간격(원래 32px에 곱함): 그대로 → 8px(1·2단계) → 2px(3단계)
const FONT_STEPS = [1, 0.8, 0.3];    // 글자 크기(원래 11px에 곱함): 그대로 → 읽기 편한 아래쪽 끝(1·2단계) → 가장 작게(3단계)
const FULL_LEVEL = 2;                // 1·2단계에서 줄이는 끝
const DENSE_LEVEL = 3;               // 3단계에서 줄이는 끝
const MOBILE_TOP = 64;               // 세로 화면에서 화면 위 가운데 이름의 아래(px). 아래 "그래도 안 들어갈 때"에만 씀
const SLACK = 0.5;                   // 소수점 크기 차이로 "넘친다"고 보지 않게 두는 여유 (px)

const mix = (from: number, to: number, t: number) => from + (to - from) * Math.min(1, Math.max(0, t));

// 줄이는 정도 (0 = 그대로). 0~1: 간격을 8px까지 / 1~2: 글자를 80%까지 / 2~2.5: 간격을 2px까지 / 2.5~3: 글자를 30%까지
const setLevel = (box: HTMLElement, level: number) => {
    const gap = level <= 2 ? mix(GAP_STEPS[0], GAP_STEPS[1], level) : mix(GAP_STEPS[1], GAP_STEPS[2], (level - 2) * 2);
    const font = level <= 2.5 ? mix(FONT_STEPS[0], FONT_STEPS[1], level - 1) : mix(FONT_STEPS[1], FONT_STEPS[2], (level - 2.5) * 2);
    box.style.setProperty('--caption-gap', gap.toFixed(4));
    box.style.setProperty('--caption-font', font.toFixed(4));
};

// 설명 높이(height())가 room에 들어가는 가장 약한 단계를 0 ~ maxLevel에서 찾아서 적용함 (줄일수록 높이가 줄어듦).
// 들어갔는지를 돌려주고, 끝까지 줄여도 안 들어가면 끝까지 줄인 채로 둠
const shrinkToFit = (box: HTMLElement, height: () => number, room: number, maxLevel: number) => {
    const fits = (level: number) => { setLevel(box, level); return height() <= room + SLACK; };
    if (fits(0)) return true;
    if (!fits(maxLevel)) return false;
    let low = 0, high = maxLevel;
    for (let i = 0; i < 12; i++) {
        const middle = (low + high) / 2;
        if (fits(middle)) high = middle; else low = middle;
    }
    setLevel(box, high);
    return true;
};

// 설명 칸(box) 하나를 맞춤. box는 카드 틀(posterCardFrame) 안에 있고, 틀은 화면 한 칸(posterTrack) 안에 있음
const fitCaptions = (box: HTMLElement) => {
    const first = box.firstElementChild, last = box.lastElementChild;
    const frame = box.parentElement, track = frame?.parentElement;
    if (!first || !last || !frame || !track) return;

    const card = frame.getBoundingClientRect(); // 틀의 높이 = 카드 한 변
    if (card.height <= 0) return;               // 아직 화면에 놓이지 않았음 (놓이면 크기가 바뀌면서 다시 불림)
    // 설명 전체의 높이. 설명은 카드 아래 끝에 맞춰 위로 쌓이므로 넘친 부분(칸 위로 나간 부분)까지 셈
    const height = () => last.getBoundingClientRect().bottom - first.getBoundingClientRect().top;
    // 제목과 크기만 보여 줄지 (재료·연도 줄을 숨김)
    const setCompact = (on: boolean) => { if (on) box.setAttribute('data-compact', ''); else box.removeAttribute('data-compact'); };

    setCompact(false);
    if (!shrinkToFit(box, height, card.height, FULL_LEVEL)) {
        setCompact(true);
        shrinkToFit(box, height, card.height, DENSE_LEVEL);
    }

    // 끝까지 줄여도 카드보다 길 때(그림이 수십 장인 그룹 정도)만: 카드 아래 끝에 맞춘 채 위로만 길어지면 화면 위로 잘리므로,
    // 카드 가운데에 맞춰 위아래로 같은 만큼 나가게 하고 화면 한 칸(위는 이름 아래, 아래는 플레이어 위)을 벗어나지 않게 함
    const tall = height();
    let shift = 0; // 설명을 아래로 내리는 만큼 (px)
    if (tall > card.height + SLACK) {
        const area = track.getBoundingClientRect();
        const top = window.matchMedia('(max-aspect-ratio: 1/1)').matches ? Math.max(area.top, MOBILE_TOP) : area.top;
        const centered = card.top - (tall - card.height) / 2;
        const placed = Math.max(top, Math.min(centered, area.bottom - tall));
        shift = placed - (card.bottom - tall);
    }
    box.style.setProperty('--caption-shift', `${shift.toFixed(1)}px`);
};

// 설명 칸에 ref로 붙임. deps: 설명 내용이 바뀌는 값
export function useCaptionFit(deps: unknown) {
    const boxes = useRef(new Set<HTMLElement>());
    const observer = useRef<ResizeObserver | null>(null);
    const frame = useRef(0);
    const fitAll = useCallback(() => {
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => boxes.current.forEach(fitCaptions));
    }, []);

    // 설명 내용이 바뀌면 화면에 그리기 전에 바로 맞춤 (넘친 모습이 잠깐 보였다가 줄어들지 않게)
    useLayoutEffect(() => { boxes.current.forEach(fitCaptions); }, [deps]);

    // 화면 크기가 바뀌거나 글꼴을 다 받았을 때 다시 맞춤 (글꼴이 바뀌면 줄바꿈이 달라져 높이가 변함)
    useEffect(() => {
        window.addEventListener('resize', fitAll);
        document.fonts?.addEventListener?.('loadingdone', fitAll);
        document.fonts?.ready.then(fitAll);
        return () => {
            cancelAnimationFrame(frame.current);
            window.removeEventListener('resize', fitAll);
            document.fonts?.removeEventListener?.('loadingdone', fitAll);
        };
    }, [fitAll]);

    return useCallback((box: HTMLDivElement | null) => {
        if (!box) return;
        boxes.current.add(box);
        // 카드 틀의 크기가 바뀔 때도 다시 맞춤 (화면 회전, 주소창이 접히며 높이가 바뀜, 숨겨져 있다가 보이게 됨)
        const card = box.parentElement;
        if (card && typeof ResizeObserver !== 'undefined') (observer.current ??= new ResizeObserver(fitAll)).observe(card);
        return () => {
            boxes.current.delete(box);
            if (card) observer.current?.unobserve(card);
        };
    }, [fitAll]);
}
