# 07 — README final + capturas + video demo

## Qué hay que hacer

Preparar el material de entrega del proyecto. Tres cosas:

1. **README.md de la raíz**: enriquecer el actual con capturas, badges, demo.
2. **Capturas profesionales** de todas las pantallas (dashboard, mis-grupos,
   admin, etc.) en formato `docs/screenshots/`.
3. **Video demo** de 2-3 minutos mostrando el flujo completo.

## Pasos

### 1. Capturas

Recomendación: usá Chrome DevTools en modo responsive, dimension
**1440×900** para todas las capturas (consistencia visual).

Pantallas a capturar (todas en modo dark Y light si la 01 ya está):
- Landing público (cuando 03 esté listo)
- Página de login
- Dashboard del jugador
- Mis grupos (con grupos y sin grupos = empty state)
- Detalle de grupo con ranking
- Mis apuestas con predicciones
- Bracket de eliminatorias
- Panel admin: resumen
- Panel admin: partidos (con dialog de "Marcar resultado" abierto)
- Modo móvil (375×667) del dashboard

Guardalas en `docs/screenshots/01-landing.png`, etc.

### 2. README de la raíz

El README actual cubre lo técnico (setup, comandos). Agregale:

- **Header con logo + descripción** (1 párrafo punchy)
- **Capturas embebidas** (las 4-5 más vistosas)
- **Lista de features** (con checkmarks)
- **Stack técnico** (badges de shields.io)
- **Diagrama de arquitectura** (podés hacer uno con Excalidraw o draw.io)
- **Link al video demo** (YouTube o Loom)
- **Tabla de contribuidores** (vos y Julio)

### 3. Video demo

Grabá con OBS / Loom / Camtasia. Guion sugerido (2-3 min):

1. **0:00-0:15**: Intro. "Este es TecScore, la app de predicciones del Mundial
   que hicimos para Tecsup."
2. **0:15-0:45**: Login con Google + landing.
3. **0:45-1:30**: Dashboard, crear grupo, invitar (mostrar el código),
   predecir un partido.
4. **1:30-2:15**: Cambiá a la cuenta admin → cargá un resultado → mostrá cómo
   los puntos llegan en tiempo real al jugador.
5. **2:15-2:45**: Mostrá el bracket de eliminatorias y el ranking de grupo.
6. **2:45-3:00**: Outro con stack técnico y agradecimiento.

Subilo a YouTube como "no listado" y embebé en el README.

## Acceptance criteria

- [ ] README de la raíz con capturas embebidas
- [ ] Al menos 10 capturas en `docs/screenshots/`
- [ ] Video de 2-3 min subido y linkeado
- [ ] Tabla de contribuidores con porcentajes claros de aporte
- [ ] Sin typos (revisalo 2 veces)

## Tips

- El video es lo que el profe va a mirar primero. Practicá el guion antes de
  grabar.
- Las capturas: usá mock data realista (no "asdfgh#1234"). Tomate 5 minutos
  para crear usuarios con nombres creíbles vía login con varias cuentas
  Google.

## Esfuerzo

2-3 horas (1h capturas, 1h video, 1h README).
