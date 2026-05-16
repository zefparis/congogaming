import cron from 'node-cron';
import { executerTirageFlash } from './routes/flash.js';
import { executerTirageLoto } from './routes/loto.js';

/**
 * Démarre tous les planificateurs serveur :
 * - Flash : tirage toutes les 30 minutes (:00 et :30)
 * - Loto Congo : tirage quotidien à 20h00 DRC (UTC+2 = 18:00 UTC)
 */
export function startCrons() {
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

  // Tirage Loto Congo — tous les jours à 20h00 pile à Kinshasa
  cron.schedule(
    '0 20 * * *',
    async () => {
      try {
        const result = await executerTirageLoto();
        console.log('[LOTO CRON] Tirage quotidien effectué', result);
      } catch (err) {
        console.error('[LOTO CRON] Erreur tirage:', err);
      }
    },
    {
      timezone: 'Africa/Kinshasa',
    },
  );
  console.log('[LOTO CRON] Tirage quotidien planifié — 20h00 Africa/Kinshasa');
}
