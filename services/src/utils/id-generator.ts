export const generateLobbyId = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const generateSessionId = (): string => {
    return Math.random().toString(36).substring(2, 15);
};
  