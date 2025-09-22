import React from 'react';
import { CloseIcon, MinimizeIcon } from '../Icons/Icons';
import './CardControls.css';

type CardControlsProps = {
  onMinimize: () => void;
  onClose: () => void;
};

export const CardControls = ({ onMinimize, onClose }: CardControlsProps) => {
  return (
    <div className="card-controls">
      <button className="card-control-btn" onClick={onMinimize} aria-label="Minimize to Home">
        <MinimizeIcon />
      </button>
      <button className="card-control-btn" onClick={onClose} aria-label="Close feature">
        <CloseIcon />
      </button>
    </div>
  );
};
