import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export type HapticIntent =
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'impact';

export function triggerHaptic(intent: HapticIntent) {
  const method =
    intent === 'success'
      ? 'notificationSuccess'
      : intent === 'warning'
        ? 'notificationWarning'
        : intent === 'error'
          ? 'notificationError'
          : intent === 'selection'
            ? 'selection'
            : 'impactMedium';

  try {
    ReactNativeHapticFeedback.trigger(method, options);
  } catch {
    // Haptics should never block user flows.
  }
}
