import { useEffect, useRef, useState } from "react";
import logger from "@/lib/logger";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, Camera, AlertCircle, RefreshCw } from "lucide-react";

interface QRCodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  stageTitle?: string;
}

export const QRCodeScanner = ({ open, onClose, onScanSuccess, stageTitle }: QRCodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setError(null);
      setPermissionError(false);
      checkPermissionsAndStart();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Check camera permissions and request if needed
  const checkCameraPermissions = async (): Promise<boolean> => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser");
      }

      // Check if we can query permissions (not all browsers support this)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
          
          if (permissionStatus.state === "denied") {
            setPermissionError(true);
            setError("Camera permission is denied. Please enable camera access in your browser settings and try again.");
            return false;
          }
        } catch (permError) {
          // Permission query not supported or failed, continue to try getUserMedia
          logger.debug("Permission query not supported, trying getUserMedia directly");
        }
      }

      // Try to get camera access (this will prompt user if needed)
      setIsRequestingPermission(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      // Stop the test stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setIsRequestingPermission(false);
      return true;
    } catch (err: unknown) {
      setIsRequestingPermission(false);
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError(true);
          setError("Camera permission is required to scan QR codes. Please allow camera access and try again.");
          return false;
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setError("No camera found. Please connect a camera and try again.");
          return false;
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setError("Camera is already in use by another application. Please close other apps using the camera and try again.");
          return false;
        } else {
          setError(err.message || "Failed to access camera. Please check your browser settings.");
          return false;
        }
      }
      
      setError("Failed to access camera. Please ensure camera permissions are granted.");
      return false;
    }
  };

  const checkPermissionsAndStart = async () => {
    const hasPermission = await checkCameraPermissions();
    if (hasPermission) {
      startScanning();
    }
  };

  const startScanning = async () => {
    const scannerId = "qr-scanner";
    
    try {
      setError(null);
      setPermissionError(false);
      setIsScanning(true);

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Successfully scanned
          stopScanning();
          onScanSuccess(decodedText);
          onClose();
        },
        (errorMessage) => {
          // Scan error - ignore common errors while scanning
          // Only show error if it's something significant
          if (!errorMessage.includes("NotFoundException") && 
              !errorMessage.includes("No QR code found") &&
              !errorMessage.includes("QR code parse error") &&
              !errorMessage.includes("No MultiFormat Readers")) {
            // Only set error for significant issues
            if (errorMessage.includes("Permission") || 
                errorMessage.includes("camera") ||
                errorMessage.includes("NotAllowedError") ||
                errorMessage.includes("PermissionDeniedError")) {
              setPermissionError(true);
              setError("Camera permission was denied. Please allow camera access and try again.");
              setIsScanning(false);
            }
          }
        }
      );
    } catch (err: unknown) {
      console.error("Error starting QR scanner:", err);
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.message.includes("Permission") || err.message.includes("permission")) {
          setPermissionError(true);
          setError("Camera permission is required. Please allow camera access and try again.");
        } else if (err.message.includes("camera") || err.message.includes("Camera")) {
          setError(err.message);
        } else {
          setError("Failed to start camera. Please ensure camera permissions are granted.");
        }
      } else {
        setError("Failed to start camera. Please ensure camera permissions are granted.");
      }
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping QR scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const handleRetry = async () => {
    setError(null);
    setPermissionError(false);
    await checkPermissionsAndStart();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            {stageTitle ? `Scan the QR code for ${stageTitle}` : "Position the QR code within the frame"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <div
              id="qr-scanner"
              className="w-full rounded-lg overflow-hidden bg-black"
              style={{ minHeight: "300px" }}
            />
            {(!isScanning || isRequestingPermission) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  {isRequestingPermission ? (
                    <>
                      <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Requesting camera permission...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Camera not active</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">Camera Error</p>
                  <p className="text-sm text-destructive/80">{error}</p>
                  {permissionError && (
                    <div className="mt-3 text-xs text-destructive/70">
                      <p className="font-medium mb-1">How to enable camera access:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Click the camera icon in your browser&apos;s address bar</li>
                        <li>Select &quot;Allow&quot; for camera permissions</li>
                        <li>Refresh the page and try again</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {error && (
              <Button onClick={handleRetry} className="flex-1" disabled={isRequestingPermission}>
                {isRequestingPermission ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            )}
            {!error && !isScanning && !isRequestingPermission && (
              <Button onClick={checkPermissionsAndStart} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            )}
          </div>

          {!error && isScanning && (
            <p className="text-xs text-muted-foreground text-center">
              Position the QR code within the frame to scan
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

