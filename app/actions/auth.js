'use server';

import { gatewayClient } from "../../lib/gatewayClient";


export async function loginAction(formData) {
    try {
        console.log("LOGGING IN VIA SECUREX");
        // Pass the object directly. gatewayClient will stringify it.
        const response = await gatewayClient("auth/login", {
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
        const response = await gatewayClient("auth/register", {
            method: "POST",
            body: formData,
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function verifyOtpAction(data) {
    try {
        // Verify OTP for registration
        const response = await gatewayClient("auth/verify", {
            method: "POST",
            body: data,
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
