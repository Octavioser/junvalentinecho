import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MusicBlob } from "@/types";
import { upload } from '@vercel/blob/client';
import { snackbar } from "@/components/Snackbar/Snackbar";

const MusicAdd = ({ musicList, setOpenDialog, setIsLoading }:
    { musicList: MusicBlob[], setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; }) => {

    const [inputFile, setInputFile] = useState<File | null>(null);

    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (
            musicList.some(({ title }) => title.trim() === file.name.trim())
        ) {
            snackbar.error('동일한 제목의 음악이 존재합니다.');
            return;
        }

        setInputFile(file);
    };


    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '99.9%', height: '95%', gap: '10%' }}>
            <label>
                음악 첨부: &nbsp;
                <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleImageChange} />
            </label>
            <button
                style={{ marginTop: '1rem', width: '30%' }}
                onClick={async () => {
                    setIsLoading(true);
                    // 용량이커서 안됨 
                    // await putMusic(inputFile);
                    try {


                        if (!inputFile) {
                            snackbar.error('파일을 먼저 선택하세요.');
                            return;
                        }

                        const blob = await upload(`music/${inputFile.name}`, inputFile, {
                            access: 'public',
                            handleUploadUrl: '/api/music/upload-token',   // 서버 토큰 발급 라우트
                            multipart: true,                      // 큰 파일이면 권장
                            clientPayload: JSON.stringify({ kind: 'music' }),
                        });
                        if (!blob?.url) throw new Error('Upload succeeded but no URL returned');

                        setOpenDialog(null);
                        snackbar.success('음악이 추가되었습니다.');
                        router.refresh(); // 페이지 새로고침
                    } catch (error) {
                        console.log(error);
                        snackbar.error('저장에 실패했습니다.');
                    } finally {
                        setIsLoading(false);
                    }

                }}>
                저장
            </button>
        </div>
    );

};
export default MusicAdd;