
// src/lib/name-formatter.ts
import type { PuzzleNameDisplay, SiteSettings } from "@/app/super-admin/settings/actions";

/**
 * Formats a puzzle filename into a human-readable title.
 * e.g., '_pro_a-cute-kitty.jpg' -> 'A Cute Kitty'
 * @param filename The original puzzle filename.
 * @returns A formatted, capitalized string.
 */
function formatPuzzleName(filename: string): string {
    return filename
        // Remove prefixes and file extension
        .replace(/^_pro_|_upcoming_|_disabled_|\.jpg|\.jpeg|\.png|\.webp/g, '')
        // Replace hyphens with spaces
        .replace(/-/g, ' ')
        // Capitalize the first letter of each word
        .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Gets the appropriate display name for a puzzle based on the global site setting.
 * @param filename The puzzle's filename.
 * @param setting The current puzzle name display setting.
 * @param genericName The custom generic name from site settings.
 * @returns The final display name for the puzzle.
 */
export function getPuzzleDisplayName(filename: string, setting: PuzzleNameDisplay, genericName: string): string {
    switch (setting) {
        case 'formatted':
            return formatPuzzleName(filename);
        case 'generic':
            return genericName; // Use the custom generic name
        case 'filename':
            return filename;
        default:
            return formatPuzzleName(filename); // Default to formatted
    }
}
