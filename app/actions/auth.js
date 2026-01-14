'use server';

import { securexFetch } from "@/lib/securexFetch";

export async function loginAction(formData) {
    try {
        console.log("LOGGING IN VIA SECUREX");
        // Pass the object directly. securexFetch will strictly stringify it.
        const response = await securexFetch("auth/login", {
            method: "POST",
            body: formData,
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function registerAction(formData) {
    try {
        // Pass the object directly.
        const response = await securexFetch("auth/register", {
            method: "POST",
            body: formData,
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
