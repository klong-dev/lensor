# Google Cloud Vision Integration - NSFW Detection

## Overview

This module integrates Google Cloud Vision SafeSearch API to detect NSFW (Not Safe For Work) content in post images automatically.

## Features

- ✅ Automatic NSFW detection when creating/updating posts
- ✅ SafeSearch analysis for adult, violence, and racy content
- ✅ Non-blocking async processing (doesn't slow down API responses)
- ✅ Graceful fallback if Vision API is not configured
- ✅ `isNSFW` field in all post responses

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the **Cloud Vision API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details:
   - Name: `vision-api-service`
   - Role: `Cloud Vision API User`
4. Click "Done"

### 3. Download Credentials JSON

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose **JSON** format
5. Save the downloaded file as `google-credentials.json` in project root

### 4. Configure Environment Variable

Add to your `.env.local` file:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

Or use absolute path:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/google-credentials.json
```

### 5. Restart Server

```bash
npm run start:dev
```

Check logs for:
```
[VisionService] Google Cloud Vision initialized successfully
```

## How It Works

### Post Creation Flow

1. User creates post with image
2. Post is saved immediately (fast response)
3. Vision API checks image in background
4. `isNSFW` field is updated asynchronously

### NSFW Detection Logic

Image is marked as NSFW if:
- **Adult content**: LIKELY or VERY_LIKELY
- **Violence**: LIKELY or VERY_LIKELY
- **Racy content**: VERY_LIKELY

SafeSearch levels:
- `UNKNOWN`: Unknown
- `VERY_UNLIKELY`: Very unlikely
- `UNLIKELY`: Unlikely
- `POSSIBLE`: Possible
- `LIKELY`: Likely ⚠️
- `VERY_LIKELY`: Very likely ⚠️

## API Response Format

### GET /posts

```json
{
  "data": [
    {
      "id": "post-id",
      "title": "Post title",
      "imageUrl": "https://...",
      "isNSFW": false,
      "user": {...},
      "voteCount": 10,
      "commentCount": 5
    }
  ]
}
```

### GET /posts/:id

```json
{
  "data": {
    "id": "post-id",
    "title": "Post title",
    "imageUrl": "https://...",
    "isNSFW": true,
    "user": {...},
    "voteCount": 10,
    "commentCount": 5
  }
}
```

## Database Migration

Run migration to add `is_nsfw` column:

```sql
ALTER TABLE posts ADD COLUMN is_nsfw BOOLEAN DEFAULT FALSE;
```

Or use TypeORM:

```bash
npm run typeorm migration:generate -- -n AddIsNSFWToPost
npm run typeorm migration:run
```

## Testing

### Without API Key (Development)

If `GOOGLE_APPLICATION_CREDENTIALS` is not set:
- `isNSFW` will default to `false`
- Warning logged: "Vision API disabled, skipping NSFW check"
- Posts work normally

### With API Key (Production)

1. Create test post with safe image
2. Check `isNSFW` should be `false`
3. Create test post with NSFW image
4. Check `isNSFW` should be `true`

### Manual NSFW Check

```typescript
// In your service
const isNSFW = await this.visionService.checkImageNSFW(imageUrl);

// Get detailed annotation
const annotation = await this.visionService.getSafeSearchAnnotation(imageUrl);
// Returns: { adult, violence, racy, medical, spoof }
```

## Cost Considerations

**Google Cloud Vision Pricing** (as of 2024):
- First 1,000 requests/month: **FREE**
- 1,001 - 5,000,000: $1.50 per 1,000 images
- 5,000,001+: $0.60 per 1,000 images

**Optimization tips**:
- Only check images, not text posts
- Cache results to avoid re-checking same image
- Use async processing (already implemented)

## Troubleshooting

### "Vision API disabled" warning

**Cause**: `GOOGLE_APPLICATION_CREDENTIALS` not set

**Solution**: 
1. Download credentials JSON
2. Set env variable
3. Restart server

### "Permission denied" error

**Cause**: Service account lacks Vision API permissions

**Solution**:
1. Go to IAM & Admin
2. Add role: "Cloud Vision API User"
3. Save changes

### Images not being checked

**Check logs** for errors:
```
[VisionService] Error checking NSFW for <url>: <error>
```

**Common issues**:
- Image URL not accessible
- Network timeout (default: 10s)
- Invalid image format

## Security Notes

⚠️ **Important**:
- Keep `google-credentials.json` secret
- Add to `.gitignore`
- Never commit credentials to repository
- Use different credentials for dev/prod

## Future Enhancements

Potential improvements:
- [ ] Batch processing for multiple images
- [ ] Cache SafeSearch results
- [ ] Admin dashboard to review flagged content
- [ ] User appeal system for false positives
- [ ] Filter NSFW posts in feed (client-side)
- [ ] Email notifications for flagged content

## Support

For issues, contact the development team or check:
- [Google Cloud Vision Docs](https://cloud.google.com/vision/docs)
- [SafeSearch API Reference](https://cloud.google.com/vision/docs/detecting-safe-search)
