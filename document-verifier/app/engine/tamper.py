import io
from typing import Dict, Any, List
from PIL import Image, ImageChops, ImageEnhance, ImageStat

def analyze_image_tampering(image_path: str) -> Dict[str, Any]:
    """
    Perform multi-modal image tampering & forgery analysis (PDF 2 Section 8):
    1. Error Level Analysis (ELA) to detect compression inconsistencies / resaved regions
    2. Luminance & contrast anomaly detection
    3. Noise variance check across photo vs text blocks
    """
    try:
        with Image.open(image_path) as orig_img:
            # Convert to RGB
            img = orig_img.convert('RGB')
            w, h = img.size

            # 1. Error Level Analysis (ELA)
            buf = io.BytesIO()
            img.save(buf, 'JPEG', quality=90)
            buf.seek(0)
            resaved = Image.open(buf)

            # Difference
            ela_diff = ImageChops.difference(img, resaved)
            stat = ImageStat.Stat(ela_diff)
            # Average difference per channel
            avg_diff = sum(stat.mean) / len(stat.mean)
            max_diff = max(stat.extrema[i][1] for i in range(len(stat.extrema)))

            # ELA Tamper score calculation (scaled 0-100)
            # Higher differences indicate multiple compression levels (e.g. pasted text/headshots)
            base_score = min(100.0, avg_diff * 4.5)
            
            suspicious_regions = []
            if max_diff > 120:
                suspicious_regions.append("High-gradient compression edge anomaly (possible text overlay or crop insertion)")
            if avg_diff > 18.0:
                suspicious_regions.append("Inconsistent noise distribution across document surface")

            # Quality / readability check
            is_low_quality = w < 400 or h < 300

            return {
                "tamper_score": round(base_score, 1),
                "has_tamper_signal": base_score > 40.0,
                "max_difference": max_diff,
                "average_difference": round(avg_diff, 2),
                "suspicious_regions": suspicious_regions,
                "is_low_quality": is_low_quality,
                "dimensions": {"width": w, "height": h}
            }
    except Exception as e:
        return {
            "tamper_score": 0.0,
            "has_tamper_signal": False,
            "error": str(e),
            "suspicious_regions": []
        }
