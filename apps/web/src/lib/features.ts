import { useLocale } from '@/context/LocaleContext';

export interface FeatureFlags {
  membersInvite: boolean; // false everywhere — email delivery not implemented yet
  activityPage: boolean;
  tokenRegeneration: boolean;
  projectSettings: boolean;
}

// Feature flags keyed by locale. All locales share the same flags for now,
// but this structure makes it easy to swap for a remote config fetch later.
const FLAGS: Record<string, FeatureFlags> = {
  en: {
    membersInvite: false,
    activityPage: true,
    tokenRegeneration: true,
    projectSettings: true,
  },
  fr: {
    membersInvite: false,
    activityPage: true,
    tokenRegeneration: true,
    projectSettings: true,
  },
  es: {
    membersInvite: false,
    activityPage: true,
    tokenRegeneration: true,
    projectSettings: true,
  },
};

export function useFeatureFlags(): FeatureFlags {
  const { locale } = useLocale();
  return FLAGS[locale] ?? FLAGS['en'];
}
