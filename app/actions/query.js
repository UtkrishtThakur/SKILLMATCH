'use server';

import { gatewayClient } from "../../lib/gatewayClient";

export async function fetchQueriesAction(view, token) {
    try {
        const response = await gatewayClient("query", {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: { view }
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function postQueryAction(data, token) {
    try {
        const response = await gatewayClient("query", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: data, // Pass object directly
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
