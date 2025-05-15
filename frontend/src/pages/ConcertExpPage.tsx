import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ConcertDetails, ConcertMemory } from 'types/types';

const ConcertExpPage: React.FC = () => {
  const { id } = useParams();
  const [uploads, setUploads] = useState<File[]>([]);
  const [journalEntry, setJournalEntry] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingMemories, setExistingMemories] = useState<ConcertMemory[]>([]);
  const [concertDetails, setConcertDetails] = useState<ConcertDetails>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [addingMemory, setAddingMemory] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!id) return;
  
    fetch(`http://localhost:4000/api/upload/get/${id}`)
      .then(res => res.json())
      .then(data => {
        // Make sure the response is always an array
        if (Array.isArray(data)) {
          setExistingMemories(data);
        } else {
          console.error('Unexpected response format:', data);
          setExistingMemories([]); // fallback
        }
      })
      .catch(err => {
        console.error('Failed to load memories', err);
        setExistingMemories([]); // fallback on error
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
  
    // Fetch concert ticket data for this experience
    fetch(`http://localhost:4000/api/concerts/ticket/${id}`)
      .then(res => res.json())
      .then(data => setConcertDetails(data))
      .catch(err => console.error('Failed to fetch concert info', err));
  }, [id]);
  
  const handleCancelMemory = () => {
    setAddingMemory(false);
    setUploads([]);
    setJournalEntry('');
  };  
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setUploads(Array.from(e.target.files));
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    if (!id) return alert("Missing experience ID");

    const formData = new FormData();
    uploads.forEach((file) => formData.append('files', file));
    formData.append('note', journalEntry);

    setLoading(true);

    try {
      const res = await fetch(`http://localhost:4000/api/upload/${id}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      alert('Memories saved successfully!');
      setUploads([]);
      setJournalEntry('');
      setExistingMemories((prev) => [...data.memories, ...prev])
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memoryID: string) => {
    console.log('deleting memory', memoryID)
    if (!memoryID) return;

    const confirmed = window.confirm('are you sure you wanna delete?');
    console.log('confirmed', confirmed)
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:4000/api/upload/${id}/${memoryID}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('failed to delete memory')
      console.log('Deleting memory:', memoryID);
      console.log('Current memories:', existingMemories.map(m => m._id));

      setExistingMemories((prev) => prev.filter((m) => m._id !== memoryID));
    } catch (err) {
      alert('error deleting memory');
      console.error(err);
    }
  }

  const startEditing = (memoryId: string, currentContent: string) => {
    setEditingId(memoryId);
    setEditedContent(currentContent);
  };
  
  const saveEdit = async () => {
    if (!editingId) return;
  
    try {
      const res = await fetch(`http://localhost:4000/api/upload/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
  
      if (!res.ok) throw new Error('Failed to update memory');
  
      // Update local state
      setExistingMemories((prev) =>
        prev.map((mem) =>
          mem._id === editingId ? { ...mem, content: editedContent } : mem
        )
      );
  
      setEditingId(null);
      setEditedContent('');
    } catch (err) {
      alert('Error saving edit');
      console.error(err);
    }
  };

  return (
    <div>
    <h1>{concertDetails?.artist}: {concertDetails?.tour}</h1>
      {/* <p>Concert ID: {id}</p> */}
      <button
        onClick={() => setAddingMemory((prev) => !prev)}
        className="mt-4 mb-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded"
      >
        {addingMemory ? 'Cancel' : 'Add Memory'}
      </button>

      {addingMemory && (
        <>
        <h2>Upload Photos or Videos</h2>
        <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} />
        {previewUrl && <img src={previewUrl} alt='preview'/>}
        
        <ul>
          {uploads.map((file, idx) => (
            <li key={idx}>{file.name}</li>
          ))}
        </ul>

      <div>
        <h2>Write About Your Experience</h2>
    <textarea
          placeholder="Type your concert journal entry here..."
          rows={10}
          cols={50}
      value={journalEntry}
      onChange={(e) => setJournalEntry(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button onClick={handleSave} disabled={loading} className="bg-green-500 text-white px-4 py-2 rounded">
          {loading ? 'Saving...' : 'Save Memories'}
      </button>
        <button onClick={handleCancelMemory} className="bg-gray-400 text-white px-4 py-2 rounded">
        Cancel
      </button>
    </div>


        </>
        
      )}

      <div>
      <h2>𐙚 ‧₊˚  memories ִ ࣪𖤐⋆ </h2>
    {existingMemories.length === 0 ? (
      <p>No memories yet.</p>
    ) : (
        <ul>
          {existingMemories.map((memory) => (
            <li key={memory._id}>
              {memory.type === 'note' ? (
                <div>
                  {editingId === memory._id ? (
                    <>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={5}
                        cols={50}
                      />
                      <br />
                      <button onClick={saveEdit} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-300 px-2 py-1 rounded">Cancel</button>
                    </>
                  ) : (
                    <>
                      <p>{memory.content}</p>
                      <button onClick={() => startEditing(memory._id, memory.content)} className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                    </>
                  )}
  </div>
              ) : memory.type === 'photo' ? (
                <img src={`http://localhost:4000${memory.content}`} alt="Concert memory" width="200" />
              ) : memory.type === 'video' ? (
                <video controls width="300">
                  <source src={`http://localhost:4000${memory.content}`} type={memory.mimeType || 'video/mp4'} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <p>Unknown memory type</p>
              )}

              <button 
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => handleDelete(memory._id)}
              >
                delete
              </button>
            </li>
          ))}
        </ul>
    )}
  </div>

    </div>

    
  );
};

export default ConcertExpPage;
