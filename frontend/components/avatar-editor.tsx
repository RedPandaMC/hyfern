'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from '@/lib/icons';

interface AvatarEditorProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onSave: (croppedImage: Blob) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function AvatarEditor({ imageSrc, open, onClose, onSave }: AvatarEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: unknown, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const rotateLeft = () => setRotation((prev) => prev - 90);
  const rotateRight = () => setRotation((prev) => prev + 90);

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!croppedAreaPixels) return null;

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size to desired output size (512x512 for avatar)
    const outputSize = 512;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Calculate rotation
    const radians = (rotation * Math.PI) / 180;
    const centerX = image.width / 2;
    const centerY = image.height / 2;

    // Create a temporary canvas for rotation
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;

    // Set temp canvas to accommodate rotated image
    const diagonal = Math.sqrt(image.width ** 2 + image.height ** 2);
    tempCanvas.width = diagonal;
    tempCanvas.height = diagonal;

    // Draw rotated image on temp canvas
    tempCtx.translate(diagonal / 2, diagonal / 2);
    tempCtx.rotate(radians);
    tempCtx.translate(-centerX, -centerY);
    tempCtx.drawImage(image, 0, 0);

    // Calculate the offset due to rotation
    const offsetX = (diagonal - image.width) / 2;
    const offsetY = (diagonal - image.height) / 2;

    // Draw cropped area on output canvas
    ctx.drawImage(
      tempCanvas,
      croppedAreaPixels.x + offsetX,
      croppedAreaPixels.y + offsetY,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await createCroppedImage();
      if (croppedImage) {
        onSave(croppedImage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Cropper Container */}
          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Rotation Controls */}
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={rotateLeft}
                type="button"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Rotate Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rotateRight}
                type="button"
              >
                <RotateCw className="h-4 w-4 mr-1" />
                Rotate Right
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isProcessing} type="button">
              {isProcessing ? 'Processing...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to load image
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}