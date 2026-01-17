'use server';

import { gatewayClient } from "../../lib/gateway_client";

/**
 * Normalize input coming from:
 * - <form action={action}>  → FormData
 * - programmatic calls      → plain object
 */
function normalizeInput(input) {
    if (!input) return null;

    if (typeof input === "object" && typeof input.entries === "function") {
        return Object.fromEntries(input.entries());
    }

    if (typeof input === "object") {
        return input;
    }

    return null;
}

/**
 * Basic invariant check for required fields
 */
function requireFields(data, fields) {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid request payload");
    }

    for (const field of fields) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
}

export async function loginAction(input) {
    try {
        console.log("LOGGING IN VIA SECUREX");

        const data = normalizeInput(input);
        requireFields(data, ["email", "password"]);

        const response = await gatewayClient("auth/login", {
            method: "POST",
            body: data,
        });

        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function registerAction(input) {
    try {
        const data = normalizeInput(input);
        requireFields(data, ["email", "password"]);

        const response = await gatewayClient("auth/register", {
            method: "POST",
            body: data,
        });

        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function verifyOtpAction(input) {
    try {
        const data = normalizeInput(input);
        requireFields(data, ["email", "code"]);

        const response = await gatewayClient("auth/verify", {
            method: "POST",
            body: data,
        });

        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
