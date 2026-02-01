import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import "../styling/AccountPage.css";

function AccountPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ email?: string; username?: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
      return;
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err) {
      setError("Unable to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }

    setIsDeleting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/auth/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
      } else {
        setDeleteError(data.message || "Failed to delete account");
      }
    } catch (err) {
      setDeleteError("Unable to connect to the server");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="account-page">
      <div className="account-container">
        <div className="account-header">
          <h1 className="account-title">My Account</h1>
        </div>

        <section className="account-section account-user-info">
          <div className="account-user-field">
            <span className="account-user-label">Name</span>
            <span className="account-user-value">{user?.username || "—"}</span>
          </div>
          <div className="account-user-field">
            <span className="account-user-label">Email</span>
            <span className="account-user-value">{user?.email || "—"}</span>
          </div>
          <div className="account-user-field">
            <span className="account-user-label">Password</span>
            <div className="account-user-value-row">
              <span className="account-user-value">••••••••</span>
              <button
                type="button"
                className="account-btn account-btn-primary account-btn-sm"
                onClick={() => setIsChangingPassword(true)}
              >
                Change Password
              </button>
            </div>
          </div>
        </section>

        {isChangingPassword && (
          <div
            className="account-modal-backdrop"
            onClick={() => {
              if (!isLoading) {
                setIsChangingPassword(false);
                setError("");
                setSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-modal-title"
          >
            <div
              className="account-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="change-password-modal-title" className="account-modal-title">
                Change Password
              </h2>
              <form onSubmit={handleChangePassword} className="account-form account-password-form">
                <label className="account-label">
                  Current Password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="account-input"
                    required
                    autoComplete="current-password"
                  />
                </label>
                <label className="account-label">
                  New Password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="account-input"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
                <label className="account-label">
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="account-input"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
                {error && <p className="account-error">{error}</p>}
                {success && <p className="account-success">{success}</p>}
                <div className="account-form-actions">

                  <button
                    type="button"
                    className="account-btn account-btn-outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setError("");
                      setSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="account-btn account-btn-primary" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <section className="account-section">
          <h2 className="account-section-title">Sign Out</h2>
          <p className="account-section-desc">Sign out of your account on this device.</p>
          <button type="button" className="account-btn account-btn-secondary" onClick={handleLogout}>
            Log Out
          </button>
        </section>

        <section className="account-section">
          <h2 className="account-section-title">Delete Account</h2>
          <p className="account-section-desc">
            Permanently delete your account and all your data (concert tickets, memories, playlists).
            This cannot be undone.
          </p>
          {showDeleteConfirm ? (
            <form onSubmit={handleDeleteAccount} className="account-form">
              <label className="account-label">
                Type <strong>DELETE</strong> to confirm
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="account-input"
                  autoComplete="off"
                  disabled={isDeleting}
                />
              </label>
              {deleteError && <p className="account-error">{deleteError}</p>}
              <div className="account-form-actions">
                <button
                  type="submit"
                  className="account-btn account-btn-danger"
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete Account"}
                </button>
                <button
                  type="button"
                  className="account-btn account-btn-outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                    setDeleteError("");
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="account-btn account-btn-danger-outline"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

export default AccountPage;
