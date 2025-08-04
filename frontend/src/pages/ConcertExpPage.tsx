import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ConcertDetails, ConcertMemory } from "types/types";
import SimpleSlideshow from "../components/MediaSlideshow";
import "../styling/ConcertExp.css";
import { SpotifyPlayer } from "components/Spotify/SpotifyPlayer";
import { useSpotify } from "context/SpotifyContext";
import { SpotifyEmbed } from "components/Spotify/SpotifyEmbed";

const ConcertExpPage: React.FC = () => {
  const { id } = useParams();
  const { tokens } = useSpotify();
  const [memories, setMemories] = useState<ConcertMemory[]>([]);
  const [concertDetails, setConcertDetails] = useState<ConcertDetails>();
  const [editMode, setEditMode] = useState(false);
  const [editedNote, setEditedNote] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [noteID, setNoteID] = useState("");
  const [newPlaylistId, setNewPlaylistId] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`http://127.0.0.1:4000/api/upload/get/${id}`)
      .then((res) => res.json())
      .then((data) =>
        Array.isArray(data) ? setMemories(data) : setMemories([])
      )
      .catch(() => setMemories([]));

    fetch(`http://127.0.0.1:4000/api/concerts/ticket/${id}`)
      .then((res) => res.json())
      .then((data) => setConcertDetails(data))
      .catch(() => null);

    fetch(`http://127.0.0.1:4000/api/concerts/${id}/setlist`)
      .then((res) => res.json())
      .then((data) => {
        if (data.spotifyPlaylistId) {
          setConcertDetails((prev) =>
            prev ? { ...prev, spotifyPlaylistId: data.spotifyPlaylistId } : prev
          );
        }
      })
      .catch((err) => console.error("Failed to fetch playlist ID:", err));
  }, [id]);

  useEffect(() => {
    const note = memories.find((m) => m.type === "note");
    if (note?._id) setNoteID(note._id);
  }, [memories]);

  const media = memories.filter((m) => m.type !== "note");
  const note = memories.find((m) => m.type === "note");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewFiles(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSaveAll = async () => {
    if (!id) return;
    setLoading(true);

    const formData = new FormData();
    newFiles.forEach((file) => formData.append("files", file));

    if (noteID) {
      try {
        const res = await fetch(`http://127.0.0.1:4000/api/upload/${noteID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editedNote }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update memory");
      } catch (err) {
        alert("Error updating note");
        console.error(err);
      }
    } else {
      formData.append("note", editedNote);
    }

    try {
      const res = await fetch(`http://127.0.0.1:4000/api/upload/${id}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "upload failed");

      setNewFiles([]);
      setEditMode(false);
      setPreviewUrls([]);

      const refreshed = await fetch(
        `http://127.0.0.1:4000/api/upload/get/${id}`
      );
      const updatedMemories = await refreshed.json();
      setMemories(Array.isArray(updatedMemories) ? updatedMemories : []);
    } catch (err: any) {
      alert("Error saving experience: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!id || !mediaId) return;

    try {
      const res = await fetch(
        `http://127.0.0.1:4000/api/upload/${id}/${mediaId}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setMemories((prev) => prev.filter((m) => m._id !== mediaId));
    } catch (err) {
      alert("Error deleting media");
    }
  };

  const toggleSelectMedia = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddPlaylist = async () => {
    if (!id || !newPlaylistId) return;
    try {
      const res = await fetch(
        `http://127.0.0.1:4000/api/concerts/${id}/playlist`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spotifyPlaylistId: newPlaylistId }),
        }
      );
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data.error || "Failed to save playlist ID");
      setConcertDetails((prev) =>
        prev ? { ...prev, spotifyPlaylistId: data.spotifyPlaylistId } : prev
      );
      setNewPlaylistId("");
      console.log("concert playlist id:", concertDetails?.spotifyPlaylistId);
    } catch (err) {
      alert("Error saving playlist ID");
      console.error(err);
    }
  };

  return (
    <div className="exp-container">
      <h1 className="title">
        {concertDetails?.artist}: {concertDetails?.tour}
      </h1>

      {editMode ? (
        <>
          <button
            onClick={() => {
              setEditMode(false);
              setEditedNote(note?.content || "");
            }}
            className="button cancel-button"
          >
            Cancel
          </button>

          <div className="flex-row">
            <div className="media-section">
              <h2 className="section-title">Media</h2>

              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              <div className="preview-grid">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="preview-item">
                    <img src={url} alt={`preview-${idx}`} />
                  </div>
                ))}
              </div>

              <ul className="media-grid">
                {media.map((m) => (
                  <li
                    key={m._id}
                    className={`media-item ${
                      selectedMediaIds.includes(m._id) ? "selected" : ""
                    }`}
                    onClick={() => toggleSelectMedia(m._id)}
                  >
                    {m.type === "photo" ? (
                      <img
                        src={`http://127.0.0.1:4000${m.content}`}
                        alt="memory"
                      />
                    ) : (
                      <video
                        controls
                        src={`http://127.0.0.1:4000${m.content}`}
                      />
                    )}
                  </li>
                ))}
              </ul>

              {selectedMediaIds.length === 0 ? (
                <></>
              ) : (
                <button
                  onClick={() => {
                    selectedMediaIds.forEach((id) => handleDeleteMedia(id));
                    setSelectedMediaIds([]);
                  }}
                  className="button delete-button"
                  disabled={selectedMediaIds.length === 0}
                >
                  Delete Selected
                </button>
              )}
            </div>

            <div className="note-section">
              <h2 className="section-title">Concert Note</h2>
              <textarea
                rows={10}
                cols={50}
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
              />
            </div>
          </div>

          <div className="save-button-wrapper">
            <button
              onClick={handleSaveAll}
              className="button save-button"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      ) : media.length === 0 && !note?.content ? (
        <button
          onClick={() => {
            setEditMode(true);
            setEditedNote(note?.content || "");
            setNoteID(note?._id || "");
          }}
          className="button"
        >
          Add Experience
        </button>
      ) : (
        <>
          <button
            onClick={() => {
              setEditMode(true);
              setEditedNote(note?.content || "");
              setNoteID(note?._id || "");
            }}
            className="button edit-button"
          >
            Edit
          </button>

          <div className="flex-row">
            <div className="media-section">
              <h2 className="section-title">Media</h2>
              <SimpleSlideshow media={media} />
            </div>

            <div className="note-section">
              <h2 className="section-title">Concert Note</h2>
              <pre className="note-display">
                {note?.content || "No note yet."}
              </pre>
            </div>
          </div>
        </>
      )}

      {/* SETLIST PLAYER */}
      {tokens &&
        (concertDetails?.spotifyPlaylistId ? (
          <SpotifyPlayer
            accessToken={tokens.access_token}
            playlistId={concertDetails.spotifyPlaylistId}
          />
        ) : (
          <div className="spotify-id-entry">
            <h3>Set Spotify Playlist for this Concert</h3>
            <input
              type="text"
              placeholder="Paste Spotify Playlist URL or URI"
              value={newPlaylistId}
              onChange={(e) => setNewPlaylistId(e.target.value)}
            />
            <button onClick={handleAddPlaylist}>Save Playlist</button>
          </div>
        ))}
    </div>
  );
};

export default ConcertExpPage;
