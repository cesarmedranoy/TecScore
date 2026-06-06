/**
 * Barrel: punto único de import para todos los repositorios.
 *
 * En el resto del código:
 *   import { userRepository, matchRepository } from "@/server/repositories";
 *
 * en vez de importar de cada archivo individualmente.
 */

export { userRepository } from "./user-repository";
export {
  matchRepository,
  MatchAlreadyScoredError,
} from "./match-repository";
export { predictionRepository } from "./prediction-repository";
export {
  pointsRepository,
  PointsAlreadyAwardedError,
} from "./points-repository";
