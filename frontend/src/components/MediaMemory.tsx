import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ConcertMemory } from 'types/types';
import { API_BASE } from '../config/api';

interface MediaMemoryProps {
    memory: ConcertMemory;
    onDelete: (id: string) => void;
}

const MediaMemory: React.FC<MediaMemoryProps> = ({ memory, onDelete}) => {
    const src = memory.content.startsWith('http') || memory.content.startsWith('data:')
        ? memory.content
        : `${API_BASE}${memory.content}`;

    return (
        <div className='mb-4'>
            {memory.type === 'photo' ? (
                <img src={src} alt="Concert memory" width="200" loading="lazy" />
            ) : (
                <video controls width="300" preload="metadata">
                    <source src={src} type={memory.mimeType || 'video/mp4'} />
                    Your browser does not support the video tag.
                </video>
            )}
            <button
                type="button"
                className="account-btn account-btn-danger account-btn-sm mt-2"
                onClick={() => onDelete(memory._id)}
            >
                delete
            </button>
        </div>
    );
}

export default MediaMemory;