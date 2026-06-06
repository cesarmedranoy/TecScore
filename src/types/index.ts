/**
 * Tipos compartidos del dominio TecScore.
 *
 * Estos tipos representan las entidades del negocio (Match, Prediction, etc.).
 * NO representan el shape exacto en DynamoDB (eso vive en los repositories) —
 * son el modelo de dominio "limpio" que usa el resto de la app.
 */

// ============================================================================
// Roles y autenticación
// ============================================================================

export type Role = "PLAYER" | "ADMIN";

export interface User {
  userId: string;            // ULID
  email: string;             // único, viene de Google
  googleId: string;          // sub de Google
  displayName: string;       // "Julio"
  tag: string;               // "12f" → display final: "Julio#12f"
  avatarUrl: string;
  role: Role;
  totalPoints: number;
  currentStreak: number;     // racha actual de aciertos consecutivos
  maxStreak: number;         // mejor racha histórica
  predictedChampionId?: string;  // país predicho como campeón
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Grupos (salas)
// ============================================================================

export type GroupVisibility = "PUBLIC" | "PRIVATE";

export interface Group {
  groupId: string;
  name: string;
  description?: string;
  ownerId: string;
  visibility: GroupVisibility;
  joinCode: string;          // código corto para invitar (ej. "TECS-A4F9")
  memberCount: number;
  maxMembers: number;        // default 50
  createdAt: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  joinedAt: string;
  pointsInGroup: number;     // puntos acumulados específicamente en este grupo
}

export interface GroupRequest {
  groupId: string;
  userId: string;
  requestedAt: string;
  expiresAt: string;         // TTL de 12 horas para grupos privados
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
}

// ============================================================================
// Partidos
// ============================================================================

export type MatchStatus =
  | "SCHEDULED"    // programado, acepta predicciones
  | "LIVE"         // en juego, ya NO acepta predicciones
  | "FINISHED"     // terminado, admin marcó resultado → triggea scoring
  | "SUSPENDED"    // pausado temporalmente, predicciones se mantienen
  | "CANCELLED"    // cancelado terminal, predicciones se invalidan
  | "RESCHEDULED"; // se reprogramó → vuelve a SCHEDULED con nueva fecha

export type Stage =
  | "GROUP"
  | "ROUND_OF_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "THIRD_PLACE"
  | "FINAL";

export interface Match {
  matchId: string;
  stage: Stage;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;         // ISO timestamp
  status: MatchStatus;
  homeScore?: number;        // null hasta que admin lo marque
  awayScore?: number;
  scored: boolean;           // ¿ya se calcularon los puntos? (idempotencia)
  scoredAt?: string;
  updatedAt: string;
}

// ============================================================================
// Predicciones y puntos
// ============================================================================

export interface Prediction {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  submittedAt: string;       // crítico para regla "predicción anticipada"
  // hoursBeforeKickoff se calcula al guardar y se persiste para no recalcular
  hoursBeforeKickoff: number;
}

/**
 * Razones por las que un usuario obtuvo puntos.
 * Las guardamos para mostrar al usuario y para auditoría.
 */
export type PointReason =
  | "EXACT_SCORE"      // 5 pts
  | "CORRECT_WINNER"   // 3 pts
  | "GOAL_DIFFERENCE"  // 2 pts
  | "STREAK_BONUS"     // +2 pts cada 3 aciertos consecutivos
  | "EARLY_PREDICTION" // +1 pt si predijo >24h antes
  | "CHAMPION_BONUS";  // si acertó el campeón al final del torneo

export interface PointEntry {
  userId: string;
  matchId: string;
  amount: number;
  reasons: PointReason[];     // puede acumular varias razones por partido
  awardedAt: string;
}

// ============================================================================
// Social
// ============================================================================

export interface Friendship {
  userId: string;
  friendId: string;
  status: "PENDING" | "ACCEPTED" | "BLOCKED";
  createdAt: string;
}

export interface Notification {
  userId: string;
  notifId: string;            // ULID, ordenable
  type:
    | "MATCH_REMINDER"
    | "MATCH_RESULT"
    | "ADDED_TO_GROUP"
    | "FRIEND_REQUEST"
    | "STREAK_MILESTONE"
    | "ADMIN_MESSAGE";
  title: string;
  body: string;
  metadata?: Record<string, string>;
  read: boolean;
  createdAt: string;
}

// ============================================================================
// Chat
// ============================================================================

export interface ChatMessage {
  groupId: string;
  messageId: string;          // ULID
  userId: string;
  userName: string;           // denormalizado para no hacer join
  userAvatar: string;
  text: string;
  createdAt: string;
}

// ============================================================================
// Auditoría
// ============================================================================

export interface AuditLogEntry {
  logId: string;              // ULID
  timestamp: string;
  actorId: string;            // userId del admin (o "system")
  action: string;             // "MATCH_RESULT_UPDATE", "GROUP_DELETE", etc.
  targetType: string;         // "MATCH", "GROUP", "USER"
  targetId: string;
  diff?: Record<string, { from: unknown; to: unknown }>;
  ip?: string;
}
