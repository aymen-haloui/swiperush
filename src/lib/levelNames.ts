// Level name mapping for display
export const levelNames: Record<number, string> = {
  1: "Beginner",
  2: "Explorer",
  3: "Adventurer",
  4: "Champion",
  5: "Legend",
  6: "Master",
  7: "Elite",
  8: "Grandmaster",
  9: "Mythic",
  10: "Transcendent"
};

export const getLevelName = (levelNumber: number): string => {
  return levelNames[levelNumber] || `Level ${levelNumber}`;
};

