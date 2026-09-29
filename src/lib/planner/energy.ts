import { EnergyPreference, EnergyTimeBlock, DifficultyLevel } from '@/types';

/**
 * Returns the energy time block for a given time string "HH:mm"
 * Morning: 06:00 - 11:59
 * Afternoon: 12:00 - 16:59
 * Evening: 17:00 - 21:59
 * Night: 22:00 - 05:59
 */
export function getTimeBlockForTime(timeStr: string): EnergyTimeBlock {
  const [hours] = timeStr.split(':').map(Number);

  if (hours >= 6 && hours < 12) return 'MORNING';
  if (hours >= 12 && hours < 17) return 'AFTERNOON';
  if (hours >= 17 && hours < 22) return 'EVENING';
  return 'NIGHT';
}

/**
 * Classifies the energy requirement for a task or topic difficulty
 */
export function classifyTaskEnergyRequirement(difficulty: DifficultyLevel): DifficultyLevel {
  return difficulty; // HIGH, MEDIUM, LOW
}

/**
 * Calculates match score (0 - 100) between task energy requirement and slot energy level
 */
export function getEnergyMatchScore(
  taskRequirement: DifficultyLevel,
  timeStr: string,
  userPreferences: EnergyPreference[]
): number {
  const block = getTimeBlockForTime(timeStr);
  const pref = userPreferences.find((p) => p.timeBlock === block);
  const slotEnergy = pref ? pref.energyLevel : 'MEDIUM';

  if (taskRequirement === slotEnergy) return 100;
  
  if (taskRequirement === 'HIGH') {
    if (slotEnergy === 'MEDIUM') return 70;
    if (slotEnergy === 'LOW') return 30; // Mismatch: hard task in low energy slot
  }

  if (taskRequirement === 'MEDIUM') {
    if (slotEnergy === 'HIGH' || slotEnergy === 'LOW') return 80;
  }

  if (taskRequirement === 'LOW') {
    if (slotEnergy === 'MEDIUM' || slotEnergy === 'HIGH') return 90; // Low energy task can fit anywhere
  }

  return 50;
}
