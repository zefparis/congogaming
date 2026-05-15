import cron from 'node-cron';
import { executerTirageFlash } from './routes/flash.js';

/**
 * Tirage Flash automatique toutes les 30 minutes (:00 et :30).
 */
export function startFlashCron() {
  cron.schedule('0,30 * * * *', async () => {
    try {
      const result = await executerTirageFlash();
      console.log(
        '[FLASH CRON] Tirage automatique déclenché',
        new Date().toISOString(),
        result,
      );
    } catch (err) {
      console.error('[FLASH CRON] Erreur tirage:', err);
    }
  });
  console.log('[FLASH CRON] Planificateur démarré — tirage toutes les 30 minutes');
}
