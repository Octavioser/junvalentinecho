"use client";
import styles from "./MainImage.module.css";
import { TransformWrapper, TransformComponent, useTransformEffect } from "react-zoom-pan-pinch";
import { useState, useEffect, useRef, Fragment } from "react";
import MainImageRatio from "./MainImageRatio";

const RatioUpdater = ({ setRatio, contentRef }: { setRatio: (r: number) => void; contentRef: React.RefObject<HTMLDivElement>; }) => {
    useTransformEffect(({ state }) => {
        setRatio(Math.round(state.scale * 100));
        if (contentRef.current) {
            contentRef.current.style.setProperty('--inverse-scale', `${1 / state.scale}`);
        }
    });
    return null;
};

const MainImagePosterCard = ({ children, onMouseMove, onMouseUp, onMouseLeave, initialScale = 1, alwaysShowRatio = false, isAdmin = false }: {
    children: React.ReactNode;
    onMouseMove?: ((e: React.MouseEvent<HTMLDivElement>) => void) | null | undefined;
    onMouseUp?: (() => void) | null | undefined;
    onMouseLeave?: (() => void) | null | undefined;
    isAdmin?: boolean;
    initialScale?: number;
    alwaysShowRatio?: boolean;
}) => {

    const { posterCard } = styles;
    const [ratio, setRatio] = useState(Math.round(initialScale * 100));
    const contentRef = useRef<HTMLDivElement>(null!);

    useEffect(() => {
        setRatio(Math.round(initialScale * 100));
    }, [initialScale]);

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
                    initialScale={initialScale}
                    minScale={0.5}
                    maxScale={5}
                    wheel={{ activationKeys: ['Control'] }}
                >
                    <>
                        <RatioUpdater setRatio={setRatio} contentRef={contentRef} />
                        <TransformComponent
                            wrapperStyle={{ width: '100%', height: '100%' }}
                            contentStyle={{ width: '100%', height: '100%' }}
                        >
                            <div
                                ref={contentRef}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    '--inverse-scale': 1 / (initialScale || 1)
                                } as React.CSSProperties}
                            >
                                {children}
                            </div>
                        </TransformComponent>
                    </>
                </TransformWrapper>
            )}
            {(ratio !== 100 || alwaysShowRatio) && (
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 10, pointerEvents: 'none' }}>
                    <MainImageRatio ratio={ratio} />
                </div>
            )}
        </div>
    );
};

export default MainImagePosterCard;