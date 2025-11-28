// src/api/auth.ts

export interface RegisterPayload {
  userId: string;
  firstName: string;
  lastName: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload) {
  // Goes through Vite proxy → backend
  const response = await fetch("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ---------- LOGIN ----------

export interface LoginPayload {
  userId: string;
  password: string;
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Login failed with status ${response.status}`);
  }

  try {
    return await response.json(); // e.g. token / user info
  } catch {
    return null;
  }
}
