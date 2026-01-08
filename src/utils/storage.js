// Storage utility for browser localStorage
const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return {
        value: item,
        success: true
      };
    } catch (error) {
      console.error('Error reading from storage:', error);
      return {
        value: null,
        success: false,
        error
      };
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return {
        success: true
      };
    } catch (error) {
      console.error('Error writing to storage:', error);
      return {
        success: false,
        error
      };
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return {
        success: true
      };
    } catch (error) {
      console.error('Error removing from storage:', error);
      return {
        success: false,
        error
      };
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return {
        success: true
      };
    } catch (error) {
      console.error('Error clearing storage:', error);
      return {
        success: false,
        error
      };
    }
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.storage = storage;
}

export default storage;