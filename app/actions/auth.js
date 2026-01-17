'use server';

import { gatewayClient } from "../../lib/gateway_client";


export async function loginAction(formData) {
    try {
        console.log("LOGGING IN VIA SECUREX");
        const data = Object.fromEntries(formData.entries());
        const response = await gatewayClient("auth/login", {
            method: "POST",
            body: data,
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function registerAction(formData) {
    try {
        const data = Object.fromEntries(formData.entries());
        const response = await gatewayClient("auth/register", {
            method: "POST",
            body: data,
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
