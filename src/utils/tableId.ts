
/**
 * Utility functions for encoding and decoding table IDs in URLs.
 * This provides a basic level of obfuscation so table numbers aren't immediately visible.
 */

export const encodeTableId = (tableId: string): string => {
    if (!tableId) return '';
    try {
        // Simple obfuscation: prefix + base64
        // We add a random-looking prefix to make it look more like a token
        return btoa(`tbl_${tableId}`);
    } catch (e) {
        console.error('Error encoding table ID:', e);
        return tableId;
    }
};

export const decodeTableId = (encodedId: string): string => {
    if (!encodedId) return '';
    try {
        // If it's a plain number (legacy support), return it
        if (/^\d+$/.test(encodedId)) return encodedId;

        const decoded = atob(encodedId);
        if (decoded.startsWith('tbl_')) {
            return decoded.substring(4);
        }
        return encodedId;
    } catch (e) {
        // If decoding fails, it might be a plain ID
        return encodedId;
    }
};
