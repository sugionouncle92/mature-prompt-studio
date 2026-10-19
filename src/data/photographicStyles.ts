export interface PhotographicStyleItem {
  id: string;
  name: string;
  description: string;
  isMandatoryUltra?: boolean;
}

export const PHOTOGRAPHIC_STYLES: PhotographicStyleItem[] = [
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Convincing photo aesthetic, sensible natural lighting, authentic visual fidelity resembling real camera capture.',
  },
  {
    id: 'ultra-realistic',
    name: 'Ultra Realistic',
    description: 'Authentic micro-textures, visible skin pores & subtle imperfections, realistic eyelashes, hair strands, fabric fibers, and physically plausible lighting.',
    isMandatoryUltra: true,
  },
  {
    id: 'raw-photo',
    name: 'RAW Photo',
    description: 'Unprocessed camera look, natural non-destructive textures, realistic uncrushed colors, and balanced non-aggressive dynamic range.',
  },
  {
    id: 'cinematic-photography',
    name: 'Cinematic Photography',
    description: 'Directed lighting, atmospheric depth, cinematic framing, moody shadows, and deliberate narrative staging.',
  },
  {
    id: 'natural-camera',
    name: 'Natural Camera Rendering',
    description: 'Sensible perspective, natural ambient light, authentic depth of field, and unpolished realistic photography.',
  },
  {
    id: 'professional-editorial',
    name: 'Professional Editorial Photography',
    description: 'Magazine quality, controlled studio/location lighting, crisp material details, and refined editorial elegance.',
  },
  {
    id: 'high-detail',
    name: 'High Detail',
    description: 'Focused sharpness on eyes, hair strands, garment fabrics, and environmental elements without artificial oversharpening.',
  },
];
