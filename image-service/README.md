# Image Processing Microservice

Python Flask microservice for processing camera RAW files and creating thumbnails.

## Features

- Convert RAW formats (.cr2, .cr3, .arw, .nef, .raf, .dng, .rw2) to JPG
- Support regular image formats (JPG, PNG, WEBP)
- Auto-generate thumbnails (320px height, auto width)
- JWT authentication
- Single & multiple file upload
- Health check endpoint

## Installation

### Option 1: Local Development

```bash
cd image-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

### Option 2: Docker

```bash
cd image-service

# Build image
docker build -t image-service .

# Run container
docker run -p 5000:5000 --env-file .env image-service
```

## API Endpoints

### Health Check

```
GET /health
```

### Upload Single Image

```
POST /upload/single
Headers: Authorization: Bearer <JWT_TOKEN>
Body: FormData with 'file' field
```

### Upload Multiple Images

```
POST /upload/multiple
Headers: Authorization: Bearer <JWT_TOKEN>
Body: FormData with 'files' field (multiple)
```

### Serve Files

```
GET /uploads/originals/<filename>
GET /uploads/thumbnails/<filename>
```

## Configuration

Edit `.env` file:

```env
FLASK_PORT=5000
UPLOAD_FOLDER=./uploads
THUMBNAIL_HEIGHT=320
MAX_FILE_SIZE=104857600
ALLOWED_RAW_EXTENSIONS=cr2,cr3,arw,nef,raf,dng,rw2
ALLOWED_IMAGE_EXTENSIONS=jpg,jpeg,png,webp
JWT_SECRET=your_jwt_secret
```

## Response Format

### Success

```json
{
  "success": true,
  "data": {
    "original": "/uploads/originals/abc123.jpg",
    "thumbnail": "/uploads/thumbnails/abc123_thumb.jpg",
    "filename": "abc123.jpg"
  }
}
```

### Error

```json
{
  "error": "Error message"
}
```

## Supported Formats

### RAW Formats

- Canon: .cr2, .cr3
- Sony: .arw
- Nikon: .nef
- Fujifilm: .raf
- Adobe: .dng
- Panasonic: .rw2

### Image Formats

- JPEG: .jpg, .jpeg
- PNG: .png
- WebP: .webp
