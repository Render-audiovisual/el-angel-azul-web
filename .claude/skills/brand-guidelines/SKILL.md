---
name: brand-guidelines
description: Applies El Ángel Azul's official brand colors and typography to any artifact that may benefit from having the agency's look-and-feel (presentations, documents, one-pagers, proposals). Use it when brand colors or style guidelines, visual formatting, or company design standards apply.
license: Adapted from Anthropic's example brand-guidelines skill (Apache 2.0, see LICENSE.txt) - colors and fonts below are El Ángel Azul's, not Anthropic's.
---

# El Ángel Azul Brand Styling

## Overview

To access El Ángel Azul's official brand identity and style resources, use this skill.

**Keywords**: branding, corporate identity, visual identity, post-processing, styling, brand colors, typography, El Ángel Azul brand, visual formatting, visual design

## Brand Guidelines

### Colors

**Main Colors:**

- Dark: `#083b7a` - Azul profundo, fondos oscuros (portadas, cierres de presentación, footer)
- Light: `#f7fbfe` - Fondo claro principal
- Mid Gray: `#4f6472` - Texto secundario / elementos secundarios
- Light Gray: `#d9e7ef` - Fondos sutiles, bordes, separadores

**Accent Colors:**

- Primary (azul): `#0d69a1` - Acento principal, CTAs secundarios, íconos
- Accent (fucsia): `#eb3e8f` - Acento secundario, énfasis puntual
- WhatsApp (verde): `#18a957` - Acento terciario, reservado para el CTA de contacto/WhatsApp

Colores de apoyo ya definidos en el sistema: `#0a4f79` (azul oscuro, hover/estados fuertes del primario) y `#d82f80` (fucsia oscuro, hover del acento).

### Typography

- **Encabezados generales**: Plus Jakarta Sans (peso 700-800), con system-ui/sans-serif de fallback
- **Título principal / hero**: Poppins (extra bold, 700-800) - reservado para el H1 más grande de una pieza (portada, título de tapa)
- **Texto de cuerpo**: Inter (400-600), con system-ui/-apple-system/sans-serif de fallback
- **Nota**: las fuentes deben estar preinstaladas en el entorno para mejores resultados; si no están disponibles, usar los fallbacks de arriba

## Features

### Smart Font Application

- Aplica Plus Jakarta Sans a encabezados (24pt y mayores); Poppins específicamente al título principal/de tapa
- Aplica Inter al texto de cuerpo
- Cae automáticamente a system-ui/Arial si las fuentes custom no están disponibles
- Preserva legibilidad en cualquier sistema

### Text Styling

- Encabezados (24pt+): Plus Jakarta Sans; título de tapa: Poppins
- Texto de cuerpo: Inter
- Selección de color inteligente según el fondo (texto oscuro sobre fondos claros, texto claro sobre `#083b7a`)
- Preserva jerarquía y formato del texto

### Shape and Accent Colors

- Formas sin texto usan los colores de acento
- Rota entre azul (`#0d69a1`), fucsia (`#eb3e8f`) y verde WhatsApp (`#18a957`) - el verde reservado idealmente para CTAs de contacto, no como acento decorativo genérico
- Mantiene interés visual sin salirse de marca

## Technical Details

### Font Management

- Usa Plus Jakarta Sans, Poppins e Inter instaladas en el sistema cuando estén disponibles
- Fallback automático a system-ui/Arial (encabezados) y system-ui (cuerpo)
- No requiere instalar fuentes - funciona con las fuentes del sistema existentes
- Para mejores resultados, preinstalar Plus Jakarta Sans, Poppins e Inter en el entorno

### Color Application

- Usa valores RGB para que el color de marca sea preciso
- Aplicado vía la clase RGBColor de python-pptx (para generación de presentaciones) o como variables CSS (`--color-primary`, `--color-accent`, etc.) para piezas web
- Mantiene fidelidad de color entre sistemas
