const firstNames = ["Astrid", "Søren", "Freja", "Björn", "Eirik"] as const;
const lastNames = ["Andersson", "Hansen", "Nielsen", "Bergström", "Lundqvist"] as const;

/** Creates a stable synthetic name without using names returned by the real API. */
export function stableMockInstructorName(seed: number) {
  const normalizedSeed = Math.abs(Math.trunc(seed));
  const firstName = firstNames[normalizedSeed % firstNames.length]!;
  const lastName = lastNames[Math.floor(normalizedSeed / firstNames.length) % lastNames.length]!;
  return `${firstName} ${lastName}`;
}
