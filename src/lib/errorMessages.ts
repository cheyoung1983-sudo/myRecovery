/**
 * Translates standard Firebase Auth error codes into clean, human-readable helper messages.
 * Prevents user enumeration by using generic fallback messages for sensitive cases.
 */
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Your password must be at least 6 characters long.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      // Best practice: Use a generic message for login failures to prevent user enumeration
      return 'Invalid email or password. Please try again.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};
