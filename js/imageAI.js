// TEE MATRIX - Intelligent AI Product Vision Analyzer
// Fast, accurate image analysis for automated T-shirt naming, descriptions, highlights, and attributes

export class ProductImageAI {
  /**
   * Analyzes an uploaded product image (File, Blob, or URL) and returns complete product data.
   * @param {File|Blob|string} imageSource - File object, Blob, or URL
   * @returns {Promise<{success: boolean, name: string, description: string, highlights: string[], attributes: object}>}
   */
  static async analyzeImage(imageSource) {
    try {
      const fileName = (imageSource instanceof File) ? imageSource.name : (typeof imageSource === 'string' ? imageSource : '');
      const img = await this.loadImage(imageSource);
      const features = this.extractVisualFeatures(img, fileName);
      const generated = this.generateProductInfo(features);

      return {
        success: true,
        name: generated.name,
        description: generated.description,
        highlights: generated.highlights,
        attributes: generated.attributes,
        visualInfo: features
      };
    } catch (err) {
      console.error('Image AI analysis failed:', err);
      return {
        success: false,
        error: err.message || 'Unable to analyze image',
        name: '',
        description: '',
        highlights: [],
        attributes: {}
      };
    }
  }

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
   * Performs deep canvas pixel feature extraction across garment regions
   */
  static extractVisualFeatures(img, fileName = '') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const width = 120;
    const height = 150;
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;

    const centerPixels = [];
    const outerPixels = [];
    let highContrastCount = 0;
    let colorVariations = 0;

