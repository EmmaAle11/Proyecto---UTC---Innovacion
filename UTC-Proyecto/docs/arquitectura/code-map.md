# Code Map y coordinación del equipo

Última actualización: 2026-07-23. Este documento evita cambios concurrentes sobre las mismas zonas y estandariza la autoría visible en commits y PRs.

## Equipo confirmado para el proyecto

| Área | Integrante | Prefijo obligatorio | Zona principal |
|---|---|---|---|
| DEV | Emmanuel Alejandre Valeriano | `[DEV-EMMA]` | Arquitectura, integración, backend transversal y documentación técnica |
| DEV | Miguel Angel Pineda Salazar | `[DEV-MIGUEL]` | Backend de dominio, persistencia, pruebas y migraciones |
| DEV | Uriel Dario | `[DEV-URIEL]` | Frontend FSD, integración API y pruebas de interfaz |
| DEV | Juan | `[DEV-JUAN]` | Infraestructura, Keycloak, Docker, seguridad y validación operativa |
| DESIGN | Natalia Santos Trejo | `[DES-NATALIA]` | Identidad visual, UX/UI, accesibilidad y assets |

## Uso del prefijo

El prefijo abre el título del commit, PR o entrada de CHANGELOG. Ejemplos: `[DEV-MIGUEL] feat(orders): reserva atómica`; `[DES-NATALIA] feat(ui): estados accesibles`. Un cambio compartido usa prefijo del responsable que lo integra y acredita a los demás en cuerpo/PR. No sustituye el nombre real ni la cuenta de GitHub.

## Mapa de código y límites

| Área | Rutas | Responsable de revisión |
|---|---|---|
| Backend de negocio | `backend/src/modules/**`, `backend/test/**` | DEV-MIGUEL; DEV-EMMA en cambios transversales |
| Backend transversal | `backend/src/{app.module.ts,domain,infrastructure,application,presentation,shared}/**` | DEV-EMMA |
| Datos | `backend/src/infrastructure/database/**`, `infra/postgres/**` | DEV-MIGUEL |
| Frontend | `frontend/src/{app,pages,widgets,features,entities,shared}/**` | DEV-URIEL |
| Plataforma | `infra/**`, `backend/.env.example`, configuración Keycloak y CI | DEV-JUAN |
| Diseño | `frontend/assets/**`, `brand/**`, estilos/tokens y documentación UX | DES-NATALIA; DEV-URIEL integra en app |
| Gobierno | `docs/**`, `.claude/Architecture.md`, `CHANGELOG.md`, `rules.md` | DEV-EMMA; especialista revisa su área |

Cambios que toquen más de una fila requieren coordinación previa, análisis de impacto y revisión del responsable de cada zona. No modificar archivos de otra zona para resolver un conflicto sin avisar al responsable.

## Verificación de acceso a GitHub

El 2026-07-23 GitHub reportó como colaboradores aceptados con escritura: `EmmaAle11`, `mrem10110`, `mikepinedas12`, `doxia-remoto` y `DoxIA-Main`. GitHub no expone una relación verificable entre esos aliases y los cinco nombres del equipo en esta sesión; la administradora debe confirmar dicha equivalencia antes de atribuir una cuenta a una persona. La API devolvió 403 para invitaciones pendientes porque la sesión disponible no tiene rol de administración; por ello no se afirma que no existan invitaciones pendientes.
