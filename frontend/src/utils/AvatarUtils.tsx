import {AvatarProps} from "@mui/material";

/**
 * Génère une couleur basée sur une chaîne de caractères.
 */
export function stringToColor(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}

/**
 * Retourne les props pour un composant Avatar (couleur et initiales)
 */
export function stringAvatar(name: string): AvatarProps {
    // On découpe et on filtre pour éviter les éléments vides
    const parts = name.split(' ').filter(part => part.trim().length > 0);

    // Si on a au moins deux mots, on prend les deux premières initiales
    // Sinon, on prend la première lettre du premier mot (ou chaîne vide)
    const initials = parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`
        : parts.length === 1
            ? parts[0][0]
            : '';

    return {
        sx: {
            bgcolor: stringToColor(name),
        },
        // toUpperCase() sur une chaîne toujours définie et non vide
        children: initials.toUpperCase(),
    };
}
