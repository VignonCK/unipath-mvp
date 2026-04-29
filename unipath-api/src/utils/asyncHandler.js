/**
 * Wrapper pour gérer les erreurs async dans les controllers Express
 * Évite d'avoir à écrire try/catch partout
 * 
 * Usage:
 * router.get('/endpoint', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
