import React from 'react';
import './LoadingView.css';

type LoadingViewProps = {
  t: (key: string) => string;
};

export const LoadingView = ({ t }: LoadingViewProps) => (
  <div className="loading-overlay">
    <div className="loader-spinner"></div>
    <h2>{t('loading.thinking')}</h2>
    <p>{t('loading.preparing')}</p>
  </div>
);
