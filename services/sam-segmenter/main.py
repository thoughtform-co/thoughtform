"""
Segment Anything Model (SAM) Segmentation Service
FastAPI service for automatic image segmentation using Meta's SAM model.

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""

import os
import io
import base64
import logging
from typing import Optional
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model storage
sam_model = None
mask_generator = None


# ═══════════════════════════════════════════════════════════════
# MODELS - Request/Response schemas
# ═══════════════════════════════════════════════════════════════


class SegmentRequest(BaseModel):
    """Request body for segmentation endpoint."""

    image_url: str = Field(..., description="Signed URL to the source image")
    points_per_side: int = Field(
        default=32, ge=8, le=64, description="Points per side for automatic mask generation"
    )
    pred_iou_thresh: float = Field(
        default=0.88, ge=0.5, le=1.0, description="IoU threshold for filtering masks"
    )
    stability_score_thresh: float = Field(
        default=0.95, ge=0.5, le=1.0, description="Stability score threshold"
    )
    min_mask_region_area: int = Field(
        default=100, ge=0, description="Minimum mask area in pixels"
    )


class SegmentMask(BaseModel):
    """A single segmentation mask result."""

    id: int
    area: int
    bbox: list[int]  # [x, y, width, height]
    predicted_iou: float
    stability_score: float
    # RLE-encoded mask or base64 PNG
    mask_rle: Optional[str] = None
    mask_png_base64: Optional[str] = None
    crop_bbox: list[int]  # [x, y, width, height] for the crop box


class SegmentResponse(BaseModel):
    """Response from segmentation endpoint."""

    success: bool
    image_width: int
    image_height: int
    segment_count: int
    segments: list[SegmentMask]
    model_used: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    model_loaded: bool
    model_type: Optional[str] = None


# ═══════════════════════════════════════════════════════════════
# MODEL LOADING
# ═══════════════════════════════════════════════════════════════


def load_sam_model():
    """Load the Segment Anything Model."""
    global sam_model, mask_generator

    try:
        from segment_anything import sam_model_registry, SamAutomaticMaskGenerator

        # Check for model checkpoint
        model_type = os.environ.get("SAM_MODEL_TYPE", "vit_b")
        checkpoint_path = os.environ.get(
            "SAM_CHECKPOINT_PATH", f"checkpoints/sam_{model_type}.pth"
        )

        if not os.path.exists(checkpoint_path):
            logger.warning(
                f"SAM checkpoint not found at {checkpoint_path}. "
                "Download from https://github.com/facebookresearch/segment-anything#model-checkpoints"
            )
            return False

        logger.info(f"Loading SAM model type={model_type} from {checkpoint_path}")

        # Determine device
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")

        # Load model
        sam = sam_model_registry[model_type](checkpoint=checkpoint_path)
        sam.to(device)

        sam_model = sam
        mask_generator = SamAutomaticMaskGenerator(
            model=sam,
            points_per_side=32,
            pred_iou_thresh=0.88,
            stability_score_thresh=0.95,
            min_mask_region_area=100,
        )

        logger.info("SAM model loaded successfully")
        return True

    except ImportError:
        logger.error(
            "segment_anything not installed. Run: pip install git+https://github.com/facebookresearch/segment-anything.git"
        )
        return False
    except Exception as e:
        logger.error(f"Failed to load SAM model: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler for loading model on startup."""
    logger.info("Starting SAM Segmenter service...")
    load_sam_model()
    yield
    logger.info("Shutting down SAM Segmenter service...")


# ═══════════════════════════════════════════════════════════════
# FASTAPI APP
# ═══════════════════════════════════════════════════════════════


app = FastAPI(
    title="SAM Segmenter",
    description="Segment Anything Model service for UI element extraction",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check service health and model status."""
    return HealthResponse(
        status="healthy",
        model_loaded=sam_model is not None,
        model_type=os.environ.get("SAM_MODEL_TYPE", "vit_b") if sam_model else None,
    )


@app.post("/segment", response_model=SegmentResponse)
async def segment_image(request: SegmentRequest):
    """
    Segment an image using SAM's automatic mask generator.

    Returns all detected segments with their bounding boxes, areas, and scores.
    """
    global mask_generator

    if mask_generator is None:
        raise HTTPException(
            status_code=503,
            detail="SAM model not loaded. Check server logs for checkpoint path issues.",
        )

    try:
        # Download image from signed URL
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(request.image_url)
            response.raise_for_status()
            image_bytes = response.content

        # Load image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        width, height = image.size
        logger.info(f"Processing image: {width}x{height}")

        # Update mask generator parameters
        mask_generator.points_per_side = request.points_per_side
        mask_generator.pred_iou_thresh = request.pred_iou_thresh
        mask_generator.stability_score_thresh = request.stability_score_thresh
        mask_generator.min_mask_region_area = request.min_mask_region_area

        # Generate masks
        masks = mask_generator.generate(image_np)

        # Sort by area (largest first)
        masks = sorted(masks, key=lambda x: x["area"], reverse=True)

        # Convert to response format
        segments = []
        for idx, mask_data in enumerate(masks):
            # Get bounding box [x, y, w, h]
            bbox = mask_data["bbox"]

            # Create crop bbox with padding
            padding = 10
            crop_x = max(0, bbox[0] - padding)
            crop_y = max(0, bbox[1] - padding)
            crop_w = min(width - crop_x, bbox[2] + 2 * padding)
            crop_h = min(height - crop_y, bbox[3] + 2 * padding)

            # Encode mask as base64 PNG (optional - can be large)
            mask_png_base64 = None
            # Uncomment to include mask images:
            # mask_img = Image.fromarray((mask_data["segmentation"] * 255).astype(np.uint8))
            # buffer = io.BytesIO()
            # mask_img.save(buffer, format="PNG")
            # mask_png_base64 = base64.b64encode(buffer.getvalue()).decode()

            segments.append(
                SegmentMask(
                    id=idx,
                    area=int(mask_data["area"]),
                    bbox=[int(x) for x in bbox],
                    predicted_iou=float(mask_data["predicted_iou"]),
                    stability_score=float(mask_data["stability_score"]),
                    mask_png_base64=mask_png_base64,
                    crop_bbox=[int(crop_x), int(crop_y), int(crop_w), int(crop_h)],
                )
            )

        logger.info(f"Generated {len(segments)} segments")

        return SegmentResponse(
            success=True,
            image_width=width,
            image_height=height,
            segment_count=len(segments),
            segments=segments,
            model_used=os.environ.get("SAM_MODEL_TYPE", "vit_b"),
        )

    except httpx.RequestError as e:
        logger.error(f"Failed to fetch image: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
    except Exception as e:
        logger.exception("Segmentation failed")
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")


# ═══════════════════════════════════════════════════════════════
# DEVELOPMENT SERVER
# ═══════════════════════════════════════════════════════════════


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)

