
// src/lib/image-compressor.ts

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB
const DEFAULT_QUALITY = 0.8; // Default compression quality
const AGGRESSIVE_QUALITY = 0.7; // Quality for the second pass if needed

export type CompressedImageInfo = {
    file: File;
    width: number;
    height: number;
}

export type CompressOptions = {
    targetWidth?: number | null;
    quality?: number;
    convertToJpg?: boolean;
}

/**
 * Compresses and/or resizes an image file. It may perform a second, more
 * aggressive compression pass if the first attempt is still over 1MB.
 * @param file The original image file.
 * @param options Options for compression, including targetWidth and quality.
 * @returns A promise that resolves with the processed file info.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<CompressedImageInfo> {
  const { targetWidth, quality = DEFAULT_QUALITY, convertToJpg = false } = options;

  const performCompression = (image: HTMLImageElement, currentQuality: number, forceJpg: boolean): Promise<CompressedImageInfo> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        let { width, height } = image;
        const aspectRatio = width / height;

        // Apply resizing based on targetWidth
        if (targetWidth && width > targetWidth) {
            width = targetWidth;
            height = width / aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(image, 0, 0, width, height);
        
        const outputMimeType = forceJpg ? 'image/jpeg' : file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        let outputFilename = file.name;
        if (forceJpg && !outputFilename.toLowerCase().endsWith('.jpg') && !outputFilename.toLowerCase().endsWith('.jpeg')) {
            outputFilename = outputFilename.substring(0, outputFilename.lastIndexOf('.')) + '.jpg';
        }

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas to Blob conversion failed'));
            }

            const compressedFile = new File([blob], outputFilename, {
              type: outputMimeType,
              lastModified: Date.now(),
            });

            resolve({ file: compressedFile, width, height });
          },
          outputMimeType,
          currentQuality
        );
      });
  };

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        try {
            // First pass with user-defined quality
            let result = await performCompression(img, quality, convertToJpg);
            
            // If it's still too large, do a second, more aggressive pass
            if (result.file.size > MAX_SIZE_BYTES) {
                 result = await performCompression(img, AGGRESSIVE_QUALITY, convertToJpg);
            }

            resolve(result);

        } catch (error) {
            reject(error);
        }
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
