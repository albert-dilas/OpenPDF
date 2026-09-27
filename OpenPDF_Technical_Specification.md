# OpenPDF
**La Alternativa Open-Source, Privada y Local a iLovePDF**

## 1. Visi贸n General del Proyecto
OpenPDF es una plataforma de procesamiento de documentos PDF dise帽ada bajo la premisa de la **Privacidad Absoluta**. A diferencia de las soluciones comerciales en la nube que requieren subir documentos sensibles a servidores de terceros, OpenPDF ejecuta todo su procesamiento (incluyendo OCR y conversiones pesadas) de manera 100% local en la m谩quina del usuario. 

La arquitectura ha sido dise帽ada en dos capas desacopladas (Frontend React y Backend Python) que, mediante un proceso de empaquetado continuo, se fusionan en un 煤nico archivo ejecutable (`.exe`) monol铆tico, eliminando la necesidad de instalaci贸n de dependencias por parte del cliente final.

## 2. Arquitectura de Software

El sistema implementa una **Arquitectura Limpia (Clean Architecture)** orientada a micro-servicios internos, dividida estructuralmente de la siguiente manera:

### 2.1 Backend (Motor de Procesamiento)
Desarrollado en **Python 3.12** utilizando **FastAPI** por su alto rendimiento y manejo as铆ncrono.
- **`app/api/v1/endpoints/`**: Capa de Controladores. Define las rutas HTTP y valida los datos de entrada (archivos subidos, contrase帽as, configuraciones).
- **`app/services/`**: Capa de L贸gica de Negocio. Aqu铆 residen los algoritmos de transformaci贸n PDF. Est谩 totalmente aislada de la capa web.
- **`app/utils/`**: Herramientas transversales, como el `file_manager.py` encargado de gestionar los archivos temporales y asegurar la recolecci贸n de basura (Garbage Collection) para evitar fugas de almacenamiento local.

### 2.2 Frontend (Capa de Presentaci贸n)
Construido con **Next.js 14 (App Router)**, **React**, y **Tailwind CSS**.
- **`src/app/(tools)/`**: Utiliza el enrutamiento basado en el sistema de archivos de Next.js. Cada herramienta tiene su propia vista aislada.
- **`src/store/`**: Manejo de estado global mediante Zustand (`useFileStore`), permitiendo mantener los archivos en memoria fluidamente sin prop-drilling.
- **`src/components/`**: UI reutilizable, destacando el componente inteligente de *Drag & Drop* (`Uploader.tsx`).

### 2.3 Sistema de Construcci贸n y Empaquetado (Build Pipeline)
El flujo de construcci贸n est谩 completamente automatizado a trav茅s del script maestro `scripts/build_installer.py`, el cual orquesta el pipeline de 3 fases:
1. **Compilaci贸n Frontend:** Ejecuta `npm run build` en Next.js para generar la exportaci贸n est谩tica en `frontend/out`.
2. **Empaquetado (PyInstaller):** Toma el servidor FastAPI y los est谩ticos de Next.js (`--add-data`) y los encapsula en un 煤nico binario ejecutable (`OpenPDF.exe` de ~95 MB) excluyendo m贸dulos innecesarios de Python.
3. **Instalador Profesional (Inno Setup):** Inno Setup (`ISCC.exe`) toma el binario, el 铆cono multi-resoluci贸n, banners de instalaci贸n personalizados, y genera el instalador final distributable (`OpenPDF_Setup_v1.0.0.exe`) con compresi贸n LZMA2 Ultra.

## 3. Especificaciones T茅cnicas de Herramientas (14 M贸dulos)

El ecosistema actual soporta 14 operaciones complejas:

### Optimizaci贸n y Organizaci贸n
1. **Unir PDF**: Utiliza `PyMuPDF (fitz)`. Maneja *Drag & Drop* din谩mico.
2. **Dividir PDF**: Extrae r谩fagas de p谩ginas hacia un archivo `.zip`.
3. **Comprimir PDF**: Implementa algoritmos de deflaci贸n nativa y reconstrucci贸n de XREFs.
4. **Rotar PDF**: Transformaci贸n de matrices de p谩gina a nivel de metadatos.
5. **N煤meros de P谩gina**: Inyecci贸n de texto por coordenadas calculadas en el centro inferior del `rect` de la p谩gina.

### Conversi贸n Avanzada
6. **PDF a JPG**: Rasterizaci贸n de vectores a 300 DPI.
7. **JPG a PDF**: Ensamblaje de im谩genes en contenedores PDF estructurados.
8. **PDF a Word**: Utiliza `pdf2docx` para inferir topolog铆a, p谩rrafos y tablas, reconstruyendo un archivo `.docx` nativo.
9. **Word a PDF**: Implementa llamadas as铆ncronas a subprocesos de *LibreOffice Headless* para garantizar un renderizado perfecto (1:1) de tipograf铆as y m谩rgenes.
10. **OCR PDF (Reconocimiento 脫ptico)**: Orquesta `PyMuPDF` para la extracci贸n de im谩genes y `Tesseract-OCR` para el mapeo neuronal de caracteres, generando una capa de texto invisible (HOCR) subyacente.

### Seguridad
11. **Proteger PDF**: Cifrado AES de 256 bits nivel industrial.
12. **Desbloquear PDF**: Remoci贸n de contrase帽as de apertura y permisos mediante re-guardado de flujo binario.
13. **Marca de Agua**: Superposici贸n de capas de texto con c谩lculo de opacidad y rotaci贸n a 45 grados.

### Extracci贸n y Datos
14. **PDF a Markdown**: Utiliza `pymupdf4llm` para convertir documentos PDF a texto estructurado en formato Markdown. Ideal para RAG y LLMs.

## 4. Requisitos de Dependencias Externas (Entorno de Desarrollo)
Para la ejecuci贸n desde c贸digo fuente, el entorno local requiere:
- **Tesseract-OCR**: Instalado en el sistema y mapeado en PATH para el m贸dulo OCR.
- **LibreOffice**: Instalado para el motor de conversi贸n Word a PDF.
- En el empaquetado final (`dist/OpenPDF.exe`), estas dependencias se agrupar谩n estrat茅gicamente en una carpeta `bin/` subyacente.

## 5. Escalabilidad y Futuro
El desacoplamiento del Router de FastAPI permite que OpenPDF pueda ser desplegado en el futuro como un cl煤ster de microservicios Docker (ej. un contenedor dedicado exclusivamente a procesar OCR debido a su alto uso de CPU) sin necesidad de reescribir la l贸gica base.


## 6. Distribuci髇 e Instalaci髇
El proyecto incluye un instalador profesional construido con **Inno Setup 6**, definido en el script installer/OpenPDF_Installer.iss.

### Caracter韘ticas del Instalador:
- **Despliegue local:** No requiere permisos de administrador; si no hay permisos, se instala en el directorio de usuario (%LocalAppData%).
- **Assets personalizados:** Emplea un 韈ono limpio multi-resoluci髇 y banners del asistente de instalaci髇 generados ad-hoc.
- **Experiencia de usuario (UX):** Gu韆 al usuario mostrando un resumen de las 14 herramientas y garantizando que se cumplen las promesas de privacidad.
- **Desinstalador completo:** Limpia cach閟 residuales y archivos temporales, e integra la aplicaci髇 en el registro de Windows para permitir la desinstalaci髇 desde *Agregar o quitar programas*.
- **Dependencias embebidas:** Incluye archivos informativos (README.txt, LICENSE.txt) que se muestran y se copian al instalar.

