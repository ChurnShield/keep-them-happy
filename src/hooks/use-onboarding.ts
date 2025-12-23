const ONBOARDING_KEY = "onboarding_completed";

export const useOnboarding = () => {
  const isCompleted = (): boolean => {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  };

  const markCompleted = (): void => {
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const reset = (): void => {
    localStorage.removeItem(ONBOARDING_KEY);
  };

  return { isCompleted, markCompleted, reset };
};
