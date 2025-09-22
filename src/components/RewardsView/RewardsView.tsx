import React from 'react';
import { UserProgress, DiscoveredObject } from '../../lib/types';
import './RewardsView.css';

type RewardsViewProps = {
  progress: UserProgress;
  stickers: DiscoveredObject[];
  t: (key: string) => string;
};

const RewardsView = ({ stickers, t }: RewardsViewProps) => {
  return (
    <div className="rewards-view">
      <div className="sticker-book-header">
        <h2>{t('rewards.title')}</h2>
        <p>{t('rewards.collected').replace('{count}', String(stickers.length))}</p>
      </div>
      {stickers.length === 0 ? (
        <div className="empty-sticker-book">
          <p>{t('rewards.empty')}</p>
          <p>{t('rewards.emptyPrompt')}</p>
        </div>
      ) : (
        <div className="sticker-grid">
          {stickers.map((sticker, index) => (
            <div className="sticker-item" key={index}>
              <img src={sticker.stickerUrl} alt={sticker.name} />
              <p>{sticker.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RewardsView;
