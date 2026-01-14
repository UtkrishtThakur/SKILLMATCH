'use server';

import { securexFetch } from "@/lib/securexFetch";

export async function loginAction(formData) {
    try {
        console.log("LOGGING IN VIA SECUREX");
        const response = await securexFetch("auth/login", {
            method: "POST",
            body: JSON.stringify(formData),
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function registerAction(formData) {
    try {
        const response = await securexFetch("auth/register", {
            method: "POST",
            body: JSON.stringify(formData),
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
