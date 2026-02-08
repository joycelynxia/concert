import React from "react";
import { Check, Loader2 } from "lucide-react";
import "../styling/UploadProgressPopup.css";

export interface UploadProgressState {
  visible: boolean;
  current: number;
  total: number;
  fileName?: string;
  phase: "uploading" | "complete";
}

interface UploadProgressPopupProps {
  state: UploadProgressState;
}

const UploadProgressPopup: React.FC<UploadProgressPopupProps> = ({ state }) => {
  if (!state.visible) return null;

  const { current, total, fileName, phase } = state;
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="upload-progress-popup" role="status" aria-live="polite">
      <div className="upload-progress-content">
        {phase === "uploading" ? (
          <>
            <Loader2 className="upload-progress-spinner" size={20} />
            <div className="upload-progress-text">
              <span className="upload-progress-label">Uploading</span>
              <span className="upload-progress-detail">
                {total > 0 ? `${current} of ${total} files` : "Saving..."}
                {fileName && (
                  <span className="upload-progress-filename" title={fileName}>
                    {fileName.length > 20 ? `${fileName.slice(0, 17)}...` : fileName}
                  </span>
                )}
              </span>
            </div>
          </>
        ) : (
          <>
            <Check className="upload-progress-check" size={20} />
            <span className="upload-progress-complete">Upload complete</span>
          </>
        )}
      </div>
      {phase === "uploading" && total > 0 && (
        <div className="upload-progress-bar">
          <div
            className="upload-progress-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default UploadProgressPopup;
