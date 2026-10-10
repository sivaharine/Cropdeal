/**
 * Central utility for commodity-accurate crop images
 * Maps crops to dedicated local assets in src/assets/images/
 */
export function resolveCropImage(cropName: string | undefined | null): string {
  if (!cropName) {
    return '/assets/images/crop-wheat.jpg';
  }

  const name = cropName.toLowerCase().trim();

  if (name.includes('rice') || name.includes('paddy') || name.includes('basmati') || name.includes('adt') || name.includes('ponni')) {
    return '/assets/images/crop-rice.jpg';
  }
  if (name.includes('wheat') || name.includes('sharbati') || name.includes('gehun') || name.includes('flour') || name.includes('atta')) {
    return '/assets/images/crop-wheat.jpg';
  }
  if (name.includes('tomato') || name.includes('tamatar')) {
    return '/assets/images/crop-tomato.jpg';
  }
  if (name.includes('onion') || name.includes('pyaz') || name.includes('nasik')) {
    return '/assets/images/crop-onion.jpg';
  }
  if (name.includes('potato') || name.includes('aloo') || name.includes('alu')) {
    return '/assets/images/crop-potato.jpg';
  }
  if (name.includes('banana') || name.includes('kela') || name.includes('plantain')) {
    return '/assets/images/crop-banana.jpg';
  }
  if (name.includes('chilli') || name.includes('chili') || name.includes('mirch') || name.includes('mirchi') || name.includes('capsicum')) {
    return '/assets/images/crop-chili.jpg';
  }
  if (name.includes('cotton') || name.includes('kapas')) {
    return '/assets/images/crop-cotton.jpg';
  }
  if (name.includes('groundnut') || name.includes('peanut') || name.includes('moongphali')) {
    return '/assets/images/crop-groundnut.jpg';
  }
  if (name.includes('maize') || name.includes('corn') || name.includes('makka')) {
    return '/assets/images/crop-maize.jpg';
  }
  if (name.includes('sugarcane') || name.includes('ganna') || name.includes('sugar')) {
    return '/assets/images/crop-sugarcane.jpg';
  }
  if (name.includes('turmeric') || name.includes('haldi')) {
    return '/assets/images/crop-turmeric.jpg';
  }

  // Fallback default
  return '/assets/images/crop-wheat.jpg';
}
