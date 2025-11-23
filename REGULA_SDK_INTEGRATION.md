# Regula SDK Integration Guide

Complete integration guide for using Regula Document Reader and Face SDK with your KYC Demo application.

## 🎯 Overview

This application integrates **Regula's official SDKs** for both document and face capture:

### What We Use

| Component | Purpose | Features |
|-----------|---------|----------|
| **Regula Face SDK Web Components** | Face capture & liveness | ✅ Built-in liveness detection<br>✅ Face positioning guidance<br>✅ Quality checks<br>✅ Professional UI |
| **Regula Document Reader Web Components** | Document capture | ✅ Auto-detection<br>✅ Quality assessment<br>✅ Edge detection<br>✅ Glare detection |
| **Regula Face SDK Web Service** | Backend processing | ✅ Face comparison<br>✅ Liveness verification<br>✅ Face identification |
| **Regula Document Reader Web Service** | Backend processing | ✅ Document validation<br>✅ Data extraction<br>✅ Authenticity checks |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (React)                    │
│                                                       │
│  ┌─────────────────────┐  ┌──────────────────────┐  │
│  │ RegulaDocumentCapture│  │  RegulaFaceCapture  │  │
│  │  Web Component       │  │   Web Component     │  │
│  └──────────┬───────────┘  └──────────┬──────────┘  │
│             │                          │              │
│             │                          │              │
└─────────────┼──────────────────────────┼──────────────┘
              │                          │
              ▼                          ▼
┌──────────────────────────────────────────────────────┐
│              Backend API (NestJS)                     │
│                                                       │
│  /api/document/process    /api/face/liveness        │
│  /api/face/match                                     │
└─────────────┬────────────────────────┬───────────────┘
              │                        │
              ▼                        ▼
┌──────────────────────┐  ┌──────────────────────────┐
│  Document Reader     │  │    Face SDK Service      │
│   Web Service        │  │    (with Liveness)       │
│   Port: 8080         │  │    Port: 8081            │
└──────────────────────┘  └──────────────────────────┘
```

## 📦 Frontend Integration

### 1. Installed Packages

```json
{
  "@regulaforensics/vp-frontend-face-components": "^7.2.0",
  "@regulaforensics/vp-frontend-document-components": "^8.4.0"
}
```

### 2. Components Created

#### **RegulaDocumentCapture** (`frontend/src/components/RegulaDocumentCapture.tsx`)

Smart document capture component with:
- Automatic document detection
- Edge and boundary detection
- Quality assessment
- Glare and lighting checks
- Multi-page support

**Usage:**
```tsx
<RegulaDocumentCapture
  onCapture={(images) => handleDocumentCapture(images)}
  onClose={() => console.log('Camera closed')}
/>
```

**Events:**
- `document-captured` - Fired when document is captured
- `processing-complete` - Fired after backend processing
- `error` - Fired on capture/processing errors
- `close` - Fired when user closes camera

#### **RegulaFaceCapture** (`frontend/src/components/RegulaFaceCapture.tsx`)

Advanced face capture component with:
- **Built-in liveness detection**
- Face positioning guidance
- Quality checks (lighting, blur, angle)
- Real-time feedback

**Usage:**
```tsx
<RegulaFaceCapture
  onCapture={(image) => handleLivenessCheck(image)}
  onClose={() => console.log('Camera closed')}
/>
```

**Events:**
- `face-captured` - Fired when face is captured with liveness check
- `error` - Fired on capture/processing errors
- `close` - Fired when user closes camera

### 3. Updated Verification Flow

The `VerificationFlow` component now offers two modes:

**Document Capture:**
1. **Smart Camera** (Recommended) - Uses Regula Document Reader SDK
   - Automatic quality checks
   - Real-time guidance
   - Optimal capture detection

2. **File Upload** - Traditional upload
   - For pre-taken photos
   - Fallback option

**Face Capture:**
- **Always uses Regula Face SDK** for liveness and quality
- Built-in liveness detection during capture
- No need for separate liveness step

## 🔧 Configuration

### Frontend Configuration

The components automatically connect to your backend API:

```typescript
// Environment variable (already set in .env)
VITE_API_URL=http://127.0.0.1:4000

// Components use these endpoints:
- Document: ${VITE_API_URL}/api/document/process
- Face:     ${VITE_API_URL}/api/face/liveness
```

### Customization Options

Both components support customization:

```tsx
// Document Reader customization
<RegularDocumentCapture
  locale="en"           // Language
  theme="light"         // light | dark
  scenario="capture"    // capture mode
/>

// Face SDK customization
<RegulaFaceCapture
  locale="en"           // Language
  theme="light"         // light | dark
/>
```

## 🚀 Setup Instructions

### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install Regula SDK Web Components:
- `@regulaforensics/vp-frontend-face-components`
- `@regulaforensics/vp-frontend-document-components`

### Step 2: Download Face SDK Backend

```bash
# From project root
bash download-facesdk.sh
```

Follow the interactive script to download Face SDK Web Service (~1.1GB).

### Step 3: Build & Start Services

```bash
# Build Face SDK Docker image
docker-compose build regula-face

