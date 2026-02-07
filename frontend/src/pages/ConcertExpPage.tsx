import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ConcertDetails, ConcertMemory } from "types/types";
import SimpleSlideshow from "../components/MediaSlideshow";
import { API_BASE } from "../config/api";
import "../styling/ConcertExp.css";
import Linkify from "react-linkify";
import { ExternalLink, ImagePlus, Upload, X } from "lucide-react";

function getCurrentUserId(): string | null {
  try {
    const u = localStorage.getItem("user");
    if (!u) return null;
    const parsed = JSON.parse(u) as { id?: string };
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

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
  const currentUserId = getCurrentUserId();
  const isLoggedIn = Boolean(currentUserId);
  const [memories, setMemories] = useState<ConcertMemory[]>([]);
  const [concertDetails, setConcertDetails] = useState<ConcertDetails>();
  const [editMode, setEditMode] = useState(false);
  const canEdit = Boolean(
    isLoggedIn &&
    concertDetails?.user != null &&
    String(concertDetails.user) === String(currentUserId)
  );
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

    const authHeaders: Record<string, string> = {};
    const token = localStorage.getItem("token");
    if (token) authHeaders.Authorization = `Bearer ${token}`;

    if (noteID) {
      try {
        const res = await fetch(`${API_BASE}/api/upload/${noteID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ content: editedNote }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update memory");
      } catch (err) {
        alert("Error updating note");
        console.error(err);
      }
    }

    const uploadNote = !noteID ? editedNote : undefined;

    try {
      if (newFiles.length > 0) {
        // Try direct-to-S3 upload first (avoids backend memory usage)
        const presignRes = await fetch(`${API_BASE}/api/upload/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            ticketId: id,
            filename: newFiles[0].name,
            contentType: newFiles[0].type,
          }),
        });
        const presignData = await presignRes.json();

        if (presignRes.ok && presignData.uploadUrl) {
          // Direct S3 upload flow
          const memories: { type: string; key: string; contentType: string }[] = [];
          for (const file of newFiles) {
            const p = await fetch(`${API_BASE}/api/upload/presign`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders },
              body: JSON.stringify({
                ticketId: id,
                filename: file.name,
                contentType: file.type,
              }),
            });
            const { uploadUrl, key } = await p.json();
            if (!p.ok || !uploadUrl) throw new Error("Failed to get upload URL");
            const putRes = await fetch(uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });
            if (!putRes.ok) throw new Error("Upload to storage failed");
            const type = file.type.startsWith("video/") ? "video" : "photo";
            memories.push({ type, key, contentType: file.type });
          }
          const completeRes = await fetch(`${API_BASE}/api/upload/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            body: JSON.stringify({ ticketId: id, memories, note: uploadNote }),
          });
          const completeData = await completeRes.json();
          if (!completeRes.ok) throw new Error(completeData.error || "Failed to save");
        } else if (presignData.useLegacyUpload) {
          // Fallback: backend buffers files (local storage)
          const formData = new FormData();
          newFiles.forEach((file) => formData.append("files", file));
          if (uploadNote) formData.append("note", uploadNote);
          const res = await fetch(`${API_BASE}/api/upload/${id}`, {
            method: "POST",
            headers: authHeaders,
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "upload failed");
        } else {
          throw new Error(presignData.error || "Upload failed");
        }
      } else if (uploadNote && uploadNote.trim()) {
        // Note only - lightweight FormData (no files)
        const formData = new FormData();
        formData.append("note", uploadNote);
        const res = await fetch(`${API_BASE}/api/upload/${id}`, {
          method: "POST",
          headers: authHeaders,
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "upload failed");
      }

      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setNewFiles([]);
      setEditMode(false);
      setPreviewUrls([]);

      const refreshed = await fetch(`${API_BASE}/api/upload/get/${id}`);
      const updatedMemories = await refreshed.json();
      setMemories(Array.isArray(updatedMemories) ? updatedMemories : []);
    } catch (err: unknown) {
      alert("Error saving experience: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!id || !mediaId) return;

    try {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(
        `${API_BASE}/api/upload/${id}/${mediaId}`,
        {
          method: "DELETE",
          headers: Object.keys(headers).length ? headers : undefined,
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(
        `${API_BASE}/api/concerts/${id}/playlist`,
        {
          method: "PUT",
          headers,
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(
        `${API_BASE}/api/concerts/${id}/youtube-playlist`,
        {
          method: "PUT",
          headers,
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
      {editMode && canEdit ? (
        <>
          <button
            type="button"
            onClick={() => {
              setEditMode(false);
              setEditedNote(note?.content || "");
            }}
            className="account-btn account-btn-outline cancel-button"
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
                  type="button"
                  onClick={() => {
                    selectedMediaIds.forEach((id) => handleDeleteMedia(id));
                    setSelectedMediaIds([]);
                  }}
                  className="account-btn account-btn-danger delete-button"
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
              type="button"
              onClick={handleSaveAll}
              className="account-btn account-btn-primary save-button"
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
                  type="button"
                  className="account-btn account-btn-primary account-btn-sm"
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
                  type="button"
                  className="account-btn account-btn-primary account-btn-sm"
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
        canEdit ? (
          <button
            type="button"
            onClick={() => {
              setEditMode(true);
              setEditedNote(note?.content || "");
              setNoteID(note?._id || "");
            }}
            className="account-btn account-btn-primary"
          >
            Add Experience
          </button>
        ) : null
      ) : (
        <>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditMode(true);
                setEditedNote(note?.content || "");
                setNoteID(note?._id || "");
              }}
              className="account-btn account-btn-primary edit-button"
            >
              Edit
            </button>
          )}

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
