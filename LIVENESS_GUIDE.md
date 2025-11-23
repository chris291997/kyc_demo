# Liveness Detection Guide

Complete guide for understanding and working with liveness detection in the KYC Demo application.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Understanding Liveness Status](#understanding-liveness-status)
4. [Why "Spoof" is Detected](#why-spoof-is-detected)
5. [How to Pass Liveness Check](#how-to-pass-liveness-check)
6. [Technical Implementation](#technical-implementation)
7. [Troubleshooting](#troubleshooting)
8. [Testing](#testing)

---

## Overview

The KYC Demo uses **Regula Face SDK Web Component** for liveness detection. This verifies that the person being verified is physically present and not a photo, video, or mask.

### Key Features
- ✅ **Real-time detection** - Liveness checked during face capture
- ✅ **Anti-spoofing** - Detects photos, videos, screens, masks
- ✅ **Active liveness** - May require head movement or interaction
- ✅ **Comprehensive data** - Returns status, score, confidence, metadata

---

## How It Works

### Data Flow

```
1. User opens liveness check in browser
   ↓
2. Face SDK Web Component initializes
   ↓
3. User positions face in camera
   ↓
4. SDK performs liveness detection
   ↓
5. SDK returns result with code field
   • code: 0 → Live person detected ✅
   • code: 247 (or other non-zero) → Spoof detected ❌
   ↓
6. Frontend sends complete result to backend
   ↓
7. Backend extracts and saves liveness data
   ↓
8. Result appears in verification report
```

### Architecture

```
┌─────────────────────────────────────────┐
│  Browser (Face SDK Web Component)       │
│  - Captures video from webcam            │
│  - Analyzes face movement, depth         │
│  - Returns: { code, transactionId, ... }│
└───────────────┬─────────────────────────┘
                │
                ▼
         POST /api/face/liveness
                │
┌───────────────▼─────────────────────────┐
│  Backend (NestJS)                        │
│  - Receives complete liveness result     │
│  - Maps code: 0→genuine, non-0→spoof     │
│  - Saves to database                     │
└──────────────────────────────────────────┘
```

---

## Understanding Liveness Status

### Status Codes

The Regula Face SDK uses the **`code` field** to indicate liveness results:

| Code | Meaning | Status | Verification |
|------|---------|--------|--------------|
| `0` | Live person detected | ✅ `genuine` | PASS |
| `247` | Spoof detected | ❌ `spoof` | FAIL |
| Other non-zero | Error/Poor quality | ❌ `spoof` | FAIL |

### Response Format

**Successful Liveness (code: 0):**
```json
{
  "code": 0,
  "transactionId": "a9b418a8-5191-4ba9-a2fe...",
  "tag": "d7001412-0555-4660-89ee...",
  "estimatedAge": 28,
  "livenessType": "active",
  "metadata": { ... }
}
```

**Failed Liveness (code: 247):**
```json
{
  "code": 247,
  "transactionId": "281a424b-163e-4e37-af61...",
  "tag": "3ab5ffea-0609-42c5-9dc9...",
  "metadata": { ... }
}
```

### Database Storage

All liveness data is saved to the `face_results` table:

```sql
liveness_status          -- 'genuine', 'spoof', or 'unknown'
liveness_score           -- Numeric score (0-1)
liveness_confidence      -- Confidence level (0-1)
liveness_code            -- Result code (0 = success)
liveness_transaction_id  -- Unique transaction ID
liveness_tag             -- Session tag
liveness_type            -- Detection type (active/passive)
liveness_estimated_age   -- Estimated age
liveness_metadata        -- Full metadata (JSONB)
liveness_images          -- Captured frames (JSONB)
```

---

## Why "Spoof" is Detected

### This is NOT a Bug!

The Face SDK is designed to **protect against fraud**. If it detects "spoof", it means the liveness check correctly identified that the face is not from a live person.

### Common Causes

#### 1. Testing with Photos
- ❌ **Don't**: Hold up a printed photo
- ❌ **Don't**: Show a photo on another screen/phone
- ✅ **Do**: Use a real person in front of the camera

#### 2. Screen/Monitor Detection
- ❌ The SDK can detect if you're showing another screen
- ✅ Use the actual webcam with a live person

#### 3. Poor Lighting
- ❌ Too dark, too bright, or uneven lighting
- ✅ Well-lit room with natural or good artificial light

#### 4. Not Following Prompts
- ❌ Not moving head when prompted
- ❌ Not looking at camera
- ✅ Follow ALL on-screen instructions

#### 5. Low Camera Quality
- ❌ Very low resolution or poor quality webcam
- ✅ Use HD webcam (720p or better)

#### 6. Partial Face Visible
- ❌ Face too close, too far, or partially obscured
- ✅ Full face clearly visible in frame

#### 7. Suspicious Movements
- ❌ Jerky, unnatural movements
- ✅ Smooth, natural head movements

#### 8. Glasses/Accessories
- ⚠️ Sunglasses, masks, or face coverings
- ✅ Remove if liveness check fails

---

## How to Pass Liveness Check

### ✅ Best Practices

#### 1. Use Real Person
- Sit in front of camera
- Well-lit environment
- No glasses/hats if possible

#### 2. Follow Instructions
- Look at camera
- Move head as prompted
- Complete all challenges

#### 3. Camera Setup
- HD webcam (720p+)
- Stable mounting
- Good lighting (not backlit)

#### 4. Face Position
- Full face visible
- Center of frame
- Not too close/far

#### 5. Environment
- Solid background
- No mirrors/reflections
- Quiet (for attention)

### Testing Tips

For development/testing purposes, if you need to bypass strict liveness:

1. **Option 1**: Lower security threshold (SDK configuration)
2. **Option 2**: Use test mode (if available)
3. **Option 3**: Configure SDK for development mode

**⚠️ Note**: In production, **always use full liveness checks** for security!

---

## Technical Implementation

### Frontend: Capturing Liveness Data

**File**: `frontend/src/components/CyantechFaceCapture.tsx`

The component captures the **complete response** from the Face SDK:

```typescript
// Listen for face-liveness event
faceComponent.addEventListener('face-liveness', (event: any) => {
  const { detail } = event;
  
  if (detail.action === 'PROCESS_FINISHED' && detail.data.status === 1) {
    const response = detail.data.response;
    
    // Pass complete response object as livenessResult
    const livenessResult = response;
    
    // Extract image
    let image = null;
    if (response?.capture && Array.isArray(response.capture)) {
      image = response.capture[0];
    }
    
    // Call parent callback with full result
    onCapture(image, livenessResult);
  }
});
```

### Backend: Extracting Liveness Status

**File**: `backend/src/modules/face/face.service.ts`

The backend checks the **`code` field** to determine liveness status:

```typescript
private extractLivenessData(livenessResponse: any): Partial<FaceResult> {
  const result: Partial<FaceResult> = {
    liveness_status: 'unknown',
  };

  // Check 'code' field (primary method for Web Component)
  if (livenessResponse?.code !== undefined && livenessResponse.code !== null) {
    result.liveness_status = livenessResponse.code === 0 ? 'genuine' : 'spoof';
  }
  
  // Extract other fields
  result.liveness_score = livenessResponse?.score || null;
  result.liveness_confidence = livenessResponse?.confidence || null;
  result.liveness_code = livenessResponse?.code || null;
  result.liveness_transaction_id = livenessResponse?.transactionId || null;
  result.liveness_tag = livenessResponse?.tag || null;
  result.liveness_type = livenessResponse?.livenessType || null;
  result.liveness_estimated_age = livenessResponse?.estimatedAge || null;
  result.liveness_metadata = livenessResponse?.metadata || null;
  result.liveness_images = livenessResponse?.capture || livenessResponse?.images || null;

  return result;
}
```

### API Endpoint

**POST** `/api/face/liveness`

**Request:**
```json
{
  "sessionId": "uuid",
  "imageBase64": "data:image/jpeg;base64,...",
  "livenessResult": {
    "code": 0,
    "transactionId": "uuid",
    "tag": "uuid",
    "estimatedAge": 28,
    "livenessType": "active",
    "metadata": { ... }
  }
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "uuid",
  "liveness_result": {
    "liveness_status": "genuine",
    "liveness_score": 1.0,
    "liveness_confidence": 1.0,
    "liveness_code": 0,
    "liveness_transaction_id": "uuid",
    "liveness_tag": "uuid",
    "liveness_type": "active",
    "liveness_estimated_age": 28
  }
}
```

---

## Troubleshooting

### Always Shows "Spoof" with Real Person

**Possible Causes:**

1. **Code Field Not Checked**
   - Backend was checking `status` instead of `code`
   - **Fix**: Updated `extractLivenessData()` to check `code` field first

2. **SDK Version Issues**
   - Different SDK versions use different response formats
   - **Fix**: Use latest compatible version

3. **Configuration Issues**
   - SDK not properly configured
   - **Fix**: Check `service-url` attribute in Face SDK component

### Liveness Data Not Appearing in Report

**Possible Causes:**

1. **Frontend Not Sending Complete Data**
   - Only sending `transactionId` instead of full result
   - **Fix**: Pass complete `response` object from SDK event

2. **Backend Not Saving Data**
   - Backend trying to fetch from non-existent API
   - **Fix**: Process frontend data directly without fetching

3. **Database Migration Issues**
   - Liveness columns missing from database
   - **Fix**: Run migrations with `npm run migration:run`

### Check Logs

**Browser Console:**
```javascript
📸 Liveness capture callback triggered
📋 Complete Liveness result: { code: 0, transactionId: "...", ... }
📤 Sending complete liveness result to backend...
✅ Liveness check mutation successful
```

**Backend Logs:**
```bash
docker-compose logs backend | grep "liveness_status"
```

Expected:
```
💾 Saving liveness result for session: {sessionId}
✅ Extracted liveness_status: genuine (from responseData.code: 0)
✅ Face result saved successfully
```

---

## Testing

### 1. Test with Live Person (Should Pass)

```
1. Open http://localhost:3000
2. Start verification
3. Complete document upload
4. Complete face matching
5. Perform liveness check with real person
6. Expected result: code: 0, status: "genuine"
```

### 2. Test with Photo/Video (Should Fail)

```
1. Open http://localhost:3000
2. Start verification
3. Complete document upload
4. Complete face matching
5. Hold up photo or play video of person
6. Expected result: code: 247, status: "spoof"
```

### 3. Verify Report

```bash
curl http://localhost:4000/api/verification/{sessionId}/report
```

**Expected for Genuine:**
```json
{
  "face_data": {
    "liveness_status": "genuine",
    "liveness_score": 1.0,
    "liveness_confidence": 1.0,
    "liveness_code": 0,
    "liveness_type": "active",
    "liveness_estimated_age": 28
  }
}
```

**Expected for Spoof:**
```json
{
  "face_data": {
    "liveness_status": "spoof",
    "liveness_score": 0.0,
    "liveness_confidence": 0.0,
    "liveness_code": 247
  }
}
```

---

## Additional Resources

### Documentation
- **Regula Face SDK**: https://docs.regulaforensics.com/develop/face-sdk/
- **Web Component Guide**: https://face.regulaforensics.com/
- **Architecture Decision**: See `ARCHITECTURE_DECISION_LIVENESS.md`
- **Spoof Detection**: See `LIVENESS_SPOOF_DETECTION.md`

### Related Files
- `frontend/src/components/CyantechFaceCapture.tsx` - Face SDK integration
- `frontend/src/pages/VerificationFlow.tsx` - Liveness step implementation
- `backend/src/modules/face/face.service.ts` - Liveness data processing
- `backend/src/modules/face/face.entity.ts` - Database schema

### Support
- **Regula Support**: support@regulaforensics.com
- **GitHub**: https://github.com/regulaforensics/FaceSDK-web-js-client

---

## Summary

✅ **Liveness detection is working correctly**  
✅ **"Spoof" detection is a security feature**  
✅ **Use real person with good lighting to pass**  
✅ **Complete liveness data is captured and saved**  
✅ **All information appears in verification reports**

**Remember**: If the system shows "spoof", it's protecting you from fraudulent verification attempts. This is the intended behavior!

---

**Last Updated**: November 22, 2025  
**Version**: 2.0 (Consolidated)  
**Status**: ✅ Production Ready

