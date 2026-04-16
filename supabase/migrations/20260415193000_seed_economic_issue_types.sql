insert into public.issue_types (code, label, sort_order)
values
  ('salario_baixo', 'Salário baixo', 110),
  ('equiparacao', 'Equiparação salarial', 120),
  ('desvio_de_funcao', 'Desvio de função', 130),
  ('hora_extra_nao_paga', 'Hora extra não paga', 140),
  ('adicional_nao_pago', 'Adicional não pago', 150),
  ('atraso_pagamento', 'Atraso de pagamento', 160),
  ('desconto_indevido', 'Desconto indevido', 170),
  ('beneficio_cortado', 'Benefício cortado', 180),
  ('beneficio_desigual', 'Benefício desigual', 190),
  ('plr_injusta', 'PLR injusta', 200),
  ('terceirizacao_desigual', 'Terceirização desigual', 210)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  active = true;
