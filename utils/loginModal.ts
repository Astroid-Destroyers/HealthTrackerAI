let openLoginModalCallback: (() => void) | null = null;

export const registerLoginModal = (fn: () => void) => {
  openLoginModalCallback = fn;
};

export const openLoginModal = () => {
  if (openLoginModalCallback) openLoginModalCallback();
};