# Start all services
docker-compose up -d
```

### Step 4: Verify Integration

1. **Open Frontend:**
   ```
   http://127.0.0.1:3000
   ```

2. **Start Verification Process**

3. **Test Document Capture:**
   - Click "Use Camera" button
   - Allow camera permissions
   - Position document in frame
   - SDK will auto-capture when quality is good

4. **Test Face Capture with Liveness:**
   - Follow on-screen guidance
   - SDK will verify liveness during capture
   - No need for separate liveness API call

## ✨ Features & Benefits

### Why Use Regula SDK Components?

#### 1. **Built-in Liveness Detection** 🔒
- Detects if face is from a live person
- Prevents spoofing with photos/videos
- No additional API calls needed
- Happens during capture

#### 2. **Professional UI** 🎨
- Consistent, tested user experience
- Multi-language support
- Customizable themes
- Mobile-responsive

#### 3. **Quality Assurance** ✅
- Automatic quality checks
- Real-time feedback to user
- Lighting detection
- Blur/focus detection
- Proper framing guidance

#### 4. **Seamless Backend Integration** 🔄
- Direct integration with Regula Web Services
- No manual image processing needed
- Optimized data format
- Automatic error handling

#### 5. **Production-Ready** 🚀
- Battle-tested components
- Regular updates from Regula
- Security best practices
- Performance optimized

## 📱 User Experience Flow

### Document Capture Flow

```
1. User clicks "Use Camera"
   ↓
2. Regula Document Reader initializes
   ↓
3. User positions document
   ↓
4. SDK shows real-time guidance:
   - "Move closer"
   - "Reduce glare"
   - "Hold steady"
   ↓
5. Auto-captures when quality is good
   ↓
6. Backend processes document
   ↓
7. Results displayed
```

### Face Capture with Liveness Flow

```
1. Liveness check step begins
   ↓
2. Regula Face SDK initializes
   ↓
3. User positions face
   ↓
4. SDK performs liveness detection:
   - Verifies real person
   - Checks face quality
   - Detects presentation attacks
   ↓
5. Captures face image
   ↓
6. Backend processes for comparison
   ↓
7. Liveness + match results
```

## 🔍 Component API Reference

### RegulaDocumentCapture

```typescript
interface RegulaDocumentCaptureProps {
  onCapture: (images: string[]) => void;  // Called with captured images
  onClose?: () => void;                   // Called when user closes
}
```

**Events:**
- `document-captured` - Document successfully captured
- `processing-complete` - Backend processing done
- `error` - Capture or processing error
- `close` - User closed camera

### RegulaFaceCapture

```typescript
interface RegulaFaceCaptureProps {
  onCapture: (image: string) => void;  // Called with captured face + liveness
  onClose?: () => void;                // Called when user closes
}
```

**Events:**
- `face-captured` - Face captured with liveness check
- `error` - Capture or liveness error
- `close` - User closed camera

## 🛠️ Troubleshooting

### Component Not Initializing

**Issue:** Component shows loading spinner indefinitely

**Solutions:**
1. Check browser console for errors
2. Verify backend services are running:
   ```bash
   docker ps | grep regula
   ```
3. Check network tab for API calls
4. Verify CORS settings in backend

### Camera Permission Denied

**Issue:** User denies camera access

**Solution:**
- Component will show error
- Guide user to enable camera in browser settings
- Fallback to file upload

### Liveness Check Fails

**Issue:** Liveness verification fails repeatedly

**Common Causes:**
1. Poor lighting
2. Face too close/far
3. Multiple faces in frame
4. Glasses/sunglasses
5. Face partially covered

**Solution:**
- SDK provides real-time guidance
- User should follow on-screen instructions
- Ensure good lighting conditions

### Backend Connection Issues

**Issue:** "Failed to connect to backend"

**Solutions:**
1. Verify backend is running:
   ```bash
   curl http://127.0.0.1:4000/api/verification
   ```

2. Check environment variables:
   ```bash
   # In frontend container
   docker exec kyc-frontend env | grep VITE
   ```

3. Verify CORS settings:
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: ['http://127.0.0.1:3000', 'http://localhost:3000'],
     credentials: true,
   });
   ```

## 📚 Additional Resources

### Regula Documentation
- [Face SDK Web Components](https://docs.regulaforensics.com/develop/face-sdk/web-components/)
- [Document Reader Web Components](https://docs.regulaforensics.com/develop/document-reader-sdk/web-components/)
- [Face SDK Web Service](https://docs.regulaforensics.com/develop/face-sdk/web-service/)
- [Document Reader Web Service](https://docs.regulaforensics.com/develop/document-reader-sdk/web-service/)

### Project Documentation
- [LIVENESS_GUIDE.md](./LIVENESS_GUIDE.md) - Complete liveness detection guide
- [LIVENESS_SPOOF_DETECTION.md](./LIVENESS_SPOOF_DETECTION.md) - Understanding spoof detection
- [ARCHITECTURE_DECISION_LIVENESS.md](./ARCHITECTURE_DECISION_LIVENESS.md) - Liveness architecture

### Project Files
- `frontend/src/components/RegulaDocumentCapture.tsx`
- `frontend/src/components/RegulaFaceCapture.tsx`
- `frontend/src/components/CyantechFaceCapture.tsx`
- `frontend/src/pages/VerificationFlow.tsx`
- `frontend/src/types/regula.d.ts`

## 🎉 Benefits Summary

✅ **Better User Experience** - Professional, guided capture process  
✅ **Higher Success Rate** - Quality checks ensure valid captures  
✅ **Built-in Liveness** - No separate liveness step needed  
✅ **Production Ready** - Battle-tested, maintained by Regula  
✅ **Easy Integration** - Web Components work out of the box  
✅ **Mobile Friendly** - Responsive and touch-optimized  
✅ **Secure** - Industry-standard biometric security  

---

**Status:** ✅ Fully integrated and ready to use!

Next: Download Face SDK package and start verification! 🚀

