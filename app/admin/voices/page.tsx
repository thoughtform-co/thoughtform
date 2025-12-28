"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { VoiceUploadZone } from "@/components/admin";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import type { ManifestoVoice } from "@/app/api/voices/route";
import "./voices-admin.css";

interface VoiceFormData {
  id?: string;
  title: string;
  description: string;
  full_text: string;
  role: string;
  type: string;
  video_url: string;
  thumbnail_url: string;
  order_index: number;
  is_active: boolean;
}

const EMPTY_FORM: VoiceFormData = {
  title: "",
  description: "",
  full_text: "",
  role: "Manifesto",
  type: "Voice",
  video_url: "",
  thumbnail_url: "",
  order_index: 0,
  is_active: true,
};

export default function VoicesAdminPage() {
  const router = useRouter();
  const { user, session, isLoading } = useAuth();
  const [voices, setVoices] = useState<ManifestoVoice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<ManifestoVoice | null>(null);
  const [formData, setFormData] = useState<VoiceFormData>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check authorization
  const isAuthorized = user && isAllowedUserEmail(user.email);

  // Fetch voices
  const fetchVoices = useCallback(async () => {
    try {
      const response = await fetch("/api/voices");
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
      }
    } catch (err) {
      console.error("Failed to fetch voices:", err);
    } finally {
      setIsLoadingVoices(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchVoices();
    }
  }, [isAuthorized, fetchVoices]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle voice selection
  const handleSelectVoice = (voice: ManifestoVoice) => {
    setSelectedVoice(voice);
    setFormData({
      id: voice.id,
      title: voice.title,
      description: voice.description || "",
      full_text: voice.full_text || "",
      role: voice.role || "Manifesto",
      type: voice.type || "Voice",
      video_url: voice.video_url || "",
      thumbnail_url: voice.thumbnail_url || "",
      order_index: voice.order_index,
      is_active: voice.is_active,
    });
    setError(null);
  };

  // Handle new voice
  const handleNewVoice = () => {
    setSelectedVoice(null);
    setFormData({
      ...EMPTY_FORM,
      order_index: voices.length,
    });
    setError(null);
  };

  // Handle form field changes
  const handleFieldChange = (field: keyof VoiceFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle media upload
  const handleMediaUploaded = (data: { videoUrl?: string; thumbnailUrl?: string }) => {
    setFormData((prev) => ({
      ...prev,
      video_url: data.videoUrl || prev.video_url,
      thumbnail_url: data.thumbnailUrl || prev.thumbnail_url,
    }));
  };

  // Handle clear media
  const handleClearMedia = () => {
    setFormData((prev) => ({
      ...prev,
      video_url: "",
      thumbnail_url: "",
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const isUpdate = !!formData.id;
      const url = isUpdate ? `/api/voices/${formData.id}` : "/api/voices";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          full_text: formData.full_text || null,
          role: formData.role || null,
          type: formData.type || "Voice",
          video_url: formData.video_url || null,
          thumbnail_url: formData.thumbnail_url || null,
          order_index: formData.order_index,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Save failed");
      }

      const data = await response.json();
      setSuccessMessage(isUpdate ? "Voice updated!" : "Voice created!");

      // Refresh voices list
      await fetchVoices();

      // Select the newly created/updated voice
      if (data.voice) {
        handleSelectVoice(data.voice);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!formData.id) return;

    if (!confirm("Are you sure you want to delete this voice?")) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/voices/${formData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

      setSuccessMessage("Voice deleted!");
      handleNewVoice();
      await fetchVoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="voices-admin">
        <div className="voices-admin__loading">Loading...</div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="voices-admin">
        <div className="voices-admin__error">
          <h2>Access Denied</h2>
          <p>You need to be logged in as an admin to access this page.</p>
          <button onClick={() => router.push("/admin")} className="voices-admin__btn">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voices-admin">
      {/* Header */}
      <header className="voices-admin__header">
        <div className="voices-admin__header-left">
          <button onClick={() => router.push("/")} className="voices-admin__back">
            ← Home
          </button>
          <h1>Manifesto Voices</h1>
        </div>
        <div className="voices-admin__header-right">
          <span className="voices-admin__user">{user?.email}</span>
        </div>
      </header>

      {/* Messages */}
      {successMessage && <div className="voices-admin__success">{successMessage}</div>}
      {error && <div className="voices-admin__error-message">{error}</div>}

      {/* Main content */}
      <div className="voices-admin__content">
        {/* Voices list */}
        <aside className="voices-admin__sidebar">
          <div className="voices-admin__sidebar-header">
            <h2>Voices</h2>
            <button
              onClick={handleNewVoice}
              className="voices-admin__btn voices-admin__btn--primary"
            >
              + New
            </button>
          </div>

          {isLoadingVoices ? (
            <div className="voices-admin__loading">Loading voices...</div>
          ) : (
            <ul className="voices-admin__list">
              {voices.map((voice) => (
                <li
                  key={voice.id}
                  className={`voices-admin__list-item ${selectedVoice?.id === voice.id ? "active" : ""} ${!voice.is_active ? "inactive" : ""}`}
                  onClick={() => handleSelectVoice(voice)}
                >
                  <div className="voices-admin__list-item-thumb">
                    {voice.thumbnail_url ? (
                      <img src={voice.thumbnail_url} alt="" />
                    ) : (
                      <span className="voices-admin__list-item-placeholder">{voice.title[0]}</span>
                    )}
                  </div>
                  <div className="voices-admin__list-item-info">
                    <span className="voices-admin__list-item-title">{voice.title}</span>
                    <span className="voices-admin__list-item-meta">
                      #{voice.order_index} • {voice.type}
                    </span>
                  </div>
                  {!voice.is_active && (
                    <span className="voices-admin__list-item-badge">Hidden</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Editor panel */}
        <main className="voices-admin__editor">
          <div className="voices-admin__editor-header">
            <h2>{formData.id ? "Edit Voice" : "New Voice"}</h2>
            {formData.id && (
              <button
                onClick={handleDelete}
                className="voices-admin__btn voices-admin__btn--danger"
                disabled={isSaving}
              >
                Delete
              </button>
            )}
          </div>

          <form className="voices-admin__form" onSubmit={(e) => e.preventDefault()}>
            {/* Media upload */}
            <div className="voices-admin__field">
              <label>Video / Thumbnail</label>
              <VoiceUploadZone
                onMediaUploaded={handleMediaUploaded}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                existingVideoUrl={formData.video_url}
                existingThumbnailUrl={formData.thumbnail_url}
                onClear={handleClearMedia}
              />
            </div>

            {/* Title */}
            <div className="voices-admin__field">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                placeholder="e.g., AI as Intelligence"
                required
              />
            </div>

            {/* Description */}
            <div className="voices-admin__field">
              <label htmlFor="description">Short Description</label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Brief text shown on card"
              />
            </div>

            {/* Full text */}
            <div className="voices-admin__field">
              <label htmlFor="full_text">Full Text</label>
              <textarea
                id="full_text"
                value={formData.full_text}
                onChange={(e) => handleFieldChange("full_text", e.target.value)}
                placeholder="Extended quote or text shown in modal"
                rows={4}
              />
            </div>

            {/* Row: Role & Type */}
            <div className="voices-admin__field-row">
              <div className="voices-admin__field">
                <label htmlFor="role">Role</label>
                <input
                  id="role"
                  type="text"
                  value={formData.role}
                  onChange={(e) => handleFieldChange("role", e.target.value)}
                  placeholder="e.g., Manifesto, Founder"
                />
              </div>
              <div className="voices-admin__field">
                <label htmlFor="type">Type</label>
                <input
                  id="type"
                  type="text"
                  value={formData.type}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                  placeholder="e.g., Voice, Testimonial"
                />
              </div>
            </div>

            {/* Row: Order & Active */}
            <div className="voices-admin__field-row">
              <div className="voices-admin__field">
                <label htmlFor="order_index">Order</label>
                <input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) =>
                    handleFieldChange("order_index", parseInt(e.target.value, 10) || 0)
                  }
                  min={0}
                />
              </div>
              <div className="voices-admin__field voices-admin__field--checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleFieldChange("is_active", e.target.checked)}
                  />
                  <span>Active (visible in stack)</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="voices-admin__actions">
              <button
                type="button"
                onClick={handleSave}
                className="voices-admin__btn voices-admin__btn--primary"
                disabled={isSaving || isUploading}
              >
                {isSaving ? "Saving..." : formData.id ? "Save Changes" : "Create Voice"}
              </button>
              <button
                type="button"
                onClick={handleNewVoice}
                className="voices-admin__btn"
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
