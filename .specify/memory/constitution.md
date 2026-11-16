<!--
SYNC IMPACT REPORT
==================
Version change: (nueva) → 1.0.0 (ratificación inicial)
Modified principles: ninguno (documento inicial)
Added sections:
  - Core Principles (5 principios definidos por el usuario)
  - Requisitos adicionales (arquitectura desacoplada, plantilla del proyecto)
  - Flujo de trabajo y cumplimiento
  - Governance
Removed sections: ninguna (se partió de la plantilla sin valores)
Deferred TODOs: ninguno
-->

# master-inventory Constitution

## Core Principles

### I. Simplicidad ante todo

Ante dos soluciones que cumplen lo mismo, se elige siempre la más simple. Esta es la
versión 1: NO se construye complejidad anticipada (abstracciones, configuraciones ni
capas "por si acaso"). La complejidad solo entra cuando una necesidad real, escrita en
la spec, la exige.

### II. Español de Colombia y pesos COP

Todo el producto —interfaz, mensajes, reportes, errores, documentación de usuario—
debe estar en español de Colombia. Todos los valores monetarios se muestran en pesos
colombianos (COP), con su formato local. Ninguna pantalla ni reporte puede quedar en
otro idioma o moneda.

### III. Cero alcance fantasma

NO se implementa ninguna funcionalidad que no esté escrita en la spec vigente. Si
durante el trabajo surge una idea nueva, se registra como propuesta y se discute; NO
se construye. El código que no responde a un requisito escrito es alcance fantasma y
debe eliminarse.

### IV. Verificable por una persona no técnica

Cada criterio de éxito debe poder comprobarse usando la aplicación, sin leer código.
Los criterios se redactan como pasos concretos: qué abrir, qué ingresar y qué se debe
ver. Si un requisito solo puede verificarse leyendo código, NO está bien definido.

### V. Datos del usuario con respeto

Se pide únicamente lo imprescindible para que la función funcione. NO se introduce
claves, tokens ni secretos en el código. Si un dato no es necesario, no se solicita.

## Requisitos adicionales

Estas reglas no son principios nuevos, son condiciones de diseño que gobiernan toda
implementación:

- **Crecimiento sin romper**: cada funcionalidad nueva debe agregarse sin alterar el
  comportamiento de lo ya implementado. Los cambios que afecten comportamiento
  existente deben declararse antes y justificarse en la spec.
- **Arquitectura desacoplada**: la lógica de negocio debe separarse de la interfaz, el
  almacenamiento y la generación de reportes (PDF). Debe poder migrarse o cambiar un
  componente (por ejemplo, la base de datos o el generador de PDF) sin reescribir todo
  el código.
- **Plantilla del proyecto**: la aplicación se construye sobre la plantilla y la
  estructura existentes en este proyecto. NO se introduce una estructura paralela ni
  estilos fuera de la plantilla salvo necesidad justificada en la spec.

## Flujo de trabajo y cumplimiento

- Toda funcionalidad nueva nace de una spec escrita; NO se codifica sin spec.
- Antes de cerrar un trabajo se verifica esta lista: ¿es la solución más simple?,
  ¿todo está en español de Colombia y COP?, ¿hay algo construido fuera de la spec?,
  ¿los criterios se comprueban usando la app?, ¿se pidió solo el mínimo de datos?.
- Cualquier incumplimiento debe corregirse o justificarse por escrito antes de
  continuar.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica del proyecto; un cambio
  en el código que la contradiga es un error, aunque funcione.
- Las enmiendas se hacen por escrito en este documento, indicando qué principio
  cambia, por qué y con qué efecto sobre el trabajo existente.
- La versión sigue MAJOR.MINOR.PATCH: MAJOR al quitar o redefinir principios,
  MINOR al agregar principios o secciones, PATCH al aclarar texto sin cambiar reglas.
- Cada revisión de trabajo debe confirmar cumplimiento de estos principios.

**Version**: 1.0.0 | **Ratified**: 2026-11-16 | **Last Amended**: 2026-11-16
