'use server';

import { securexFetch } from "../../lib/securexFetch";

export async function fetchQueriesAction(view, token) {
    try {
        const response = await securexFetch(`query?view=${view}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return { success: true, data: response };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function postQueryAction(data, token) {
    try {
        const response = await securexFetch("query", {
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
