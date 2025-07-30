import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      console.log(`Reading localStorage key "${key}"...`);
      const item = window.localStorage.getItem(key);
      if (!item) {
        console.log(`No value found for key "${key}", using initial value:`, initialValue);
        return initialValue;
      }
      
      // Handle special case for string values that might not be JSON
      if (typeof initialValue === 'string' && !item.startsWith('{') && !item.startsWith('[') && !item.startsWith('"')) {
        // If the stored value looks like a plain string, return it directly
        console.log(`Loaded plain string value for key "${key}":`, item);
        return item as T;
      }
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(item);
        console.log(`Successfully loaded from localStorage key "${key}":`, parsed);
        return parsed;
      } catch {
        // If JSON parsing fails and we expect a string, return the raw value
        if (typeof initialValue === 'string') {
          console.log(`JSON parse failed for key "${key}", returning raw string:`, item);
          return item as T;
        }
        // For non-string types, fall back to initial value and clear the corrupted data
        console.warn(`Clearing corrupted localStorage key "${key}":`, item);
        window.localStorage.removeItem(key);
        return initialValue;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Handle string values that don't need JSON.stringify
      if (typeof valueToStore === 'string') {
        window.localStorage.setItem(key, valueToStore);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
      
      console.log(`Successfully saved to localStorage key "${key}":`, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  const removeValue = () => {
    try {
      console.log(`Removing localStorage key "${key}"`);
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Add effect to sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          console.log(`External localStorage change detected for key "${key}":`, newValue);
          setStoredValue(newValue);
        } catch {
          // Handle non-JSON values
          if (typeof initialValue === 'string') {
            setStoredValue(e.newValue as T);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}