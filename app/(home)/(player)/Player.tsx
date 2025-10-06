import styles from './Player.module.css';
import { Fragment, useState, useEffect, useRef } from "react";

const Player = () => {

    const {
        mediaPlayer,
        controlButton,
        inventoryButton,
        prevButton,
        nextButton,
        playButton,
        buttonIcon,
        nextIcon,
        equalizerContainer
    } = styles;

    const [isPlaying, setIsPlaying] = useState(false);

    const mediaSourceCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafIdRef = useRef<number | null>(null);


    useEffect(() => {
        const audioEl = audioRef.current;
        if (!audioEl) return;

        // AudioContext 재사용
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioCtx = audioCtxRef.current;

        // 🔒 SourceNode: 전역 캐시로 1회 생성/재사용
        let source = mediaSourceCache.get(audioEl);
        if (!source) {
            source = audioCtx.createMediaElementSource(audioEl);
            mediaSourceCache.set(audioEl, source);
        }

        // 이 컴포넌트 전용 AnalyserNode는 새로 만들고 연결
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyserRef.current = analyser;

        return () => {
            // 🔧 StrictMode 재마운트 대비: 이 컴포넌트가 만든 연결만 해제
            try { analyser.disconnect(); } catch { }
            analyserRef.current = null;
            // ⚠️ source는 캐시에 그대로 둡니다(다음 마운트에서 재사용).
        };
    }, []);

    // 2) 캔버스 드로잉 루프 (isPlaying에 반응)
    useEffect(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext("2d")!;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // DPR 반영 리사이즈
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = () => {
            rafIdRef.current = requestAnimationFrame(draw);

            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            if (!isPlaying) {
                ctx.strokeStyle = '#000';
                ctx.beginPath();
                ctx.moveTo(0, rect.height / 2);
                ctx.lineTo(rect.width, rect.height / 2);
                ctx.stroke();
                return;
            }

            analyser.getByteTimeDomainData(dataArray);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000';
            ctx.beginPath();

            const sliceWidth = rect.width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0; // 0~2
                const y = (v * rect.height) / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.lineTo(rect.width, rect.height / 2);
            ctx.stroke();
        };

        draw();

        return () => {
            if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [isPlaying]);


    return <Fragment>

        <div className={mediaPlayer} >
            <button className={`${controlButton} ${inventoryButton}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={buttonIcon}>
                    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
                </svg>
            </button>

            <button className={`${controlButton} ${prevButton}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={buttonIcon}>
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
            </button>

            <button className={`${controlButton} ${playButton}`}
                onClick={async () => {
                    if (!audioCtxRef.current) {
                        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                    }
                    if (audioCtxRef.current.state === 'suspended') {
                        await audioCtxRef.current.resume();
                    }

                    const el = audioRef.current;
                    if (!el) return;

                    if (el.paused) {
                        try { await el.play(); } catch (e) { console.error("재생 실패:", e); }
                    } else {
                        el.pause();
                    }
                }}>
                {isPlaying ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={buttonIcon}>
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={buttonIcon}>
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            <button className={`${controlButton} ${nextButton}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className={`${buttonIcon} ${nextIcon}`}>
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
            </button>
        </div >
        <div className={equalizerContainer}>
            <canvas
                ref={canvasRef}
                width={'250px'}
                height={'80%'}
            />
        </div>
        <audio
            ref={audioRef}
            src="https://uwkvvru2scgcmnbh.public.blob.vercel-storage.com/music/hyper.wav"
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            crossOrigin='anonymous'
        />
    </Fragment>;
};
export default Player;