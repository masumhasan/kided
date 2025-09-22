import React from 'react';
import { Language } from '../../lib/types';
import './LanguageSelector.css';

type LanguageSelectorProps = {
  onSelect: (lang: Language) => void;
  onClose: () => void;
  t: (key: string) => string;
};

export const LanguageSelector = ({ onSelect, onClose, t }: LanguageSelectorProps) => (
    <div className="language-selector-overlay" onClick={onClose}>
        <div className="language-selector-card" onClick={(e) => e.stopPropagation()}>
            <h3>{t('langSelect.title')}</h3>
            <button onClick={() => { onSelect('en'); onClose(); }}>{t('langSelect.english')}</button>
            <button onClick={() => { onSelect('bn'); onClose(); }}>{t('langSelect.bangla')}</button>
        </div>
    </div>
);
