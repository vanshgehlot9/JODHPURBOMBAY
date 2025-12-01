/**
 * Network utility functions for handling Firebase connection issues
 */

/**
 * Retry an async operation with exponential backoff
 * @param operation - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @param initialDelay - Initial delay in milliseconds (default: 300)
 * @returns Promise with the operation result
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  initialDelay = 300
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryableError =
        error?.code === 'unavailable' ||
        error?.code === 'failed-precondition' ||
        error?.message?.includes('offline') ||
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('UNAVAILABLE');

      // If it's the last attempt or not a retryable error, throw immediately
      if (isLastAttempt || !isRetryableError) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Check if an error is a network/connectivity error
 * @param error - The error to check
 * @returns boolean indicating if it's a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'unavailable' ||
    error?.code === 'failed-precondition' ||
    error?.message?.includes('offline') ||
    error?.message?.includes('ECONNRESET') ||
    error?.message?.includes('UNAVAILABLE') ||
    error?.message?.includes('Network')
  );
}

/**
 * Get a user-friendly error message based on the error type
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (error?.code === 'permission-denied') {
    return 'Permission denied: You do not have access to perform this operation.';
  }

  if (error?.code === 'not-found') {
    return 'The requested resource was not found.';
  }

  if (error?.code === 'already-exists') {
    return 'This resource already exists.';
  }

  // Return custom message or fallback
  return error?.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Wait for network connectivity
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise that resolves when online or rejects on timeout
 */
export function waitForOnline(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (navigator.onLine) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      reject(new Error('Timeout waiting for network connection'));
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}
