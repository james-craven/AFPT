export const eventDefaults = {
  'push-up': '67',
  'hand-release-push-up': '52',
  'sit-up': '58',
  'cross-leg-reverse-crunch': '60',
  'forearm-plank': '3:40',
  'two-mile-run': '13:25',
  'hamr-20-meter': '87',
  'two-kilometer-walk': '16:16',
};

export const eventLabels = {
  'push-up': 'STRENGTH REPS:',
  'hand-release-push-up': 'STRENGTH REPS:',
  'sit-up': 'CORE REPS:',
  'cross-leg-reverse-crunch': 'CORE REPS:',
  'forearm-plank': 'CORE TIME:',
  'two-mile-run': 'CARDIO TIME:',
  'hamr-20-meter': 'CARDIO SHUTTLES:',
  'two-kilometer-walk': 'CARDIO WALK TIME:',
};

export function legacyAgeToPfraAgeGroup(age) {
  return {
    '< 25': 'under-25',
    '25-29': '25-29',
    '30-34': '30-34',
    '35-39': '35-39',
    '40-44': '40-44',
    '45-49': '45-49',
    '50-54': '50-54',
    '55-59': '55-59',
    '60+': '60-and-over',
  }[age];
}

export function legacySexToPfraSex(sex) {
  return sex.toLowerCase();
}

export function strengthEventForLegacy(value) {
  return {
    Pushups: 'push-up',
    'Hand-Release': 'hand-release-push-up',
  }[value];
}

export function coreEventForLegacy(value) {
  return {
    Situps: 'sit-up',
    'Reverse Crunch': 'cross-leg-reverse-crunch',
    Plank: 'forearm-plank',
  }[value];
}

export function cardioEventForLegacy(value) {
  return {
    '1.5 Mile': 'two-mile-run',
    'Shuttle Run': 'hamr-20-meter',
    Walk: 'two-kilometer-walk',
  }[value];
}

export function componentExemptionsFromLegacy({ cardio, core, strength }) {
  return {
    strength: strength === 'Exempt',
    core: core === 'Exempt',
    cardio: cardio === 'Exempt',
  };
}

