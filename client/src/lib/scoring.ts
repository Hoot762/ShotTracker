export function calculateScore(shots: (string | number)[]): { totalScore: number; vCount: number } {
  let totalScore = 0;
  let vCount = 0;
  
  for (const shot of shots) {
    if (shot === 'V' || shot === 'v') {
      totalScore += 5;
      vCount += 1;
    } else if (typeof shot === 'number') {
      totalScore += shot;
    } else if (typeof shot === 'string' && !isNaN(Number(shot))) {
      totalScore += Number(shot);
    }
  }
  
  return { totalScore, vCount };
}

export function formatScore(totalScore: number, vCount: number): string {
  if (vCount > 0) {
    return `${totalScore - vCount * 5}.${vCount}`;
  }
  return totalScore.toString();
}
