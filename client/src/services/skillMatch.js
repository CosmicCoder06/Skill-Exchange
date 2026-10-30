const normalize = value => String(value || '').toLowerCase()
  .replace(/[^\p{L}\p{N}+#.]+/gu, ' ').trim().replace(/\s+/g, ' ');
const containsPhrase = (text, phrase) => ` ${text} `.includes(` ${phrase} `);

export function hasMatchingSkill(skills, query) {
  const target = normalize(query);
  if (!target) return false;
  return (skills || []).some(skill => {
    const taught = normalize(skill);
    return taught && (containsPhrase(taught, target) || containsPhrase(target, taught));
  });
}