    const centerXStart = Math.floor(width * 0.25);
    const centerXEnd = Math.floor(width * 0.75);
    const centerYStart = Math.floor(height * 0.22);
    const centerYEnd = Math.floor(height * 0.78);

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 128) continue; // Skip transparency/background

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

    // Keyword detection from file/source name
    const lowerName = fileName.toLowerCase();
    const graphicKeywords = [
      { key: 'skull', name: 'Skull Graphic' },
      { key: 'eagle', name: 'Vintage Eagle Graphic' },
      { key: 'dragon', name: 'Dragon Graphic' },
      { key: 'luffy', name: 'Anime Character Graphic' },
      { key: 'anime', name: 'Anime Graphic' },
      { key: 'cyber', name: 'Cybernetic Graphic' },
      { key: 'matrix', name: 'Neo Matrix Graphic' },
      { key: 'racing', name: 'Retro Racing Print' },
      { key: 'tiger', name: 'Tiger Graphic' },
      { key: 'typography', name: 'Urban Typography Print' },
      { key: 'rebellion', name: 'Distortion Rebellion Graphic' },
      { key: 'tokyo', name: 'Tokyo Streetwear Graphic' },
      { key: 'vintage', name: 'Vintage Heritage Print' }
    ];

    let detectedGraphicType = null;
    for (const gk of graphicKeywords) {
      if (lowerName.includes(gk.key)) {
        detectedGraphicType = gk.name;
        break;
      }
    }

    const hasChestGraphic = Boolean(detectedGraphicType) || (centerVariance > outerVariance * 1.3 && highContrastCount > 110) || (Math.abs(centerAvgBrightness - outerAvgBrightness) > 22);
    const isAcidWash = lowerName.includes('acid') || (colorVariations > 380 && highContrastCount > 180 && !hasChestGraphic);
    const isStriped = lowerName.includes('stripe') || lowerName.includes('lined');

    const colorInfo = this.classifyGarmentColor(avgR, avgG, avgB, avgBrightness);

    return {
      color: colorInfo.name,
      colorFamily: colorInfo.family,
      hasGraphic: hasChestGraphic,
      graphicTheme: detectedGraphicType || 'Graphic',
      isAcidWash: isAcidWash,
      isStriped: isStriped,
      brightness: avgBrightness
    };
  }

  static classifyGarmentColor(r, g, b, brightness) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;

    if (brightness < 42) return { name: 'Black', family: 'dark' };
    if (brightness < 78 && s < 0.22) return { name: 'Charcoal Grey', family: 'dark' };
    if (brightness > 208 && s < 0.12) return { name: 'White', family: 'light' };
    if (brightness > 180 && s < 0.25) return { name: 'Off-White', family: 'light' };

    if (s < 0.18) {
      if (brightness < 120) return { name: 'Dark Grey', family: 'dark' };
      if (brightness < 170) return { name: 'Heather Grey', family: 'neutral' };
      return { name: 'Light Grey', family: 'light' };
    }

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
    if (deg >= 15 && deg < 45) return { name: 'Brown', family: 'earth' };
    if (deg >= 45 && deg < 70) return { name: 'Beige', family: 'light' };
    if (deg >= 70 && deg < 165) return { name: 'Olive Green', family: 'earth' };
    if (deg >= 165 && deg < 260) return { name: 'Navy Blue', family: 'dark' };
    if (deg >= 260 && deg < 315) return { name: 'Purple', family: 'vibrant' };
    return { name: 'Charcoal', family: 'dark' };
  }

  /**
   * Generates product name, description, highlights, and attributes strictly based on priority hierarchy
   */
  static generateProductInfo(f) {
    let name = '';
    let description = '';
    let highlights = [];
    let category = 'Graphic';
    let pattern = 'Front Graphic Print';

    // 1. Printed / Graphic T-Shirt
    if (f.hasGraphic) {
      category = 'Graphic';
      pattern = String(f.graphicTheme) + ' Print';
      const themeLabel = f.graphicTheme === 'Graphic' ? 'Graphic Print' : f.graphicTheme;
      
      if (f.colorFamily === 'dark') {
        name = f.color + ' ' + themeLabel + ' T-Shirt';
        description = name + ' features a bold graphic artwork on the front, creating a distinctive streetwear-inspired look. The ' + f.color.toLowerCase() + ' colour and graphic design give it a versatile casual style that is easy to pair with jeans, cargos, or shorts.';
      } else {
        name = f.color + ' ' + themeLabel + ' T-Shirt';
        description = name + ' features a prominent graphic artwork across the chest with a clean silhouette. Its clean ' + f.color.toLowerCase() + ' backdrop provides an eye-catching contrast, suitable for effortless everyday casual wear.';
      }

      highlights = [
        f.color + ' colour',
        'Graphic front print',
        'Short sleeves',
        'Round neck',
        'Streetwear-inspired design',
        'Casual everyday wear'
      ];
    }
    // 2. Acid Wash T-Shirt
    else if (f.isAcidWash) {
      category = 'Acid Wash';
      pattern = 'Vintage Acid Wash Pattern';
      name = f.color + ' Acid Wash T-Shirt';
      description = name + ' features a distinct acid-wash texture with a relaxed casual silhouette. The textured vintage pattern gives it a raw streetwear aesthetic, making it an easy piece to pair with everyday casuals.';

      highlights = [
        f.color + ' acid wash finish',
        'Textured vintage wash pattern',
        'Short sleeves',
        'Round neck',
        'Relaxed casual design',
        'Everyday wear'
      ];
    }
    // 3. Striped / Lined T-Shirt
    else if (f.isStriped) {
      category = 'Vintage';
      pattern = 'Striped Pattern';
      name = f.color + ' Striped T-Shirt';
      description = name + ' features a classic striped pattern across the torso, offering a timeless casual style. The clean neckline and short sleeves make it suitable for daily wear.';

      highlights = [
        f.color + ' striped design',
        'Horizontal stripe pattern',
        'Short sleeves',
        'Round neck',
        'Casual style',
        'Everyday wear'
      ];
    }
    // 4. Plain / Minimalist T-Shirt
    else {
      category = 'Heavyweight Minimal';
      pattern = 'Solid Plain Minimal';
      name = 'Classic ' + f.color + ' T-Shirt';
      description = name + ' features a clean solid colourway with a classic round neck and short sleeves. Its simple minimalist styling makes it easy to pair with jeans, trousers, or shorts for everyday casual wear.';

      highlights = [
        f.color + ' colour',
        'Solid plain design',
        'Short sleeves',
        'Round neck',
        'Casual style',
        'Everyday wear'
      ];
    }

    const attributes = {
      category: category,
      color: f.color,
      pattern: pattern,
      neckType: 'Round Neck',
      sleeveType: 'Short Sleeves',
      fit: 'Boxy Oversized Fit'
    };

    return {
      name,
      description,
      highlights,
      attributes
    };
  }
}
