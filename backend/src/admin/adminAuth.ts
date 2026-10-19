// Mot de passe partagé, volontairement simple pour l'instant (demande explicite de
// l'utilisateur : "Shodo" en dur, sécurisation plus poussée prévue plus tard — à
// remplacer par un vrai mécanisme d'auth avant d'exposer ça publiquement sans
// réserve). Surchargeable via ADMIN_PASSWORD, seul endroit à changer pour durcir.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Shodo";

export function isValidAdminPassword(password: unknown): boolean {
  return typeof password === "string" && password === ADMIN_PASSWORD;
}
