import { activateProjectile, deactivateProjectile } from './projectilePool.js';

export { activateProjectile as createProjectile, deactivateProjectile };

export default {
  createProjectile: activateProjectile,
  deactivateProjectile
};
