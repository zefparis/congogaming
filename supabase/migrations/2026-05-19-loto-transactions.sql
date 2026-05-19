-- Migration: enregistrer les achats de ticket loto et les gains dans transactions
-- À exécuter sur la base Supabase de production.

-- 1) Ajouter les nouvelles valeurs à l'enum transaction_type (idempotent)
do $$ begin
  alter type transaction_type add value if not exists 'loto_ticket';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type transaction_type add value if not exists 'loto_payout';
exception when duplicate_object then null; end $$;
