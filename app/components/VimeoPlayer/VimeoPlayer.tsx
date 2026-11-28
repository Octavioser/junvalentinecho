"use client";

import Player from "@vimeo/player";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./VimeoPlayer.module.css";
import { MUSIC_PLAY, VIDEO_SOUND_ON, announce } from "@/common/soundTurn";

// Vimeo 영상을, Vimeo의 기본 버튼 대신 직접 그린 버튼(재생·정지, 위치 막대, 시간, 소리 켜기·끄기)으로 보여 줌.
// xip 사이트의 VimeoPlayer와 같은 모양·같은 동작 (거기서 옮겨 옴). 다른 점:
//  - 조작 줄을 영상 위에 겹치지 않고 영상 바로 아래에 둠 (영상 아래쪽에 자막이 들어 있어서 겹치면 서로 가림). 색도 흰색 대신 검정
//  - 이 사이트에는 음악 플레이어가 있어서, 영상 소리와 음악이 같이 나지 않게 서로 알림 (common/soundTurn.ts)
//  - 화면을 떠날 때 Vimeo 연결을 없애지(destroy) 않음: 없애면 영상 칸(iframe)까지 지우는데,
//    개발 모드는 이 준비 과정을 두 번 실행해서 두 번째에는 영상 칸이 없어 영상이 안 나옴. 영상 칸은 화면이 바뀔 때 React가 지움

const EVENTS = ["play", "pause", "volumechange", "timeupdate", "seeked", "loaded"] as const;

