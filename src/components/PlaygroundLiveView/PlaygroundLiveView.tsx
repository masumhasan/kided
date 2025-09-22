import React, { useEffect } from 'react';
import './PlaygroundLiveView.css';

type PlaygroundLiveViewProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  narrationText: string;
  onVideoReady: () => void;
  t: (key: string) => string;
};

const PlaygroundLiveView = ({ videoRef, narrationText, onVideoReady, t }: PlaygroundLiveViewProps) => {
  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onplaying = () => {
                onVideoReady();
            };
        }
      })
      .catch((err) => console.error("Camera error:", err));

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [videoRef, onVideoReady]);

  return (
    <div className="playground-live-view">
        <video ref={videoRef} autoPlay playsInline muted />
        <div className="playground-narration-overlay">
            {narrationText}
        </div>
    </div>
  );
};

export default PlaygroundLiveView;
