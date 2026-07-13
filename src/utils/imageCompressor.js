/**
 * Compresses an image file using Canvas.
 * @param {File} file - The image file to compress.
 * @param {Object} options - Compression options.
 * @param {number} [options.maxWidth=600] - Max width of the compressed image.
 * @param {number} [options.maxHeight=600] - Max height of the compressed image.
 * @param {number} [options.quality=0.7] - Quality of compression (0 to 1).
 * @returns {Promise<string>} Resolves with the compressed base64 DataURL.
 */
export function compressImage(file, { maxWidth = 600, maxHeight = 600, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D context from canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to jpeg with quality
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => {
        reject(err);
      };
      img.src = event.target.result;
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
}
