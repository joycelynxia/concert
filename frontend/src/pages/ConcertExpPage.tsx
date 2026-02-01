import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ConcertDetails, ConcertMemory } from "types/types";
import SimpleSlideshow from "../components/MediaSlideshow";
import { API_BASE } from "../config/api";
import "../styling/ConcertExp.css";
import Linkify from "react-linkify";
import { ExternalLink, ImagePlus, Upload, X } from "lucide-react";

const formatYoutubeId = (input: string): string => {
  const trimmed = input.trim();
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : trimmed;
};

const formatSpotifyId = (input: string): string => {
  const trimmed = input.trim();
  const match = trimmed.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : trimmed;
};

const ConcertExpPage: React.FC = () => {
  const { id } = useParams();
  const [memories, setMemories] = useState<ConcertMemory[]>([]);
  const [concertDetails, setConcertDetails] = useState<ConcertDetails>();
  const [editMode, setEditMode] = useState(false);
  const [editedNote, setEditedNote] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [noteID, setNoteID] = useState("");
  const [newSpotifyPlaylistId, setNewSpotifyPlaylistId] = useState("");
  const [newYoutubePlaylistId, setNewYoutubePlaylistId] = useState("");
  useEffect(() => {
    if (!id) return;

    fetch(`${API_BASE}/api/upload/get/${id}`)
      .then((res) => res.json())
      .then((data) =>
        Array.isArray(data) ? setMemories(data) : setMemories([])
      )
      .catch(() => setMemories([]));

    fetch(`${API_BASE}/api/concerts/ticket/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setConcertDetails(data);
        setNewSpotifyPlaylistId(data?.setlist || "");
        setNewYoutubePlaylistId(data?.youtubePlaylist || "");
      })
      .catch(() => null);

    // fetch(`http://127.0.0.1:4000/api/concerts/${id}/setlist`)
    //   .then((res) => res.json())
    //   .then((data) => {
    //     if (data.setlist) {
    //       setConcertDetails((prev) =>
    //         prev ? { ...prev, setlist: data.setlist } : prev
    //       );
    //     }
    //   })
    //   .catch((err) => console.error("Failed to fetch playlist ID:", err));
  }, [id]);

  useEffect(() => {
    const note = memories.find((m) => m.type === "note");
    if (note?._id) setNoteID(note._id);
  }, [memories]);

  const media = memories.filter((m) => m.type !== "note");
  const note = memories.find((m) => m.type === "note");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewFiles((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    e.target.value = "";
  };

  const removeNewFile = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (files.length) {
      setNewFiles((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [
        ...prev,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSaveAll = async () => {
    if (!id) return;
    setLoading(true);

    const formData = new FormData();
    newFiles.forEach((file) => formData.append("files", file));

    if (noteID) {
      try {
        const res = await fetch(`${API_BASE}/api/upload/${noteID}`, {
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
      const res = await fetch(`${API_BASE}/api/upload/${id}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "upload failed");

      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setNewFiles([]);
      setEditMode(false);
      setPreviewUrls([]);

      const refreshed = await fetch(
        `${API_BASE}/api/upload/get/${id}`
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
        `${API_BASE}/api/upload/${id}/${mediaId}`,
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

  const handleAddSpotifyPlaylist = async () => {
    if (!id || !newSpotifyPlaylistId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/concerts/${id}/playlist`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setlist: newSpotifyPlaylistId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save Spotify playlist");
      setConcertDetails((prev) =>
        prev ? { ...prev, setlist: data.setlist } : prev
      );
      setNewSpotifyPlaylistId(data.setlist || "");
    } catch (err) {
      alert("Error saving Spotify playlist");
      console.error(err);
    }
  };

  const handleAddYoutubePlaylist = async () => {
    if (!id || !newYoutubePlaylistId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/concerts/${id}/youtube-playlist`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtubePlaylist: newYoutubePlaylistId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save YouTube playlist");
      setConcertDetails((prev) =>
        prev ? { ...prev, youtubePlaylist: data.youtubePlaylist } : prev
      );
      setNewYoutubePlaylistId(data.youtubePlaylist || "");
    } catch (err) {
      alert("Error saving YouTube playlist");
      console.error(err);
    }
  };

  return (
    <div className="exp-container">
      <div className="concert-exp-header">
        {/* <button className="back-button" onClick={returnToTickets}>
          &lt;
        </button> */}
        <h1 className="title">
          {concertDetails?.artist}: {concertDetails?.tour}
        </h1>
      </div>
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
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="upload-input-hidden"
              />
              <div
                className="upload-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={32} strokeWidth={1.5} className="upload-icon" />
                <p className="upload-text">
                  Drop photos or videos here, or click to browse
                </p>
                <span className="upload-hint">Supports images and videos</span>
              </div>

              {previewUrls.length > 0 && (
                <div className="preview-section">
                  <p className="preview-label">
                    <Upload size={16} /> New files ({previewUrls.length})
                  </p>
                  <div className="preview-grid">
                    {previewUrls.map((url, idx) => {
                      const file = newFiles[idx];
                      const isVideo = file?.type.startsWith("video/");
                      return (
                        <div key={idx} className="preview-item">
                          {isVideo ? (
                            <video src={url} muted />
                          ) : (
                            <img src={url} alt={`preview-${idx}`} />
                          )}
                          <button
                            type="button"
                            className="preview-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNewFile(idx);
                            }}
                            aria-label="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                        src={`${API_BASE}${m.content}`}
                        alt="memory"
                      />
                    ) : (
                      <video
                        controls
                        src={`${API_BASE}${m.content}`}
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

          {/* Setlist - when editing */}
          <section className="setlist-section">
            <h3 className="add-playlist-title">Setlist</h3>
            <div className="add-playlist-form">
              <div className="playlist-input-row">
                <label>
                  Spotify playlist URL:
                  <input
                    type="text"
                    placeholder="https://open.spotify.com/playlist/..."
                    value={newSpotifyPlaylistId}
                    onChange={(e) => setNewSpotifyPlaylistId(e.target.value)}
                  />
                </label>
                <button
                  onClick={handleAddSpotifyPlaylist}
                  disabled={!newSpotifyPlaylistId.trim()}
                >
                  {concertDetails?.setlist ? "Update" : "Add"} Spotify
                </button>
              </div>
              <div className="playlist-input-row">
                <label>
                  YouTube playlist URL:
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/playlist?list=..."
                    value={newYoutubePlaylistId}
                    onChange={(e) => setNewYoutubePlaylistId(e.target.value)}
                  />
                </label>
                <button
                  onClick={handleAddYoutubePlaylist}
                  disabled={!newYoutubePlaylistId.trim()}
                >
                  {concertDetails?.youtubePlaylist ? "Update" : "Add"} YouTube
                </button>
              </div>
            </div>
          </section>
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
                <Linkify>{note?.content || "No note yet."}</Linkify>
              </pre>
            </div>
          </div>

          {/* Setlist - when viewing */}
          {(concertDetails?.setlist || concertDetails?.youtubePlaylist) && (
            <section className="setlist-section">
              <h3 className="add-playlist-title">Setlist</h3>
              <div className="playlist-links">
                {concertDetails?.setlist && (
                  <a
                    href={`https://open.spotify.com/playlist/${formatSpotifyId(concertDetails.setlist)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spotify-playlist-link"
                  >
                    <ExternalLink size={18} />
                    Open in Spotify
                  </a>
                )}
                {concertDetails?.youtubePlaylist && (
                  <a
                    href={`https://www.youtube.com/playlist?list=${formatYoutubeId(concertDetails.youtubePlaylist)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="youtube-playlist-link"
                  >
                    <ExternalLink size={18} />
                    Open YouTube playlist in new tab
                  </a>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ConcertExpPage;
