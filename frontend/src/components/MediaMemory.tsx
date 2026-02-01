import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ConcertMemory } from 'types/types';
import { API_BASE } from '../config/api';

interface MediaMemoryProps {
    memory: ConcertMemory;
    onDelete: (id: string) => void;
}

const MediaMemory: React.FC<MediaMemoryProps> = ({ memory, onDelete}) => {
    const src = memory.content.startsWith('http') ? memory.content : `${API_BASE}${memory.content}`;

    return (
        <div className='mb-4'>
            {memory.type === 'photo' ? (
                <img src={src} alt="Concert memory" width="200" />
            ) : (
                <video controls width="300">
                    <source src={src} type={memory.mimeType || 'video/mp4'} />
                    Your browser does not support the video tag.
                </video>
            )}
            <button 
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => onDelete(memory._id)}
                >
                delete
            </button>
        </div>
    );
}

export default MediaMemory;