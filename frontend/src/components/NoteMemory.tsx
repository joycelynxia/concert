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
            <div className="flex gap-2 account-form-actions">
              <button type="button" onClick={onSave} className="account-btn account-btn-primary account-btn-sm">
                Save
              </button>
              <button type="button" onClick={onCancelEdit} className="account-btn account-btn-outline account-btn-sm">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{memory.content}</p>
            <div className="flex gap-2 mt-2 account-form-actions">
              <button
                type="button"
                onClick={() => onStartEdit(memory._id, memory.content)}
                className="account-btn account-btn-primary account-btn-sm"
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