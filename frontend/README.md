# KYC Demo Frontend

React + TypeScript + Vite frontend application for KYC verification with Cyantech integration.

## Features

- 📱 **Responsive UI**: Modern, mobile-friendly interface
- 📷 **Camera Integration**: Webcam capture for selfies and liveness checks
- 📤 **File Upload**: Drag-and-drop document upload
- ✨ **Real-time Feedback**: Live verification status updates
- 🎨 **Tailwind CSS**: Beautiful, customizable styling
- ⚡ **Vite**: Lightning-fast development experience

## Prerequisites

- Node.js 18+ or 20+
- Backend API running (default: http://localhost:4000)

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:4000
```

## Running the Application

### Development Mode

```bash
# Start dev server
npm run dev

# Access at http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Mode

```bash
# Build and run with Docker Compose (from root directory)
docker-compose up frontend
```

## User Flow

1. **Home Page** - Start new verification session
2. **Document Upload** - Upload government-issued ID
3. **Liveness Check** - Capture live selfie
4. **Face Matching** - Match selfie with document photo
5. **Results** - View detailed verification report

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── HomePage.tsx          # Landing page
│   │   ├── VerificationFlow.tsx  # Multi-step verification
│   │   └── ResultsPage.tsx       # Results display
│   ├── components/
│   │   ├── UploadZone.tsx        # File upload component
│   │   ├── CameraCapture.tsx     # Webcam component
│   │   └── StepIndicator.tsx     # Progress indicator
│   ├── services/
│   │   └── api.ts                # API client
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   ├── hooks/                    # Custom React hooks
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Key Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Tailwind CSS** - Styling
- **React Webcam** - Camera integration
- **Lucide React** - Icons
- **Axios** - HTTP client

## API Integration

The frontend communicates with the backend REST API:

### Verification Endpoints
- `POST /api/verification` - Create session
- `GET /api/verification/:id` - Get session status
- `GET /api/verification/:id/report` - Get detailed report

### Document Endpoints
- `POST /api/document/process` - Process document image

### Face Endpoints
- `POST /api/face/liveness` - Check liveness
- `POST /api/face/match-with-document` - Match faces

## Styling

The app uses Tailwind CSS with custom utility classes:

- `btn`, `btn-primary`, `btn-secondary`, etc. - Button styles
- `card` - Card container
- `upload-zone` - File upload area
- `status-badge` - Status indicators
- `loading-spinner` - Loading animation

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note:** Camera features require HTTPS in production.

## Troubleshooting

### Camera Not Working

- Check browser permissions
- Ensure HTTPS is enabled (required for camera access)
- Try a different browser

### API Connection Issues

- Verify `VITE_API_URL` in `.env`
- Check backend is running on correct port
- Check CORS settings in backend

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## License

MIT

