# Why Liveness Shows "Spoof"

## The Issue

You're seeing `liveness_status: "spoof"` in all your verification reports.

## The Answer

**This is NOT a bug!** The Regula Face SDK is correctly detecting that the liveness check **failed**.

## How It Works

The Regula Face SDK returns a `status` code:
- **`status: 0`** = ✅ **Genuine/Live** - Real person detected
- **`status: 1`** = ❌ **Spoof/Not Live** - Failed liveness check

From your backend logs:
```
✅ Extracted liveness_status: spoof (from responseData.status: 1)
```

The SDK returned `status: 1`, which means it detected a spoof attempt.

---

## Why This Happens

### 1. Testing with Photos
- ❌ **Don't**: Hold up a printed photo or show a photo on screen
- ✅ **Do**: Use a real person in front of the camera

### 2. Screen/Monitor Detection
- ❌ The SDK can detect if you're showing another screen/phone
- ✅ Use the actual webcam with a live person

### 3. Poor Lighting
- ❌ Too dark, too bright, or uneven lighting
- ✅ Well-lit room with natural or good artificial light

### 4. Not Following Prompts
- ❌ Not moving head when prompted
- ❌ Not looking at camera
- ✅ Follow ALL on-screen instructions during liveness check

### 5. Low Camera Quality
- ❌ Very low resolution or poor quality webcam
- ✅ Use HD webcam (720p or better)

### 6. Partial Face Visible
- ❌ Face too close, too far, or partially obscured
- ✅ Full face clearly visible in frame

### 7. Suspicious Movements
- ❌ Jerky, unnatural movements
- ✅ Smooth, natural head movements

---

## How to Pass Liveness Check

### ✅ Best Practices

1. **Use Real Person**
   - Sit in front of camera
   - Well-lit environment
   - No glasses/hats if possible

2. **Follow Instructions**
   - Look at camera
   - Move head as prompted
   - Complete all challenges

3. **Camera Setup**
   - HD webcam (720p+)
   - Stable mounting
   - Good lighting (not backlit)

4. **Face Position**
   - Full face visible
   - Center of frame
   - Not too close/far

5. **Environment**
   - Solid background
   - No mirrors/reflections
   - Quiet (for attention)

---

## Testing Tips

### For Development/Testing

If you need to test without strict liveness:

1. **Option 1**: Disable liveness in SDK config
2. **Option 2**: Lower security threshold
3. **Option 3**: Use test mode (if available)

**Note**: In production, **always use full liveness checks** for security!

---

## Checking What Went Wrong

### 1. Check Browser Console

When liveness completes, look for:
```javascript
📋 Complete Liveness result: {
  status: 1,  // 1 = spoof detected
  // ... other fields
}
```

### 2. Check Backend Logs

```bash
docker-compose logs backend | grep "liveness_status"
```

Look for:
```
✅ Extracted liveness_status: spoof (from responseData.status: 1)
```

### 3. Check Report Response

```json
{
  "face_data": {
    "liveness_status": "spoof",  // ❌ Failed
    "liveness_score": 0,          // Low score
    "liveness_confidence": null   // Low confidence
  }
}
```

---

## Expected Results

### ✅ Successful Liveness

```json
{
  "face_data": {
    "liveness_status": "genuine",
    "liveness_score": 1.0,
    "liveness_confidence": 0.95
  }
}
```

### ❌ Failed Liveness (Spoof Detected)

```json
{
  "face_data": {
    "liveness_status": "spoof",
    "liveness_score": 0,
    "liveness_confidence": 0.0
  }
}
```

---

## Security Note

⚠️ **This is a SECURITY FEATURE!**

The Face SDK is designed to prevent:
- Photo attacks (printed photos)
- Video replay attacks (recorded videos)
- Screen capture attacks (showing another device)
- Mask attacks (3D masks)
- Deep fake attacks

If it says "spoof", it's **protecting you** from fraudulent verification attempts!

---

## Next Steps

1. ✅ **Test with real person** using webcam
2. ✅ **Follow all liveness prompts**
3. ✅ **Ensure good lighting**
4. ✅ **Use quality camera**

If you're still getting "spoof" with a real person:
- Check camera permissions
- Try different browser
- Adjust lighting
- Move closer to camera
- Remove glasses/hats

---

## Summary

**The system is working correctly!** 

`status: 1` → `liveness_status: "spoof"` is the **intended behavior** when the Face SDK detects that the liveness check failed. This protects against fraud.

To pass the liveness check, use a **real person** with a **quality webcam** in **good lighting** and **follow all on-screen prompts**.

---

## Additional Resources

- **[LIVENESS_GUIDE.md](./LIVENESS_GUIDE.md)** - Complete liveness detection guide with technical details
- **[ARCHITECTURE_DECISION_LIVENESS.md](./ARCHITECTURE_DECISION_LIVENESS.md)** - Liveness architecture decisions
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - General troubleshooting guide

---

**Last Updated**: November 22, 2025  
**Status Code Reference**: Regula Face SDK Documentation  
**System Status**: ✅ Working as Designed

