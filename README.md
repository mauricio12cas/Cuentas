# Registro de Cuentas de Cafeterías

Este es un sistema local, rápido y responsivo diseñado para gestionar las cuentas semanales de tus cafeterías en sustitución de tu libreta tradicional.

## 🌟 Características Principales

- **Gestión por Semanas (Lunes a Sábado):** Selecciona cualquier fecha y el sistema calculará automáticamente la semana de Lunes a Sábado (por ejemplo, `3 agosto - 8 agosto`).
- **Control de Columnas Requeridas:**
  - Nombre de la Cafetería (con autocompletado inteligente).
  - Número de Factura (opcional).
  - Total Semanal.
  - Día de Pago (marcado rápido como *Pendiente* o el día específico en que pagaron: *Lunes*, *Martes*, etc.).
- **Dashboard de Estadísticas:**
  - Visualización del total semanal y balances pagados/pendientes en tiempo real.
  - Historial general acumulado de todas las semanas registradas.
- **Doble Tema Visual (Dark/Light):** Cambia entre un moderno tema oscuro de tonos café espresso y un tema claro de cafetería vintage.
- **Herramientas de Respaldo e Impresión:**
  - **Exportar/Importar:** Genera un archivo `.json` de respaldo para no perder tu información si limpias el navegador.
  - **Vista de Impresión Limpia:** Imprime directamente en papel o guarda en PDF la semana seleccionada sin elementos de la interfaz.

## 🚀 Cómo Abrir la Aplicación

Para abrir la aplicación, solo necesitas hacer doble clic en el archivo [index.html](file:///home/mau/RegistroCuentas/index.html) desde el navegador web de tu preferencia (Chrome, Firefox, Safari, Edge, etc.). No requiere instalar ningún servidor ni dependencias.

Si deseas servir el proyecto localmente mediante un servidor web rápido, puedes abrir una terminal en esta carpeta y ejecutar:

```bash
# Si tienes Python instalado
python3 -m http.server 8000
```
Y abrir en tu navegador: `http://localhost:8000`

---
*Desarrollado con ❤️ para organizar tus cuentas de forma rápida.*
