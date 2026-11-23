"use client";
import React from "react";
import { Artwork } from "@/types";
import { useRouter } from "next/navigation";
import { updateAllArtwork } from "@/common/comon";
import { addToWall } from "@/common/order";
import { snackbar } from "@/components/Snackbar/Snackbar";
import ArtPicker from "./ArtPicker";

// 3D 전시장에 그림 추가: 아직 3D에 걸지 않은 그림 중에서 골라(여러 개를 고른 순서대로) 맨 뒤에 검
const WallAdd = ({ artworks, setOpenDialog, setIsLoading }:
    { artworks: Artwork[], setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; }) => {

    const router = useRouter();

    return (
        <ArtPicker
            hint="3D 전시장 벽에 걸 그림을 걸 순서대로 누르세요. 여러 개를 한 번에 고를 수 있고, 번호 순서대로 맨 뒤에 걸려요. 순서는 나중에 목록에서 끌어서 바꿀 수 있어요."
            candidates={artworks.filter(({ wallOrder }) => wallOrder == null)}
            emptyText="모든 그림이 이미 3D 전시장에 걸려 있어요."
            confirmLabel="추가"
            onCancel={() => setOpenDialog(null)}
            onPick={async (ids) => {
                setIsLoading(true);
                try {
                    await updateAllArtwork(addToWall(artworks, ids));
                    setOpenDialog(null);
                    snackbar.success('3D 전시장에 추가되었습니다.');
                    router.refresh(); // 페이지 새로고침
                } catch (error) {
                    console.log(error);
                    snackbar.error('저장에 실패했습니다.');
                } finally {
                    setIsLoading(false);
                }
            }}
        />
    );
};
export default WallAdd;
