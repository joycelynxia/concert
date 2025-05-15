import React from 'react';
import { ConcertMemory } from 'types/types';

interface NoteMemoryProps {
    memory: ConcertMemory;
    editingId: string | null;
    editedContent: string;
    onStartEdit: (id: string, content: string) => void;
    onChangeEdit: (value: string) => void;
    onSave: () => void;
    onCancelEdit: () => void;
}

const NoteMemory: React.FC<NoteMemoryProps> = ({
    memory,
    editingId,
    editedContent,
    onStartEdit,
    onChangeEdit,
    onSave,
    onCancelEdit,
  }) => {
    return (
      <div className="mb-4 p-4 bg-gray-100 rounded shadow-sm">
        {editingId === memory._id ? (
          <>
            <textarea
              value={editedContent}
              onChange={(e) => onChangeEdit(e.target.value)}
              rows={5}
              className="w-full mb-2 p-2 border border-gray-300 rounded"
            />
            <div className="flex gap-2">
              <button onClick={onSave} className="bg-green-500 text-white px-2 py-1 rounded">
                Save
              </button>
              <button onClick={onCancelEdit} className="bg-gray-400 text-white px-2 py-1 rounded">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{memory.content}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onStartEdit(memory._id, memory.content)}
                className="bg-blue-500 text-white px-2 py-1 rounded"
              >
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    );
  };
  
  export default NoteMemory;