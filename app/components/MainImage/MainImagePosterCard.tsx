"use client";
import styles from "./MainImage.module.css";
import { ReactZoomPanPinchContentRef, TransformWrapper, TransformComponent, useTransformEffect } from "react-zoom-pan-pinch";
import { useState, useEffect, useRef, Fragment } from "react";
import MainImageRatio from "./MainImageRatio";

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const PINCH_SPEED = 0.012;   // 휠 값 1당 확대 배율(지수). 트랙패드 핀치는 작은 값이 여러 번 옴
const MAX_WHEEL_STEP = 25;   // 마우스 휠 한 칸(100)이 한 번에 너무 크게 확대되지 않게

// 트랙패드 핀치 확대를 배율에 곱하는 방식으로 직접 처리 (Chrome·Firefox: ctrl+wheel, 맥 Safari: gesture 이벤트).
// 라이브러리의 휠 확대는 배율을 더하는 방식 + 소수 셋째 자리 반올림이라 트랙패드처럼 작은 값이 많이 오면 거의 안 커짐
const usePinchZoom = (wrapperRef: React.RefObject<HTMLDivElement | null>, zoomRef: React.RefObject<ReactZoomPanPinchContentRef | null>, enabled: boolean) => {
    useEffect(() => {
        const el = wrapperRef.current;
        if (!enabled || !el) return;
        let gestureBase: number | null = null;

        const zoomAt = (target: number, clientX: number, clientY: number) => {
            const zoom = zoomRef.current;
            if (!zoom) return;
            const { scale, positionX, positionY } = zoom.instance.transformState;
            const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, target));
            if (next === scale) return;
            const rect = el.getBoundingClientRect();
            // 커서 아래 지점은 그대로 두고, 카드보다 작아지면 가운데, 크면 카드 밖 빈 곳이 안 보이게
            const fit = (position: number, size: number, pointer: number) => {
                const moved = pointer - (pointer - position) * (next / scale);
                return next < 1 ? (size - size * next) / 2 : Math.min(0, Math.max(size - size * next, moved));
            };
            zoom.setTransform(fit(positionX, rect.width, clientX - rect.left), fit(positionY, rect.height, clientY - rect.top), next, 0);
        };

        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey || gestureBase !== null || !zoomRef.current) return;
            e.preventDefault();
            const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
            const step = Math.max(-MAX_WHEEL_STEP, Math.min(MAX_WHEEL_STEP, delta));
            zoomAt(zoomRef.current.instance.transformState.scale * Math.exp(-step * PINCH_SPEED), e.clientX, e.clientY);
        };

        // 맥 Safari 트랙패드 핀치 (터치 기기의 핀치는 라이브러리가 터치 이벤트로 처리)
        type GestureEvent = UIEvent & { scale: number; clientX: number; clientY: number; };
        const onGestureStart = (e: Event) => {
            if (navigator.maxTouchPoints > 0 || !zoomRef.current) return;
            e.preventDefault();
            gestureBase = zoomRef.current.instance.transformState.scale;
        };
        const onGestureChange = (e: Event) => {
            if (gestureBase === null) return;
            e.preventDefault();
            const { scale, clientX, clientY } = e as GestureEvent;
            zoomAt(gestureBase * scale, clientX, clientY);
        };
        const onGestureEnd = (e: Event) => {
            if (gestureBase === null) return;
            e.preventDefault();
            gestureBase = null;
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('gesturestart', onGestureStart);
        el.addEventListener('gesturechange', onGestureChange);
        el.addEventListener('gestureend', onGestureEnd);
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('gesturestart', onGestureStart);
            el.removeEventListener('gesturechange', onGestureChange);
            el.removeEventListener('gestureend', onGestureEnd);
        };
    }, [wrapperRef, zoomRef, enabled]);
};

const RatioUpdater = ({ setRatio, contentRef, baseRatio }: { setRatio: (r: number) => void; contentRef: React.RefObject<HTMLDivElement>; baseRatio: number; }) => {
    useTransformEffect(({ state }) => {
        setRatio(Math.round(state.scale * baseRatio));
        if (contentRef.current) {
            contentRef.current.style.setProperty('--inverse-scale', `${1 / state.scale}`);
        }
    });
    return null;
};

const MainImagePosterCard = ({ children, onMouseMove, onMouseUp, onMouseLeave, winSize = 1000, alwaysShowRatio = false, isAdmin = false }: {
    children: React.ReactNode;
    onMouseMove?: ((e: React.MouseEvent<HTMLDivElement>) => void) | null | undefined;
    onMouseUp?: (() => void) | null | undefined;
    onMouseLeave?: (() => void) | null | undefined;
    isAdmin?: boolean;
    winSize?: number;
    alwaysShowRatio?: boolean;
}) => {

    const { posterCard } = styles;
    const [ratio, setRatio] = useState(100); // Zoom scale, not winSize
    const contentRef = useRef<HTMLDivElement>(null!);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<ReactZoomPanPinchContentRef>(null);
    usePinchZoom(wrapperRef, zoomRef, !isAdmin);

    return (
        <div
            className={posterCard}
            onMouseMove={onMouseMove || undefined}
            onMouseUp={onMouseUp || undefined}
            onMouseLeave={onMouseLeave || undefined}
            style={{ touchAction: 'none' }}
        >
            {isAdmin ? (
                children
            ) : (
                <div ref={wrapperRef} className="zoom-wrapper" style={{ width: '100%', height: '100%' }}>
                    <TransformWrapper
                        ref={zoomRef}
                        initialScale={1}
                        minScale={MIN_SCALE}
                        maxScale={MAX_SCALE}
                        wheel={{ disabled: true }} // 휠·트랙패드 확대는 usePinchZoom이 처리
                        pinch={{ disabled: false }}
                        doubleClick={{ disabled: true }}
                    >
                        <>
                            <RatioUpdater setRatio={setRatio} contentRef={contentRef} baseRatio={100} />
                            <TransformComponent
                                wrapperStyle={{ width: '100%', height: '100%' }}
                                contentStyle={{ width: '100%', height: '100%' }}
                            >
                                <div
                                    ref={contentRef}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        '--inverse-scale': 1
                                    } as React.CSSProperties}
                                >
                                    {children}
                                </div>
                            </TransformComponent>
                        </>
                    </TransformWrapper>
                </div>
            )}
            {alwaysShowRatio && (
                <div style={{ position: 'absolute', bottom: '-15px', right: '0', zIndex: 10, pointerEvents: 'none' }}>
                    {/* 확대하면 카드가 보여주는 실제 길이는 줄어듦 (전시창 크기 ÷ 배율) */}
                    <MainImageRatio label={`${Math.floor(winSize * 100 / ratio)}cm`} />
                </div>
            )}
        </div>
    );
};

export default MainImagePosterCard;