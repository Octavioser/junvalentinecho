import { Fragment, useState, useEffect, useRef, use } from "react";
import { MusicBlob } from '@/types';
import styles from './Player.module.css';


const Player = ({ musicList }: { musicList: MusicBlob[]; }) => {

    const {
        mediaPlayerConTainer,
        playerButtonGroup,
        controlButton,
        inventoryButton,
        prevButton,
        nextButton,
        dropDownUp,
        playButton,
        buttonIcon,
        nextIcon,
        mediaName,
        mediaNameText,
        equalizerContainer,
        canvasStyle
    } = styles;

    const [isPlaying, setIsPlaying] = useState(false);
    const [playUrl, setPlayUrl] = useState(musicList[0]?.url || '');

    const isFirst = useRef(true);

    const [isDropDownOpen, setIsDropDwownOpen] = useState(false);

    const mediaSourceCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const lastTsRef = useRef<number>(0);

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

        analyser.fftSize = 2048; // 해상도 높임 (촘촘한 파형)
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
    useEffect(() => {                                   // 컴포넌트가 마운트/의존성 변경될 때 실행
        const canvas = canvasRef.current;           // 캔버스 DOM 참조 가져오기
        const analyser = analyserRef.current;       // WebAudio AnalyserNode 참조 가져오기
        if (!canvas || !analyser) return;           // 둘 중 하나라도 없으면 아무 것도 안 함

        const ctx = canvas.getContext("2d")!;       // 2D 그리기 컨텍스트 얻기
        const bufferLength = analyser.frequencyBinCount; // 타임도메인 샘플 개수(보통 FFT/2)
        const dataArray = new Uint8Array(bufferLength);  // 오디오 샘플을 담을 바이트 배열



        // DPR 반영 리사이즈
        const resize = () => {                      // 디바이스 픽셀 비율에 맞게 캔버스 리사이즈
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));  // 실제 픽셀 너비
            canvas.height = Math.max(1, Math.floor(rect.height * dpr)); // 실제 픽셀 높이
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // 좌표계를 CSS 픽셀 기준으로 변환
        };
        resize();                                   // 최초 1회 리사이즈 적용
        window.addEventListener('resize', resize);  // 창 크기 변경 시에도 리사이즈

        // 프레임 제한(ms)
        const FRAME_MS = 15;    // 더 부드럽고 빠른 갱신

        const draw = (ts: number) => {
            rafIdRef.current = requestAnimationFrame(draw);

            // 프레임 스로틀
            if (ts - lastTsRef.current < FRAME_MS) return;
            lastTsRef.current = ts;

            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            if (!isPlaying) {
                ctx.beginPath();
                ctx.strokeStyle = '#000'; // 대기 상태 검정
                ctx.lineWidth = 1;
                ctx.moveTo(0, rect.height / 2);
                ctx.lineTo(rect.width, rect.height / 2);
                ctx.stroke();
                return;
            }

            // 🎵 Time Domain Data (파형) 가져오기
            analyser.getByteTimeDomainData(dataArray);

            const sliceWidth = rect.width / bufferLength;
            let x = 0;

            ctx.fillStyle = '#000000'; // 빡센 검정

            const cY = rect.height / 2; // 중앙선

            for (let i = 0; i < bufferLength; i++) {
                // 128이 0(무음). 0~255 범위.
                // 128과의 차이(진폭)를 계산
                const amplitude = Math.abs(dataArray[i] - 128);

                // 증폭 (강렬하게)
                const height = (amplitude / 128) * rect.height * 2.0;

                // 중앙에서 위아래로 뻗는 선 그리기 (대칭)
                // x, y, w, h
                // y는 시작점. 중앙에서 height/2 만큼 올라간 곳
                ctx.fillRect(x, cY - height / 2, Math.max(1, sliceWidth), height);

                x += sliceWidth;
            }
        };

        rafIdRef.current = requestAnimationFrame(draw);   // 애니메이션 루프 시작

        return () => {                                    // 클린업
            if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current); // RAF 취소
            window.removeEventListener('resize', resize);  // 리스너 제거
        };
    }, [isPlaying]);                                      // 재생 여부 바뀔 때 이 이펙트 재실


    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        audioRef.current && audioRef.current.play();
    }, [playUrl]);

    return <Fragment>

        <div className={mediaPlayerConTainer} >
            <div className={playerButtonGroup}>
                <div style={{ position: 'relative' }}>
                    <button className={`${controlButton} ${inventoryButton}`}
                        onClick={() => {
                            setIsDropDwownOpen(true);
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={buttonIcon}
                        >
                            <path d="M4 6h16" />
                            <path d="M4 12h16" />
                            <path d="M4 18h10" />
                        </svg>
                    </button>
                    {isDropDownOpen && (
                        <ul className={dropDownUp}>
                            {musicList.map((item) =>
                                <li key={item.id} onClick={async () => {
                                    setIsDropDwownOpen(false);
                                    setPlayUrl(item.url);
                                }}>{item.title}</li>
                            )}
                        </ul>
                    )}
                </div>

                <button className={`${controlButton} ${prevButton}`}
                    onClick={() => {
                        const targetIndex = musicList.findIndex(({ url }) => url === playUrl);
                        setPlayUrl(targetIndex === 0 ? musicList[musicList.length - 1].url : musicList[targetIndex - 1].url);
                    }}
                >
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

                <button className={`${controlButton} ${nextButton}`}
                    onClick={() => {
                        const targetIndex = musicList.findIndex(({ url }) => url === playUrl);
                        setPlayUrl(targetIndex === musicList.length - 1 ? musicList[0].url : musicList[targetIndex + 1].url);
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className={`${buttonIcon} ${nextIcon}`}>
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                </button>
            </div>
            <div className={mediaName}>
                {isPlaying ?
                    <div className={mediaNameText}>
                        <span className={mediaNameText}>{`${(playUrl || '').split('/').slice(-1)[0].split('.').slice(0, -1).join('.')}`}</span>
                    </div>
                    :
                    <span>{`${(playUrl || '').split('/').slice(-1)[0].split('.').slice(0, -1).join('.')}`}</span>
                }
            </div>
        </div>
        <div className={equalizerContainer}>
            <canvas className={canvasStyle} ref={canvasRef} />
        </div>
        <audio
            ref={audioRef}
            src={playUrl}
            style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
                const targetIndex = musicList.findIndex(({ url }) => url === playUrl);
                setPlayUrl(targetIndex === musicList.length - 1 ? musicList[0].url : musicList[targetIndex + 1].url);
            }}
            crossOrigin='anonymous'
        />
    </Fragment>;
};
export default Player;