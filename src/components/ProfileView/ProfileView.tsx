import React, { useState, useEffect } from 'react';
import { UserProfile, FamilyMember } from '../../lib/types';
import { ProfileIcon } from '../Icons/Icons';
import { CardControls } from '../CardControls/CardControls';
import './ProfileView.css';

type ProfileViewProps = {
    profile: UserProfile | null;
    // FIX: Updated onSave prop type to align with App.tsx's handleSaveProfile, which doesn't expect uid or activityLog.
    onSave: (profileData: Omit<UserProfile, 'uid' | 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'activityLog'>) => void;
    onClearData: () => void;
    onMinimize: () => void;
    onClose: () => void;
    t: (key: string) => string;
};

const ProfileView = ({ profile, onSave, onClearData, onMinimize, onClose, t }: ProfileViewProps) => {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [isEditing, setIsEditing] = useState(!profile);

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setDob(profile.dob);
            setFamilyMembers(profile.familyMembers);
            setIsEditing(false);
        } else {
            setIsEditing(true);
        }
    }, [profile]);

    const handleAddFamilyMember = () => {
        setFamilyMembers([...familyMembers, { id: Date.now().toString(), name: '', relationship: '' }]);
    };

    const handleRemoveFamilyMember = (id: string) => {
        setFamilyMembers(familyMembers.filter(member => member.id !== id));
    };

    const handleFamilyMemberChange = (id: string, field: 'name' | 'relationship', value: string) => {
        setFamilyMembers(familyMembers.map(member => 
            member.id === id ? { ...member, [field]: value } : member
        ));
    };
    
    const handleSubmit = () => {
        if (!name.trim() || !dob) {
            alert("Please fill in the name and date of birth.");
            return;
        }
        onSave({ name, dob, familyMembers: familyMembers.filter(m => m.name.trim() && m.relationship.trim()) });
        setIsEditing(false);
    };

    const handleClearClick = () => {
        if (window.confirm(t('profile.clearDataConfirmation'))) {
            onClearData();
        }
    };

    if (!isEditing && profile) {
        // Display View
        return (
             <div className="profile-view">
                 <div className="card">
                    <CardControls onMinimize={onMinimize} onClose={onClose} />
                    <ProfileIcon />
                    <h2>{profile.name}</h2>
                    <p>Birthday: {new Date(profile.dob + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    {profile.familyMembers && profile.familyMembers.length > 0 && (
                        <>
                            <h3>{t('profile.familyTitle')}</h3>
                            <ul>
                                {profile.familyMembers.map(member => (
                                    <li key={member.id}>{member.name} ({member.relationship})</li>
                                ))}
                            </ul>
                        </>
                    )}
                    <button className="btn" onClick={() => setIsEditing(true)}>{t('profile.editButton')}</button>

                    <div className="danger-zone">
                        <h3>{t('profile.dangerZone')}</h3>
                        <p>{t('profile.clearDataWarning')}</p>
                        <button className="btn btn-danger" onClick={handleClearClick}>{t('profile.clearData')}</button>
                    </div>
                </div>
            </div>
        );
    }

    // Onboarding / Editing Form
    return (
        <div className="profile-view">
            <div className="card">
                <CardControls onMinimize={onMinimize} onClose={onClose} />
                <h2>{profile ? t('profile.title') : t('profile.onboardingTitle')}</h2>
                {!profile && <p>{t('profile.onboardingPrompt')}</p>}
                
                <div className="profile-form-group">
                    <label htmlFor="name">{t('profile.nameLabel')}</label>
                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('profile.namePlaceholder')} />
                </div>
                <div className="profile-form-group">
                    <label htmlFor="dob">{t('profile.dobLabel')}</label>
                    <input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                
                <div className="divider"><span>{t('profile.familyTitle')}</span></div>
                
                <p>{t('profile.familyPrompt')}</p>

                <div className="family-members-list">
                    {familyMembers.map(member => (
                        <div key={member.id} className="family-member-item">
                            <input type="text" value={member.name} onChange={e => handleFamilyMemberChange(member.id, 'name', e.target.value)} placeholder={t('profile.memberNamePlaceholder')} />
                            <input type="text" value={member.relationship} onChange={e => handleFamilyMemberChange(member.id, 'relationship', e.target.value)} placeholder={t('profile.memberRelationPlaceholder')} />
                            <button onClick={() => handleRemoveFamilyMember(member.id)} className="remove-family-btn" aria-label="Remove family member">&times;</button>
                        </div>
                    ))}
                </div>
                <button className="btn btn-secondary" onClick={handleAddFamilyMember} style={{width: '100%', marginTop: '0.5rem'}}>{t('profile.addFamilyButton')}</button>

                <button className="btn" onClick={handleSubmit} style={{marginTop: '2rem'}}>{t('profile.saveButton')}</button>
            </div>
        </div>
    );
};

export default ProfileView;
