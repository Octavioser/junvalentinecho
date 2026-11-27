export const metadata = { title: 'cv/bio' };

const Info = () =>
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: 'translateY(-10%)'
        }}>
            {/* 새 탭으로 열어서 이 탭의 노래는 계속 나오게 */}
            <a href="https://www.instagram.com/hotshower22/" target="_blank" rel="noopener noreferrer">
                <span style={{ textDecoration: 'underline' }}>Instagram</span>
            </a>
        </div>
        {/* 저작권 문구: 화면 아래 가운데, 플레이어 바로 위에 붙임. 글씨는 사이트의 다른 글씨와 같은 모양에 크기만 9px.
            연도는 화면을 그리는 때의 해가 들어가서, 해가 바뀌면 저절로 바뀜 */}
        <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 'var(--player-height)',
            padding: '0 calc(var(--sp) * 2)',
            textAlign: 'center',
            pointerEvents: 'none'
        }}>
            <span style={{ fontSize: 9 }}>© {new Date().getFullYear()} Joonhyeok Daniel Cho. All rights reserved.</span>
        </div>
    </div>;

export default Info;
