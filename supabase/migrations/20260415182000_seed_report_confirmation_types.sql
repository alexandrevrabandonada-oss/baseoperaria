delete from public.confirmation_types;

insert into public.confirmation_types (code, label, sort_order) values
  ('acontece_tambem', 'Acontece também', 10),
  ('acontece_direto', 'Acontece direto', 20),
  ('tenho_prova', 'Tenho prova', 30),
  ('urgente', 'Urgente', 40);
