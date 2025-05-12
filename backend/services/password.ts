// backend/services/password.ts

// We'll use the built-in Web Crypto API for hashing
// This will work in Deno Deploy without any external dependencies

/**
 * Hash a password using PBKDF2 with a random salt
 * 
 * @param password The plain text password to hash
 * @returns A string containing the salt and hash, separated by a dot
 */
export async function hash(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password to bytes
  const passwordData = new TextEncoder().encode(password);
  
  // Derive key using PBKDF2
  const key = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000, // High number of iterations for security
      hash: "SHA-256"
    },
    key,
    256 // 32 bytes (256 bits)
  );
  
  // Convert the derived bits to a Base64 string
  const derivedBitsArray = new Uint8Array(derivedBits);
  const hashBase64 = btoa(String.fromCharCode(...derivedBitsArray));
  const saltBase64 = btoa(String.fromCharCode(...salt));
  
  // Return the salt and hash, separated by a dot
  return `${saltBase64}.${hashBase64}`;
}

/**
 * Compare a plain text password with a hash
 * 
 * @param password The plain text password to check
 * @param hashedPassword The previously hashed password (salt.hash)
 * @returns true if the password matches the hash, false otherwise
 */
export async function compare(password: string, hashedPassword: string): Promise<boolean> {
  // Split the hash into salt and hash parts
  const [saltBase64, hashBase64] = hashedPassword.split(".");
  
  if (!saltBase64 || !hashBase64) {
    return false; // Invalid hash format
  }
  
  try {
    // Convert the salt from Base64 back to a Uint8Array
    const saltString = atob(saltBase64);
    const salt = new Uint8Array(saltString.length);
    for (let i = 0; i < saltString.length; i++) {
      salt[i] = saltString.charCodeAt(i);
    }
    
    // Convert password to bytes
    const passwordData = new TextEncoder().encode(password);
    
    // Derive key using PBKDF2 with the same salt and parameters
    const key = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      256
    );
    
    // Convert to Base64 and compare with the stored hash
    const derivedBitsArray = new Uint8Array(derivedBits);
    const newHashBase64 = btoa(String.fromCharCode(...derivedBitsArray));
    
    return newHashBase64 === hashBase64;
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
} 