import { error } from "console";

export const api = async (apiUrl: string) => {
    try {
        const fetchdata = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/${apiUrl}`, {
            method: 'POST', // POST 요청
            headers: {
                'Content-Type': 'application/json', // 요청 타입
            },
        });
        // fetch 실패시 에러 처리
        if (!fetchdata.ok) throw new Error(`HTTP Error: ${fetchdata.status}`);
        // json 형태 변환시 에러 처리
        return await (async () => {
            try {
                return { ok: true, data: await fetchdata.json(), error: null, };
            }
            catch (error: any) {
                throw new Error(`json() Error status: ${fetchdata.status}`);
            }
        })()
    } catch (error: any) {
        console.log(error);
        return {
            ok: false,
            data: null,
            error: error.message || 'error',
        };
    }
}

