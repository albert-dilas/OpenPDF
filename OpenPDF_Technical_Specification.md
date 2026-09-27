# OpenPDF
**La Alternativa Open-Source, Privada y Local a iLovePDF**

## 1. Visión General del Proyecto
OpenPDF es una plataforma de procesamiento de documentos PDF diseñada bajo la premisa de la **Privacidad Absoluta**. A diferencia de las soluciones comerciales en la nube que requieren subir documentos sensibles a servidores de terceros, OpenPDF ejecuta todo su procesamiento (incluyendo OCR y conversiones pesadas) de manera 100% local en la máquina del usuario. 

La arquitectura ha sido diseñada en dos capas desacopladas (Frontend React y Backend Python) que, mediante un proceso de empaquetado continuo, se fusionan en un único archivo ejecutable (`.exe`) monolítico, eliminando la necesidad de instalación de dependencias por parte del cliente final.

## 2. Arquitectura de Software

El sistema implementa una **Arquitectura Limpia (Clean Architecture)** orientada a micro-servicios internos, dividida estructuralmente de la siguiente manera:

### 2.1 Backend (Motor de Procesamiento)
Desarrollado en **Python 3.12** utilizando **FastAPI** por su alto rendimiento y manejo asíncrono.
- **`app/api/v1/endpoints/`**: Capa de Controladores. Define las rutas HTTP y valida los datos de entrada (archivos subidos, contraseñas, configuraciones).
- **`app/services/`**: Capa de Lógica de Negocio. Aquí residen los algoritmos de transformación PDF. Está totalmente aislada de la capa web.
- **`app/utils/`**: Herramientas transversales, como el `file_manager.py` encargado de gestionar los archivos temporales y asegurar la recolección de basura (Garbage Collection) para evitar fugas de almacenamiento local.

### 2.2 Frontend (Capa de Presentación)
Construido con **Next.js 14 (App Router)**, **React**, y **Tailwind CSS**.
- **`src/app/(tools)/`**: Utiliza el enrutamiento basado en el sistema de archivos de Next.js. Cada herramienta tiene su propia vista aislada.
- **`src/store/`**: Manejo de estado global mediante Zustand (`useFileStore`), permitiendo mantener los archivos en memoria fluidamente sin prop-drilling.
- **`src/components/`**: UI reutilizable, destacando el componente inteligente de *Drag & Drop* (`Uploader.tsx`).

### 2.3 Sistema de Construcción y Empaquetado (Build Pipeline)
El flujo de construcción está completamente automatizado a través del script maestro `scripts/build_installer.py`, el cual orquesta el pipeline de 3 fases:
1. **Compilación Frontend:** Ejecuta `npm run build` en Next.js para generar la exportación estática en `frontend/out`.
2. **Empaquetado (PyInstaller):** Toma el servidor FastAPI y los estáticos de Next.js (`--add-data`) y los encapsula en un único binario ejecutable (`OpenPDF.exe` de ~95 MB) excluyendo módulos innecesarios de Python.
3. **Instalador Profesional (Inno Setup):** Inno Setup (`ISCC.exe`) toma el binario, el ícono multi-resolución, aplica un diseño minimalista y moderno, y genera el instalador final distributable (`OpenPDF_Setup_v1.0.0.exe`) con compresión LZMA2 Ultra.

## 3. Especificaciones Técnicas de Herramientas (14 Módulos)

El ecosistema actual soporta 14 operaciones complejas:

### Optimización y Organización
1. **Unir PDF**: Utiliza `PyMuPDF (fitz)`. Maneja *Drag & Drop* dinámico.
2. **Dividir PDF**: Extrae ráfagas de páginas hacia un archivo `.zip`.
3. **Comprimir PDF**: Implementa algoritmos de deflación nativa y reconstrucción de XREFs.
4. **Rotar PDF**: Transformación de matrices de página a nivel de metadatos.
5. **Números de Página**: Inyección de texto por coordenadas calculadas en el centro inferior del `rect` de la página.

### Conversión Avanzada
6. **PDF a JPG**: Rasterización de vectores a 300 DPI.
7. **JPG a PDF**: Ensamblaje de imágenes en contenedores PDF estructurados.
8. **PDF a Word**: Utiliza `pdf2docx` para inferir topología, párrafos y tablas, reconstruyendo un archivo `.docx` nativo.
9. **Word a PDF**: Implementa llamadas asíncronas a subprocesos de *LibreOffice Headless* para garantizar un renderizado perfecto (1:1) de tipografías y márgenes.
10. **OCR PDF (Reconocimiento Óptico)**: Orquesta `PyMuPDF` para la extracción de imágenes y `Tesseract-OCR` para el mapeo neuronal de caracteres, generando una capa de texto invisible (HOCR) subyacente.

### Seguridad
11. **Proteger PDF**: Cifrado AES de 256 bits nivel industrial.
12. **Desbloquear PDF**: Remoción de contraseñas de apertura y permisos mediante re-guardado de flujo binario.
13. **Marca de Agua**: Superposición de capas de texto con cálculo de opacidad y rotación a 45 grados.

### Extracción y Datos
14. **PDF a Markdown**: Utiliza `pymupdf4llm` para convertir documentos PDF a texto estructurado en formato Markdown. Ideal para RAG y LLMs.

## 4. Requisitos de Dependencias Externas (Entorno de Desarrollo)
Para la ejecución desde código fuente, el entorno local requiere:
- **Tesseract-OCR**: Instalado en el sistema y mapeado en PATH para el módulo OCR.
- **LibreOffice**: Instalado para el motor de conversión Word a PDF.
- En el empaquetado final (`dist/OpenPDF.exe`), estas dependencias se agruparán estratégicamente en una carpeta `bin/` subyacente.

## 5. Escalabilidad y Futuro
El desacoplamiento del Router de FastAPI permite que OpenPDF pueda ser desplegado en el futuro como un clúster de microservicios Docker (ej. un contenedor dedicado exclusivamente a procesar OCR debido a su alto uso de CPU) sin necesidad de reescribir la lógica base.


## 6. Distribuci�n e Instalaci�n
El proyecto incluye un instalador profesional construido con **Inno Setup 6**, definido en el script installer/OpenPDF_Installer.iss.

### Caracter�sticas del Instalador:
- **Despliegue local:** No requiere permisos de administrador; si no hay permisos, se instala en el directorio de usuario (%LocalAppData%).
- **Assets personalizados:** Emplea un �cono limpio multi-resoluci�n y banners del asistente de instalaci�n generados ad-hoc.
- **Experiencia de usuario (UX):** Gu�a al usuario mostrando un resumen de las 14 herramientas y garantizando que se cumplen las promesas de privacidad.
- **Desinstalador completo:** Limpia cach�s residuales y archivos temporales, e integra la aplicaci�n en el registro de Windows para permitir la desinstalaci�n desde *Agregar o quitar programas*.
- **Dependencias embebidas:** Incluye archivos informativos (README.txt, LICENSE.txt) que se muestran y se copian al instalar.


