# SAM Segmenter Service

FastAPI service for automatic image segmentation using Meta's [Segment Anything Model (SAM)](https://github.com/facebookresearch/segment-anything).

## Overview

This service provides an HTTP API for segmenting UI reference images into distinct components. It's designed to work with the Thoughtform Survey system, extracting UI elements that can be labeled and embedded for semantic search.

## Quick Start

### 1. Download SAM Checkpoint

Download one of the SAM model checkpoints:

| Model   | Size  | Download                                                                                     |
| ------- | ----- | -------------------------------------------------------------------------------------------- |
| `vit_h` | 2.4GB | [sam_vit_h_4b8939.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth) |
| `vit_l` | 1.2GB | [sam_vit_l_0b3195.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth) |
| `vit_b` | 375MB | [sam_vit_b_01ec64.pth](https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth) |

Place the checkpoint in the `checkpoints/` directory:

```bash
mkdir -p checkpoints
curl -L -o checkpoints/sam_vit_b.pth https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth
```

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install SAM from GitHub
pip install git+https://github.com/facebookresearch/segment-anything.git
```

### 3. Run the Service

```bash
# Set environment variables
export SAM_MODEL_TYPE=vit_b
export SAM_CHECKPOINT_PATH=checkpoints/sam_vit_b.pth

# Run with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

### `GET /health`

Check service health and model status.

**Response:**

```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "vit_b"
}
```

### `POST /segment`

Segment an image into distinct regions.

**Request:**

```json
{
  "image_url": "https://example.com/signed-url-to-image.png",
  "points_per_side": 32,
  "pred_iou_thresh": 0.88,
  "stability_score_thresh": 0.95,
  "min_mask_region_area": 100
}
```

**Response:**

```json
{
  "success": true,
  "image_width": 1920,
  "image_height": 1080,
  "segment_count": 24,
  "segments": [
    {
      "id": 0,
      "area": 50000,
      "bbox": [100, 100, 400, 300],
      "predicted_iou": 0.95,
      "stability_score": 0.98,
      "crop_bbox": [90, 90, 420, 320]
    }
  ],
  "model_used": "vit_b"
}
```

## Docker Usage

### Build Image

```bash
docker build -t sam-segmenter .
```

### Run Container

```bash
# Mount the checkpoints directory
docker run -p 8001:8001 \
  -v $(pwd)/checkpoints:/app/checkpoints \
  -e SAM_MODEL_TYPE=vit_b \
  sam-segmenter
```

### Docker Compose (with NVIDIA GPU)

```yaml
version: "3.8"
services:
  sam-segmenter:
    build: .
    ports:
      - "8001:8001"
    volumes:
      - ./checkpoints:/app/checkpoints
    environment:
      - SAM_MODEL_TYPE=vit_b
      - SAM_CHECKPOINT_PATH=/app/checkpoints/sam_vit_b.pth
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## Integration with Thoughtform

The service is called from the Next.js API route at `/api/survey/segments/generate`:

1. Next.js creates a signed URL for the survey item image
2. Calls this service with the signed URL
3. Receives segment bounding boxes and scores
4. Stores segments in `survey_segments` table
5. (Future) Generates labels for each segment using Claude

## Configuration

| Environment Variable  | Default                      | Description                                 |
| --------------------- | ---------------------------- | ------------------------------------------- |
| `SAM_MODEL_TYPE`      | `vit_b`                      | Model variant: `vit_h`, `vit_l`, or `vit_b` |
| `SAM_CHECKPOINT_PATH` | `checkpoints/sam_{type}.pth` | Path to model checkpoint                    |
| `PORT`                | `8001`                       | Service port                                |

## Performance Notes

- **GPU Recommended**: SAM runs much faster on CUDA-enabled GPUs
- **Memory**: `vit_b` requires ~2GB VRAM, `vit_h` requires ~8GB
- **First Request**: Model loads on first request (or startup if lifespan is used)
- **Typical Latency**: 1-5 seconds per image depending on size and hardware

## Troubleshooting

### Model not loading

- Verify checkpoint file exists and matches `SAM_MODEL_TYPE`
- Check CUDA availability: `python -c "import torch; print(torch.cuda.is_available())"`

### Out of memory

- Use smaller model (`vit_b` instead of `vit_h`)
- Reduce `points_per_side` in request
- Resize large images before sending

### Slow performance

- Ensure CUDA is being used (check logs for "Using device: cuda")
- Consider pre-loading model on service startup
