/**
 * Exécute une tâche lourde (PDF, email) sans bloquer la réponse HTTP.
 */
function runInBackground(task, label = 'background-task') {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => {
        console.error(`[${label}]`, error);
      });
  });
}

module.exports = { runInBackground };
