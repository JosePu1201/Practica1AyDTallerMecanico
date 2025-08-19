// Simple notification system using browser alerts until react-toastify is installed

export const notifySuccess = (message) => {
  // Use alert for now - we'll replace this with toast.success when react-toastify is installed
  alert(`✅ ${message}`);
};

export const notifyError = (message) => {
  // Use alert for now - we'll replace this with toast.error when react-toastify is installed
  alert(`❌ ${message}`);
};

export const notifyInfo = (message) => {
  // Use alert for now - we'll replace this with toast.info when react-toastify is installed
  alert(`ℹ️ ${message}`);
};

export const notifyWarning = (message) => {
  // Use alert for now - we'll replace this with toast.warning when react-toastify is installed
  alert(`⚠️ ${message}`);
};