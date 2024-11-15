"use client";

import { MyLivestreamLayout } from "../../layouts/my-stream-layout";
import { CallingState, useCallStateHooks } from "@stream-io/video-react-sdk";
import { VideoIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { LiveStreamPlayerState } from "@/components/livestream-player-state";

export const LocalLivestreamPlayer = () => {
    const { useCallCallingState } = useCallStateHooks();
    const callingState = useCallCallingState();

    switch (callingState) {
        case CallingState.UNKNOWN:
        case CallingState.IDLE:
            return (
                <LiveStreamPlayerState stateMessage="Please wait" isLoading />
            );

        case CallingState.JOINING:
            return (
                <LiveStreamPlayerState
                    stateMessage="Joining Stream"
                    isLoading
                />
            );

        case CallingState.LEFT:
            return <LiveStreamPlayerState stateMessage="Left Stream" />;

        case CallingState.RECONNECTING:
        case CallingState.MIGRATING:
            return (
                <LiveStreamPlayerState
                    stateMessage="Reconnecting stream"
                    isLoading
                />
            );

        case CallingState.RECONNECTING_FAILED:
            return <LiveStreamPlayerState stateMessage="Reconnecting stream" />;

        case CallingState.OFFLINE:
            return <LiveStreamPlayerState stateMessage="User is offline" />;
    }

    return (
        <MyLivestreamLayout
            enableFullScreen={true}
            mirrorLocalParticipantVideo={false}
            showLiveBadge
        />
    );
};
