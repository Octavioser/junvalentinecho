"use client";
import styles from "./MainImage.module.css";
import { TransformWrapper, TransformComponent, useTransformEffect } from "react-zoom-pan-pinch";
import { useState, useEffect, useRef, Fragment } from "react";
import MainImageRatio from "./MainImageRatio";

const RatioUpdater = ({ setRatio, contentRef, baseRatio }: { setRatio: (r: number) => void; contentRef: React.RefObject<HTMLDivElement>; baseRatio: number; }) => {
    useTransformEffect(({ state }) => {
        setRatio(Math.round(state.scale * baseRatio));
        if (contentRef.current) {
            contentRef.current.style.setProperty('--inverse-scale', `${1 / state.scale}`);
        }
    });
    return null;
};

const MainImagePosterCard = ({ children, onMouseMove, onMouseUp, onMouseLeave, ratio: propRatio = 100, alwaysShowRatio = false, isAdmin = false }: {
    children: React.ReactNode;
    onMouseMove?: ((e: React.MouseEvent<HTMLDivElement>) => void) | null | undefined;
    onMouseUp?: (() => void) | null | undefined;
    onMouseLeave?: (() => void) | null | undefined;
    isAdmin?: boolean;
    ratio?: number;
    alwaysShowRatio?: boolean;
}) => {

    const { posterCard } = styles;
    const [ratio, setRatio] = useState(propRatio);
    const contentRef = useRef<HTMLDivElement>(null!);

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
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={5}
                    wheel={{ step: 0.1 }}
                    pinch={{ disabled: false }}
                >
                    <>
                        <RatioUpdater setRatio={setRatio} contentRef={contentRef} baseRatio={propRatio} />
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
            )}
            {alwaysShowRatio && (
                <div style={{ position: 'absolute', bottom: '-15px', right: '0', zIndex: 10, pointerEvents: 'none' }}>
                    <MainImageRatio ratio={ratio} />
                </div>
            )}
        </div>
    );
};

export default MainImagePosterCard;