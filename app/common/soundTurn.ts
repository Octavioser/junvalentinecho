// 사이트에서 소리는 한 번에 하나만 나게 함: 영상의 소리가 켜지면 아래 음악 플레이어를 멈추고, 음악을 틀면 영상의 소리를 끔.
// 서로를 직접 알지 못하는 두 조각(레이아웃의 음악 플레이어, video 화면의 영상)이 창(window)에 신호를 보내서 알림

export const VIDEO_SOUND_ON = 'site:video-sound-on'; // 영상이 소리를 내며 재생되기 시작함
export const MUSIC_PLAY = 'site:music-play';         // 음악 플레이어가 재생을 시작함

export const announce = (name: string) => { window.dispatchEvent(new Event(name)); };
