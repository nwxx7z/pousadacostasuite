# Pousada Costa Suítes

Landing page premium, responsiva e orientada a reservas via WhatsApp.

## Estrutura de mídia

O layout está preparado para receber os materiais reais do proprietário. Quando as fotos/vídeos forem enviados, substituir os slots visuais por:

- `/assets/hero.webp`
- `/assets/intro-1.webp`
- `/assets/intro-2.webp`
- `/assets/quarto-1.webp` até `/assets/quarto-7.webp`
- `/assets/galeria-01.webp` etc.
- vídeos otimizados em `/assets/video/`

## Reservas e disponibilidade

O site usa PostgreSQL/Neon através da variável de ambiente `DATABASE_URL`.

O painel administrativo fica em `/admin` e permite:

- gerenciar preços por período e quarto;
- bloquear e desbloquear períodos;
- consultar a disponibilidade dos quartos;
- manter os dados de reservas separados do conteúdo estático do site.

As tabelas são inicializadas automaticamente pela API administrativa quando necessário.

## WhatsApp

Todos os CTAs usam o número +55 82 98860-7037.

## Desenvolvimento

Site estático sem framework ou biblioteca pesada, priorizando performance, responsividade, acessibilidade e `prefers-reduced-motion`.
