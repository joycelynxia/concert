import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../config/api';

const ConcertMemoryUploader: React.FC = () => {
  const { experienceId } = useParams(); // Get experience ID from route
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  const handleUpload = async () => {
    if (!experienceId) {
      alert("No experience ID provided.");
      return;
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file); // Multer expects field name 'files'
    });

    try {
      // Upload photos/videos
      const fileRes = await axios.post(`${API_BASE}/api/upload/${experienceId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Save note if present
      if (note.trim()) {
        await axios.post(`${API_BASE}/api/memories`, {
          experienceId,
          type: 'note',
          content: note
        });
      }

      alert('Memories uploaded successfully!');
      setFiles([]);
      setNote('');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed.');
    }
  };

  return (
    <div>
      <h2>Upload Concert Memories</h2>

      <div>
        <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} />
        <div>
          {files.map((file, idx) => (
            <p key={idx}>{file.name}</p>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <textarea
          rows={6}
          cols={50}
          placeholder="Write your concert journal entry here..."
          value={note}
          onChange={handleNoteChange}
        />
      </div>

      <button type="button" className="account-btn account-btn-primary" style={{ marginTop: '1rem' }} onClick={handleUpload}>
        Save Memories
      </button>
    </div>
  );
};

export default ConcertMemoryUploader;
