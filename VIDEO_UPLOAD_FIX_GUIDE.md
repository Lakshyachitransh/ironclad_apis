# Video Upload - Audio Only Issue - Troubleshooting Guide

## Problem
Video uploads are playing audio but not displaying video content.

## Root Causes Fixed

### 1. **S3 Cache-Control Header in Wrong Location** ✅ FIXED
**Issue**: The `Cache-Control` header was placed in the S3 `Metadata` object instead of as a direct parameter.
```typescript
// ❌ WRONG (before)
Metadata: {
  'Cache-Control': 'max-age=31536000', // This is not a valid S3 parameter
}

// ✅ CORRECT (after)
CacheControl: 'max-age=31536000', // Direct parameter
```
**Impact**: This could cause S3 to return incorrect headers when serving the video.

### 2. **Incorrect MIME Type Detection** ✅ FIXED
**Issue**: The upload was strictly validating MIME types, but some systems (especially Windows/multipart uploads) detect MP4 files as `application/octet-stream`.
**Solution**: Now falls back to `video/mp4` if MIME type is not recognized but file extension is valid.

### 3. **Content-Type Not Set If MIME Type Fails** ✅ FIXED
**Issue**: If the MIME type detection failed, S3 would store the file without proper Content-Type.
**Solution**: S3 service now ensures video files always have `video/mp4` Content-Type.

## Verification Steps

### Step 1: Check S3 Object Metadata
```bash
# Using AWS CLI
aws s3api head-object \
  --bucket YOUR_BUCKET \
  --key videos/YOUR_COURSE_ID/YOUR_FILE.mp4 \
  --region YOUR_REGION

# Verify output includes:
# "ContentType": "video/mp4"
# "CacheControl": "max-age=31536000"
```

### Step 2: Verify Video File Integrity
```bash
# Check if video has both audio and video streams
ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of csv=p=0 YOUR_VIDEO.mp4
# Should output: video

ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 YOUR_VIDEO.mp4
# Should output: audio
```

### Step 3: Test the Upload with Diagnostics
```bash
# Run the test script
npx ts-node test-video-upload.ts /path/to/your/video.mp4

# This will:
# 1. Upload the video
# 2. Verify the response
# 3. Check S3 headers (Content-Type, Cache-Control, etc.)
```

### Step 4: Browser Network Tab Debugging
1. Open your browser's Developer Tools (F12)
2. Go to Network tab
3. Upload a video
4. Click on the video URL in the network requests
5. Check the Response Headers for:
   - `Content-Type: video/mp4` (must be video/*)
   - `Content-Length: [size]`
   - `Cache-Control: max-age=31536000`

## Common Issues and Solutions

### Issue: Audio plays but video doesn't display
**Common Causes**:
1. ❌ Content-Type is `application/octet-stream` → FIXED by auto-detection
2. ❌ Video file is corrupted or missing video stream → Check with ffprobe
3. ❌ Browser doesn't support the codec → Try converting to H.264
4. ❌ CORS issues on S3 → Configure bucket CORS policy

### Issue: "Invalid video format" error on upload
**Solution**: 
- Make sure file has correct extension (.mp4, .webm, .mov, .avi, .mkv)
- File must be a valid video file
- Check server logs for detailed error

### Issue: Video URL returns 403 Forbidden
**Solution**:
- Presigned URL may have expired
- Check S3 credentials and permissions
- Verify bucket policy allows GetObject for the file

## S3 Bucket CORS Configuration (if needed)

If you're streaming videos cross-origin, configure CORS:

```json
[
  {
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

## Testing the Fix

### Test 1: Upload a pure video file (no audio)
```bash
# Create a test video with video stream only
ffmpeg -f lavfi -i testsrc=duration=10:size=320x240:rate=30 test-video-only.mp4

# Upload and verify audio/video both play (audio should fail gracefully)
```

### Test 2: Upload with audio
```bash
# Create a test video with both audio and video
ffmpeg -f lavfi -i testsrc=duration=10:size=320x240:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=10 \
       -c:v libx264 -c:a aac test-video-audio.mp4

# Upload and verify both audio and video play
```

### Test 3: Check Server Logs
```bash
# Look for logs like:
# "[Video Upload] Uploading to S3: { ... }"
# "[S3Service] File uploaded successfully: videos/... with Content-Type: video/mp4"
# "[Video Upload] Video uploaded successfully: { ... }"
```

## Configuration

### Environment Variables
```env
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Supported Video Formats
- **MP4** (.mp4) - video/mp4
- **WebM** (.webm) - video/webm
- **MOV** (.mov) - video/quicktime
- **AVI** (.avi) - video/x-msvideo
- **MKV** (.mkv) - detected from extension

## Additional Resources

### ffmpeg Commands for Video Verification
```bash
# Check video codec
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name YOUR_VIDEO.mp4

# Check audio codec and channels
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,channels YOUR_VIDEO.mp4

# Get full stream information
ffmpeg -i YOUR_VIDEO.mp4 2>&1 | grep -E "Duration|Stream"

# Convert to H.264 (browser-safe)
ffmpeg -i input.mp4 -c:v libx264 -preset medium -c:a aac output.mp4
```

### AWS S3 Debugging
```bash
# List objects in bucket with metadata
aws s3api list-objects-v2 --bucket YOUR_BUCKET --prefix videos/

# Get object metadata
aws s3api head-object --bucket YOUR_BUCKET --key videos/path/to/file.mp4

# Get object tagging
aws s3api get-object-tagging --bucket YOUR_BUCKET --key videos/path/to/file.mp4
```

## Summary of Changes

| Component | Issue | Fix |
|-----------|-------|-----|
| s3.service.ts | Cache-Control in Metadata | Moved to CacheControl parameter |
| s3.service.ts | No fallback for MIME type | Default to video/mp4 for video files |
| courses.service.ts | Strict MIME type validation | Check both MIME type and file extension |
| courses.service.ts | No logging | Added comprehensive debug logging |

## Next Steps

1. ✅ Deploy the updated code
2. ✅ Run `test-video-upload.ts` to verify
3. ✅ Upload test videos and check browser network tab
4. ✅ Monitor server logs for any warnings
5. ✅ Test with various video formats and sizes