const fmtTime = (s: number) => {
    const safe = Number.isFinite(s) && s > 0 ? s : 0;
    const m = Math.floor(safe / 60);
    const sec = Math.floor(safe % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
};

const VimeoPlayer = ({ videoId, title = "video", className }: { videoId: string | number; title?: string; className?: string; }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<Player | null>(null);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(true);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (!iframeRef.current) return;
        const player = new Player(iframeRef.current);
        playerRef.current = player;

        // 영상이 소리를 내며 재생 중이면 알림 → 음악 플레이어가 멈춤
        const tellIfAudible = () => {
            void Promise.all([player.getMuted(), player.getPaused()])
                .then(([isMuted, isPaused]) => { if (!isMuted && !isPaused) announce(VIDEO_SOUND_ON); })
                .catch(() => { });
        };

        player.on("play", () => { setPaused(false); tellIfAudible(); });
        player.on("pause", () => setPaused(true));
        player.on("volumechange", () => {
            void player.getMuted().then((isMuted) => { setMuted(isMuted); tellIfAudible(); });
        });
        player.on("timeupdate", (e) => {
            setCurrentTime(e.seconds);
            setDuration(e.duration);
        });
        // 멈춰 둔 채로 위치를 옮기면 timeupdate가 오지 않아서, 옮긴 직후의 시간을 따로 받아 표시함
        player.on("seeked", (e) => setCurrentTime(e.seconds));
        player.on("loaded", () => {
            void player.getDuration().then(setDuration);
            // 소리 켜기를 한 번 시도 — PC는 보통 되고, 모바일은 브라우저가 막음.
            // 막혀도 실제 상태(꺼짐)를 다시 읽어 오므로 버튼 표시는 맞게 나옴. 그때는 방문자가 "Sound: Off"를 눌러 켬
            void player
                .setMuted(false)
                .then(() => player.getMuted())
                .then((isMuted) => { setMuted(isMuted); tellIfAudible(); })
                .catch(() => { });
        });

        // 음악을 틀면 영상의 소리를 끔
        const onMusic = () => { void player.setMuted(true).catch(() => { }); };
        window.addEventListener(MUSIC_PLAY, onMusic);

        return () => {
            window.removeEventListener(MUSIC_PLAY, onMusic);
            EVENTS.forEach((name) => player.off(name));
            playerRef.current = null;
        };
    }, [videoId]);

    const togglePlay = useCallback(() => {
        const p = playerRef.current;
        if (!p) return;
        void (paused ? p.play() : p.pause()).catch(() => { });
    }, [paused]);

    const toggleMute = useCallback(() => {
        const p = playerRef.current;
        if (!p) return;
        void p.setMuted(!muted).catch(() => { });
    }, [muted]);

    const onSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const p = playerRef.current;
        if (!p || duration <= 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        void p.setCurrentTime(pct * duration).catch(() => { });
    }, [duration]);

    // 전체화면으로 보기. 전체화면에서는 아래 조작 줄이 보이지 않으므로 나올 때는 Esc 키(휴대폰은 기기의 뒤로 가기·닫기)
    const enterFullscreen = useCallback(() => {
        const p = playerRef.current;
        if (!p) return;
        void p.requestFullscreen().catch(() => { });
    }, []);

    // muted=1: 소리를 끈 영상만 저절로 재생할 수 있어서 (브라우저 규칙). 뜬 다음 위에서 소리 켜기를 시도함.
    // controls=0: Vimeo의 기본 버튼을 숨김 (아래에 직접 그린 버튼을 씀). dnt=1: 방문자를 추적하지 않게
    const src = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&autopause=0&controls=0&playsinline=1&dnt=1`;

    const fillPct = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`${styles.wrap} ${className ?? ""}`}>
            {/* 영상 칸 (16:9) */}
            <div className={styles.frame}>
                <iframe
                    ref={iframeRef}
                    className={styles.iframe}
                    src={src}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    title={title}
                />
            </div>
            {/* 조작 줄: 영상 바로 아래 (영상 위에 겹치지 않음) */}
            <div className={styles.controls}>
                <button type="button" className={styles.iconBtn} onClick={togglePlay} aria-label={paused ? "play" : "pause"}>
                    {paused ? (
                        <svg viewBox="0 0 32 32" aria-hidden="true">
                            <path
                                d="M10.6667 6.6548C10.6667 6.10764 11.2894 5.79346 11.7295 6.11862L24.377 15.4634C24.7377 15.7298 24.7377 16.2692 24.3771 16.5357L11.7295 25.8813C11.2895 26.2065 10.6667 25.8923 10.6667 25.3451L10.6667 6.6548Z"
                                fill="currentColor"
                            />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 32 32" aria-hidden="true">
                            <path
                                d="M8.66667 6.66667C8.29848 6.66667 8 6.96514 8 7.33333V24.6667C8 25.0349 8.29848 25.3333 8.66667 25.3333H12.6667C13.0349 25.3333 13.3333 25.0349 13.3333 24.6667V7.33333C13.3333 6.96514 13.0349 6.66667 12.6667 6.66667H8.66667Z"
                                fill="currentColor"
                            />
                            <path
                                d="M19.3333 6.66667C18.9651 6.66667 18.6667 6.96514 18.6667 7.33333V24.6667C18.6667 25.0349 18.9651 25.3333 19.3333 25.3333H23.3333C23.7015 25.3333 24 25.0349 24 24.6667V7.33333C24 6.96514 23.7015 6.66667 23.3333 6.66667H19.3333Z"
                                fill="currentColor"
                            />
                        </svg>
                    )}
                </button>

                <div
                    className={styles.slider}
                    onClick={onSeek}
                    role="slider"
                    aria-label="seek"
                    aria-valuemin={0}
                    aria-valuemax={duration || 0}
                    aria-valuenow={currentTime}
                    tabIndex={0}
                >
                    <div className={styles.track} />
                    <div className={styles.thumb} style={{ left: `${fillPct}%` }} />
                </div>

                <span className={styles.time}>{fmtTime(currentTime)}</span>

                <button type="button" className={styles.soundBtn} onClick={toggleMute} aria-label={muted ? "unmute" : "mute"}>
                    <span className={styles.soundLabel}>Sound:</span>
                    <span className={styles.soundState}>{muted ? "Off" : "On"}</span>
                </button>

                {/* 전체화면 버튼: 조작 줄의 오른쪽 끝 (영상 오른쪽 끝 아래) */}
                <button type="button" className={`${styles.iconBtn} ${styles.fullBtn}`} onClick={enterFullscreen} aria-label="fullscreen">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M6 12V6h6M20 6h6v6M26 20v6h-6M12 26H6v-6" fill="none" stroke="currentColor" strokeWidth="2.67" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default VimeoPlayer;
