// TEE MATRIX - AI Product Vision Analyzer
// Analyzes uploaded T-shirt images and generates accurate descriptions & highlights

export class ProductImageAI {
  /**
   * Analyzes an uploaded product image (File, Blob, or URL) and returns description and highlights.
   * @param {File|Blob|string} imageSource - File object, Blob, or URL
   * @returns {Promise<{success: boolean, description: string, highlights: string[], visualInfo: object}>}
   */
  static async analyzeImage(imageSource) {
    try {
      // 1. Load image into an HTML Image element
      const img = await this.loadImage(imageSource);
      
      // 2. Perform canvas-based visual feature extraction
      const visualFeatures = this.extractVisualFeatures(img);

      // 3. Synthesize professional product description and highlights
      const result = this.generateContentFromFeatures(visualFeatures);
      
      return {
        success: true,
        description: result.description,
        highlights: result.highlights,
        visualInfo: visualFeatures
      };
    } catch (err) {
      console.error('Image AI analysis failed:', err);
      return {
        success: false,
        error: err.message || 'Failed to analyze image',
        description: '',
        highlights: []
      };
    }
  }

  /**
   * Helper to load File, Blob, or URL into an HTMLImageElement
   */
  static loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      if (source instanceof File || source instanceof Blob) {
        const objectUrl = URL.createObjectURL(source);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Unable to decode image file'));
        };
        img.src = objectUrl;
      } else if (typeof source === 'string') {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Unable to load image from URL'));
        img.src = source;
      } else {
        reject(new Error('Unsupported image source type'));
      }
    });
  }

  /**
   * Extracts dominant color, brightness, center-contrast, texture noise, and graphic presence
   */
  static extractVisualFeatures(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Scale to standard analysis dimensions
    const width = 120;
    const height = 150;
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;

    // Region histograms and sample pixels
    const centerPixels = [];
    const outerPixels = [];
    let highContrastCount = 0;
    let colorVariations = 0;

    const centerXStart = Math.floor(width * 0.25);
    const centerXEnd = Math.floor(width * 0.75);
    const centerYStart = Math.floor(height * 0.25);
    const centerYEnd = Math.floor(height * 0.75);

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 128) continue; // Skip transparency

        totalR += r;
        totalG += g;
        totalB += b;
        pixelCount++;

        const isCenter = x >= centerXStart && x <= centerXEnd && y >= centerYStart && y <= centerYEnd;
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        if (isCenter) {
          centerPixels.push({ r, g, b, brightness });
        } else {
          outerPixels.push({ r, g, b, brightness });
        }

        // Compare neighbor for edge/contrast detection
        if (x + 2 < width) {
          const nextIdx = (y * width + (x + 2)) * 4;
          const nextBrightness = 0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2];
          const diff = Math.abs(brightness - nextBrightness);
          if (diff > 45) highContrastCount++;
          if (diff > 25) colorVariations++;
        }
      }
    }

    const avgR = pixelCount > 0 ? Math.round(totalR / pixelCount) : 128;
    const avgG = pixelCount > 0 ? Math.round(totalG / pixelCount) : 128;
    const avgB = pixelCount > 0 ? Math.round(totalB / pixelCount) : 128;
    const avgBrightness = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

    // Detect Center vs Outer contrast difference (signals graphic print or chest logo)
    let centerAvgBrightness = avgBrightness;
    let centerVariance = 0;
    if (centerPixels.length > 0) {
      const sum = centerPixels.reduce((acc, p) => acc + p.brightness, 0);
      centerAvgBrightness = sum / centerPixels.length;
      centerVariance = centerPixels.reduce((acc, p) => acc + Math.pow(p.brightness - centerAvgBrightness, 2), 0) / centerPixels.length;
    }

    let outerAvgBrightness = avgBrightness;
    let outerVariance = 0;
    if (outerPixels.length > 0) {
      const sum = outerPixels.reduce((acc, p) => acc + p.brightness, 0);
      outerAvgBrightness = sum / outerPixels.length;
      outerVariance = outerPixels.reduce((acc, p) => acc + Math.pow(p.brightness - outerAvgBrightness, 2), 0) / outerPixels.length;
    }

    const hasChestGraphic = (centerVariance > outerVariance * 1.35 && highContrastCount > 120) || (Math.abs(centerAvgBrightness - outerAvgBrightness) > 25);
    const isAcidWashOrDistressed = colorVariations > 400 && highContrastCount > 200 && !hasChestGraphic;

    // Categorize garment base color
    const colorInfo = this.classifyGarmentColor(avgR, avgG, avgB, avgBrightness);

    return {
      color: colorInfo.name,
      colorFamily: colorInfo.family,
      hasGraphic: hasChestGraphic,
      isAcidWash: isAcidWashOrDistressed,
      brightness: avgBrightness,
      aspectRatio: img.width / img.height
    };
  }

  /**
   * Color classification based on RGB and HSL metrics
   */
  static classifyGarmentColor(r, g, b, brightness) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    // Black / Dark tones
    if (brightness < 42) {
      return { name: 'Black', family: 'dark' };
    }
    if (brightness < 75 && s < 0.2) {
      return { name: 'Charcoal Grey', family: 'dark' };
    }

    // White / Light tones
    if (brightness > 205 && s < 0.12) {
      return { name: 'White', family: 'light' };
    }
    if (brightness > 180 && s < 0.25) {
      return { name: 'Off-White', family: 'light' };
    }

    // Greys
    if (s < 0.18) {
      if (brightness < 120) return { name: 'Dark Grey', family: 'dark' };
      if (brightness < 170) return { name: 'Heather Grey', family: 'neutral' };
      return { name: 'Light Grey', family: 'light' };
    }

    // Chromatic Colors
    let h = 0;
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    const deg = h * 360;

    if (deg >= 345 || deg < 15) return { name: 'Red', family: 'vibrant' };
    if (deg >= 15 && deg < 45) return { name: 'Brown / Earth Tan', family: 'earth' };
    if (deg >= 45 && deg < 70) return { name: 'Beige / Sand', family: 'light' };
    if (deg >= 70 && deg < 165) return { name: 'Olive Green', family: 'earth' };
    if (deg >= 165 && deg < 260) return { name: 'Navy Blue', family: 'dark' };
    if (deg >= 260 && deg < 315) return { name: 'Purple', family: 'vibrant' };
    return { name: 'Charcoal', family: 'dark' };
  }

  /**
   * Generates natural description and 4-6 concise highlights
   */
  static generateContentFromFeatures(features) {
    const color = features.color;
    const hasGraphic = features.hasGraphic;
    const isAcidWash = features.isAcidWash;

    let description = '';
    let highlights = [];

    if (hasGraphic) {
      // Graphic Print T-Shirt
      if (features.colorFamily === 'dark') {
        description = `This ${color.toLowerCase()} T-shirt features a clean graphic print on the front with a relaxed casual design. Its simple styling makes it suitable for everyday casual wear.`;
      } else {
        description = `This ${color.toLowerCase()} T-shirt is designed with a prominent front graphic and clean silhouette, making it an easy piece to pair with everyday outfits.`;
      }

      highlights = [
        `${color} color`,
        'Graphic front print',
        'Short sleeves',
        'Round neck',
        'Casual design',
        'Everyday wear'
      ];
    } else if (isAcidWash) {
      // Acid Wash / Textured T-Shirt
      description = `This ${color.toLowerCase()} T-shirt features a distinct vintage-washed surface pattern with a relaxed casual cut, offering a unique textured look for daily styling.`;

      highlights = [
        `${color} tone`,
        'Vintage wash textured pattern',
        'Short sleeves',
        'Round neck',
        'Casual streetwear style',
        'Everyday wear'
      ];
    } else {
      // Solid / Minimalist T-Shirt
      if (features.colorFamily === 'light') {
        description = `This clean ${color.toLowerCase()} T-shirt features a solid minimalist design with a classic round neck and short sleeves, suitable for versatile everyday styling.`;
      } else {
        description = `This classic ${color.toLowerCase()} T-shirt features a clean solid colorway and relaxed casual cut, making it easy to pair with jeans, trousers, or shorts.`;
      }

      highlights = [
        `${color} color`,
        'Solid plain design',
        'Short sleeves',
        'Round neck',
        'Casual style',
        'Everyday wear'
      ];
    }

    return {
      description,
      highlights
    };
  }
}
