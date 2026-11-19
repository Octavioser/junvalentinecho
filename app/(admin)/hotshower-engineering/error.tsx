"use client";

// 관리자 화면을 그리다 오류가 났을 때 (예: 저장소에서 그림 목록을 읽지 못함).
// 빈 목록으로 화면을 열면 저장할 때 기존 내용이 덮어써질 수 있어서, 목록을 못 읽으면 화면을 열지 않고 이 안내를 보여 줌
export default function AdminError({ reset }: { error: Error; reset: () => void; }) {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontSize: 14 }}>
            <p>관리자 화면을 불러오지 못했어요. 저장소에서 목록을 읽을 수 없는 상태일 수 있어요.</p>
            <button onClick={reset} style={{ padding: '8px 16px', border: '1px solid #d2d2d7', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>다시 시도</button>
        </div>
    );
}
