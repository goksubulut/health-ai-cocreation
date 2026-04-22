function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .split(/[^a-z0-9]+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function hasExpertiseMatch(userExpertise, projectExpertise) {
  const userText = normalize(userExpertise);
  const projectText = normalize(projectExpertise);
  if (!userText || !projectText) return false;

  if (userText.includes(projectText) || projectText.includes(userText)) {
    return true;
  }

  const userTokens = tokenize(userText);
  const projectTokens = tokenize(projectText);
  if (userTokens.length === 0 || projectTokens.length === 0) return false;

  return userTokens.some((token) =>
    projectTokens.some(
      (candidate) =>
        candidate === token ||
        candidate.includes(token) ||
        token.includes(candidate)
    )
  );
}

function calculateProjectMatchScore(userProfile, project) {
  let score = 0;

  const expertiseMatched = hasExpertiseMatch(
    userProfile?.expertise,
    project?.required_expertise
  );
  if (expertiseMatched) score += 50;

  const cityMatched =
    normalize(userProfile?.city) !== '' &&
    normalize(userProfile?.city) === normalize(project?.city);
  if (cityMatched) score += 30;

  const isPrototype = normalize(project?.project_stage) === 'prototype';
  if (isPrototype) score += 10;

  const createdAt = new Date(project?.created_at);
  const isFresh =
    !Number.isNaN(createdAt.getTime()) &&
    Date.now() - createdAt.getTime() <= 3 * 24 * 60 * 60 * 1000;
  if (isFresh) score += 10;

  const percentage = Math.round((score / 100) * 100);

  return {
    score: percentage,
    signals: {
      expertiseMatched,
      cityMatched,
      isPrototype,
      isFresh,
    },
  };
}

export { calculateProjectMatchScore };
