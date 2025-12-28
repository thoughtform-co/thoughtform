"use client";

import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const BUCKET_NAME = "voices-media";

interface VoiceUploadZoneProps {
  /** Callback when media is uploaded - provides URLs */
  onMediaUploaded: (data: { videoUrl?: string; thumbnailUrl?: string }) => void;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Set upload state */
  setIsUploading: (uploading: boolean) => void;
  /** Existing video URL (for edit mode) */
  existingVideoUrl?: string;
  /** Existing thumbnail URL (for edit mode) */
  existingThumbnailUrl?: string;
  /** Callback to clear media */
  onClear?: () => void;
  /** Compact mode for smaller UI */
  compact?: boolean;
}

/**
 * Extract first frame from video as a thumbnail
 */
const extractVideoThumbnail = (file: File): Promise<Blob | null> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      // Seek to first frame
      video.currentTime = 0;
    };

    video.onseeked = () => {
      // Create canvas and draw the frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          // Clean up
          URL.revokeObjectURL(video.src);
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    video.onerror = () => {
      console.error("Failed to load video for thumbnail extraction");
      resolve(null);
    };

    // Load the video file
    video.src = URL.createObjectURL(file);
  });
};

export function VoiceUploadZone({
  onMediaUploaded,
  isUploading,
  setIsUploading,
  existingVideoUrl,
  existingThumbnailUrl,
  onClear,
  compact = false,
}: VoiceUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    videoUrl: string;
    thumbnailUrl?: string;
    type: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection - uploads directly to Supabase (no file size limits)
  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];

      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Use: jpg, png, webp, gif, mp4, webm, or mov");
        return;
      }

      // Check Supabase is configured
      if (!supabase) {
        setError("Storage not configured. Please check Supabase setup.");
        return;
      }

      const isVideo = file.type.startsWith("video/");

      setIsUploading(true);
      setUploadProgress(10);

      try {
        let thumbnailUrl: string | undefined;
        const timestamp = Date.now();

        // For videos, extract and upload thumbnail first
        if (isVideo) {
          setUploadProgress(15);
          const thumbnailBlob = await extractVideoThumbnail(file);

          if (thumbnailBlob) {
            setUploadProgress(25);

            // Upload thumbnail directly to Supabase
            const thumbName = `thumb_${file.name.replace(/\.[^.]+$/, ".jpg")}`.replace(
              /[^a-zA-Z0-9.-]/g,
              "_"
            );
            const thumbPath = `uploads/${timestamp}_${thumbName}`;

            const { data: thumbData, error: thumbError } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(thumbPath, thumbnailBlob, {
                contentType: "image/jpeg",
                upsert: false,
              });

            if (!thumbError && thumbData) {
              const { data: thumbUrlData } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(thumbData.path);
              thumbnailUrl = thumbUrlData.publicUrl;
            } else {
              console.warn("Thumbnail upload failed, continuing without thumbnail:", thumbError);
            }
          }
        }

        setUploadProgress(50);

        // Upload main file directly to Supabase
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `uploads/${timestamp}_${sanitizedName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        setUploadProgress(80);

        if (uploadError) {
          throw new Error(uploadError.message || "Upload failed");
        }

        if (!uploadData) {
          throw new Error("Upload failed: No data returned");
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);

        setUploadProgress(100);

        setUploadedFile({
          name: file.name,
          videoUrl: isVideo ? urlData.publicUrl : "",
          thumbnailUrl: isVideo ? thumbnailUrl : urlData.publicUrl,
          type: file.type,
        });

        // Call callback with URLs
        onMediaUploaded({
          videoUrl: isVideo ? urlData.publicUrl : undefined,
          thumbnailUrl: isVideo ? thumbnailUrl : urlData.publicUrl,
        });

        setIsUploading(false);
      } catch (err) {
        console.error("Upload error:", err);
        setError(err instanceof Error ? err.message : "Upload failed");
        setUploadProgress(0);
        setIsUploading(false);
      }
    },
    [onMediaUploaded, setIsUploading]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Click to upload
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Clear uploaded file
  const handleClear = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setError(null);
    onClear?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Determine if we have media from either internal upload or existing props
  const activeVideo =
    uploadedFile?.videoUrl ||
    existingVideoUrl ||
    (uploadedFile?.type?.startsWith("image/") ? null : uploadedFile?.videoUrl);
  const activeThumbnail = uploadedFile?.thumbnailUrl || existingThumbnailUrl;

  return (
    <>
      <div className={`voice-upload-zone ${compact ? "compact" : ""}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={handleInputChange}
          className="hidden-input"
        />

        {activeVideo || activeThumbnail ? (
          <div className="preview">
            {activeVideo ? (
              <video src={activeVideo} className="preview-media" controls muted />
            ) : activeThumbnail ? (
              <img src={activeThumbnail} alt="Uploaded thumbnail" className="preview-media" />
            ) : null}
            <div className="preview-info">
              <span className="preview-name">{uploadedFile?.name || "Uploaded media"}</span>
              <button className="clear-button" onClick={handleClear}>
                ✕ Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`dropzone ${isDragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            {isUploading ? (
              <>
                <div className="spinner" />
                <span className="dropzone-text">Uploading... {uploadProgress}%</span>
              </>
            ) : uploadProgress > 0 && uploadProgress < 100 ? (
              <>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="dropzone-text">Uploading... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <span className="dropzone-icon">↑</span>
                <span className="dropzone-text">Drop video or image, or click to upload</span>
                <span className="dropzone-subtext">mp4, webm, mov • jpg, png, webp</span>
              </>
            )}
          </div>
        )}

        {error && <div className="error">⚠ {error}</div>}
      </div>

      <style jsx>{`
        .voice-upload-zone {
          width: 100%;
        }

        .hidden-input {
          display: none;
        }

        .dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 32px 20px;
          border: 1px dashed rgba(202, 165, 84, 0.3);
          background: rgba(10, 9, 8, 0.4);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dropzone:hover,
        .dropzone.dragging {
          border-color: var(--gold, #caa554);
          background: rgba(202, 165, 84, 0.05);
        }

        .dropzone.uploading {
          cursor: wait;
          pointer-events: none;
        }

        .dropzone-icon {
          font-size: 24px;
          color: var(--gold, #caa554);
          opacity: 0.6;
        }

        .dropzone-text {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 11px;
          letter-spacing: 0.05em;
          color: rgba(236, 227, 214, 0.7);
          text-align: center;
        }

        .dropzone-subtext {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.4);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(202, 165, 84, 0.3);
          border-top-color: var(--gold, #caa554);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .progress-bar {
          width: 100%;
          max-width: 200px;
          height: 4px;
          background: rgba(202, 165, 84, 0.2);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--gold, #caa554);
          transition: width 0.2s ease;
        }

        .preview {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          border: 1px solid rgba(202, 165, 84, 0.2);
          background: rgba(10, 9, 8, 0.4);
        }

        .preview-media {
          width: 100%;
          max-height: 200px;
          object-fit: contain;
          background: #050403;
        }

        .preview-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .preview-name {
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 10px;
          color: rgba(236, 227, 214, 0.6);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .clear-button {
          flex-shrink: 0;
          padding: 4px 10px;
          background: transparent;
          border: 1px solid rgba(202, 165, 84, 0.3);
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(202, 165, 84, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          border-color: var(--gold, #caa554);
          color: var(--gold, #caa554);
        }

        .error {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.3);
          font-family: var(--font-mono, "PT Mono", monospace);
          font-size: 10px;
          color: #ff6b35;
        }

        /* Compact mode */
        .voice-upload-zone.compact .dropzone {
          padding: 16px 12px;
        }

        .voice-upload-zone.compact .dropzone-icon {
          font-size: 18px;
        }

        .voice-upload-zone.compact .dropzone-text {
          font-size: 10px;
        }

        .voice-upload-zone.compact .preview-media {
          max-height: 120px;
        }
      `}</style>
    </>
  );
}
