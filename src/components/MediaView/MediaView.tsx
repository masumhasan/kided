import React, { useEffect } from 'react';
import { ObjectsIcon } from '../Icons/Icons';
import './MediaView.css';

type MediaViewProps = {
  onCapture: (base64: string, mime: string) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  t: (key: string) => string;
};

const MediaView = ({ onCapture, videoRef, t }: MediaViewProps) => {
  useEffect(() => {
    let stream: MediaStream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error("Camera error:", err));

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [videoRef]);

  const handleCaptureClick = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    const base64Data = dataUrl.split(",")[1];
    onCapture(base64Data, "image/jpeg");
  };

  return (
    <div className="camera-view">
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline muted />
        <div className="camera-overlay">
          <div className="scan-frame"></div>
          <p>{t('media.pointToObject')}</p>
        </div>
      </div>
      <div className="controls-container">
        <button
          className="capture-btn"
          onClick={handleCaptureClick}
          aria-label={t('media.scanButton')}
        >
          <ObjectsIcon />
          <span>{t('media.scanButton')}</span>
        </button>
      </div>
    </div>
  );
};

export default MediaView;
