"use client";
import dynamic from "next/dynamic";
import { Component, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useArtworks } from "@/providers/ArtworksProvider";
import MainImgDialog from "@/(home)/(mainImgDailog)/MainImgDialog";
import styles from "./gallery3d.module.css";
import { wallLayout } from "./wallLayout";
import { createMoveInput } from "./scene/input";

const Loading = () => <div className={styles.message}><span>...Loading</span></div>;

// three.js는 /3d에서만 불러옴
const Scene = dynamic(() => import("./scene/Scene"), { ssr: false, loading: Loading });

// WebGL을 못 쓰는 기기 등에서 페이지 전체가 깨지지 않게
class SceneBoundary extends Component<{ children: ReactNode; }, { failed: boolean; }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        return this.state.failed
            ? <div className={styles.message}><span>3D view is not available on this device</span></div>
            : this.props.children;
    }
}

const KEY_DIRECTION: Record<string, 1 | -1> = { KeyW: 1, ArrowUp: 1, KeyS: -1, ArrowDown: -1 };

// 이동은 휠(PC)·세로 스와이프(모바일)로, CameraRig에서 처리. 여기서는 키보드와 상세창만 다룸
const Gallery3D = () => {

    const { artworks } = useArtworks();
    const { items, farZ } = useMemo(() => wallLayout(artworks), [artworks]);
    const [dialogImageId, setDialogImageId] = useState<string | null>(null);
    const input = useRef(createMoveInput());
    const dialogOpen = useRef(false);

    const press = useCallback((id: string, dir: 1 | -1) => {
        if (dialogOpen.current) return;
        input.current.held.set(id, dir);
        input.current.wake();
    }, []);
    const release = useCallback((id: string) => { input.current.held.delete(id); }, []);

    // 상세창이 열리면 이동 멈춤
    useEffect(() => {
        dialogOpen.current = !!dialogImageId;
        if (dialogImageId) input.current.held.clear();
    }, [dialogImageId]);

    // 키보드: e.code 기준이라 한글 입력 상태(ㅈ/ㄴ)에서도 W/S가 동작
    useEffect(() => {
        const keyDown = (e: KeyboardEvent) => {
            if (e.code === 'Escape') { setDialogImageId(null); return; }
            const dir = KEY_DIRECTION[e.code];
            if (!dir || e.ctrlKey || e.metaKey || e.altKey || dialogOpen.current) return;
            e.preventDefault();
            if (!e.repeat) press(e.code, dir);
        };
        const keyUp = (e: KeyboardEvent) => { if (KEY_DIRECTION[e.code]) release(e.code); };
        const stopAll = () => input.current.held.clear();
        const visibility = () => { if (document.hidden) stopAll(); };

        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
        window.addEventListener('blur', stopAll);
        window.addEventListener('pagehide', stopAll);
        document.addEventListener('visibilitychange', visibility);
        return () => {
            window.removeEventListener('keydown', keyDown);
            window.removeEventListener('keyup', keyUp);
            window.removeEventListener('blur', stopAll);
            window.removeEventListener('pagehide', stopAll);
            document.removeEventListener('visibilitychange', visibility);
            stopAll();
        };
    }, [press, release]);

    const onSelect = useCallback((id: string) => setDialogImageId(id), []);
    const target = dialogImageId ? artworks.find(item => item.id === dialogImageId) : undefined;

    return (
        <div className={styles.container} onContextMenu={e => e.preventDefault()}>
            <SceneBoundary>
                <Scene items={items} farZ={farZ} input={input} onSelect={onSelect} />
            </SceneBoundary>
            <div className={styles.vignette} />
            {target && <MainImgDialog targetImg={target} dialogClose={() => { setDialogImageId(null); }} />}
        </div>
    );
};

export default Gallery3D;
