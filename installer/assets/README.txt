=========================================================================
  OpenPDF v2.1.0 - Suite Local-First de Procesamiento Documental PDF
  Plataforma de codigo abierto, privada y 100% local
=========================================================================

DESCRIPCION GENERAL
-------------------
OpenPDF es una plataforma de procesamiento y manipulacion de documentos
PDF que opera en tu equipo local, complementada con utilidades Online
opcionales con proteccion anti-SSRF.


INSTRUCCIONES DE USO
--------------------
1. Ejecuta OpenPDF desde el icono del Escritorio o el Menu de Inicio.
2. El motor local iniciara automaticamente en el primer puerto libre
   disponible (por defecto http://127.0.0.1:8000) y abrira tu navegador
   web predeterminado.
3. Selecciona cualquiera de los 21 modulos, arrastra tus documentos y
   descarga el archivo resultante al instante.


CATALOGO DE MODULOS INCLUIDOS (21 HERRAMIENTAS)
-----------------------------------------------
[ORGANIZAR]
  * Unir PDF          - Combina multiples documentos PDF en el orden elegido
  * Dividir PDF       - Extrae todas las paginas o rangos personalizados (.zip)
  * Organizar PDF     - Previsualiza miniaturas para reordenar, rotar o borrar
  * Rotar PDF         - Gira todas las paginas 90, 180 o 270 grados

[OPTIMIZAR]
  * Comprimir PDF     - 3 niveles (baja, media, alta con optimizacion de imagen)
  * OCR PDF           - Reconocimiento optico de caracteres para PDFs escaneados

[CONVERTIR]
  * PDF a Word        - Convierte PDF a documentos editables .docx
  * Word a PDF        - Convierte documentos .doc y .docx a estandar PDF
  * JPG a PDF         - Ensambla imagenes JPG y PNG en un documento PDF
  * PDF a JPG         - Rasteriza cada pagina en imagenes JPG de alta calidad
  * PDF a Markdown    - Extrae contenido estructurado (.md) para flujos de IA
  * Web / URL a PDF   - [Online] Captura paginas web publicas a PDF limpio
  * Traducir PDF      - [Online] Traduce el contenido del PDF a otros idiomas

[EDITAR]
  * Marca de Agua     - Estampa texto diagonal semitransparente centrado
  * Numeros de Pagina - Inserta numeracion secuencial automatica
  * Editar Metadatos  - Modifica o limpia Titulo, Autor, Asunto y Etiquetas
  * Codigo QR Web     - [Online] Estampa QR verificando URL o audita QRs en PDF

[SEGURIDAD]
  * Firmar / Sellar   - Dibuja firma manuscrita o sube sello PNG/JPG
  * Censurar PDF      - Elimina de forma fisica e irreversible datos sensibles
  * Proteger PDF      - Cifrado criptografico AES-256 con contrasena
  * Desbloquear PDF   - Elimina restricciones y contrasena de apertura


REQUISITOS DEL SISTEMA
----------------------
  * Sistema Operativo : Windows 10 / Windows 11 (64-bit)
  * Memoria RAM       : 4 GB minimo (8 GB recomendado para OCR)
  * Espacio en Disco  : 400 MB libres
  * Conexion de Red   : No requerida para los 18 modulos locales; requerida
                        unicamente para Web a PDF, Traducir PDF y Verificacion QR

NOTA SOBRE MODULOS OPCIONALES (OCR y WORD A PDF):
  El panel superior ("Motor Local Activo") detecta automaticamente si
  Tesseract-OCR y LibreOffice estan instalados en el sistema:
  - Tesseract OCR : https://github.com/UB-Mannheim/tesseract/wiki
  - LibreOffice   : https://www.libreoffice.org/download/


GARANTIA DE PRIVACIDAD
----------------------
  - Cero telemetria ni rastreadores de terceros.
  - Proteccion anti-SSRF en consultas web salientes.
  - Procesamiento en streaming por bloques de 1 MiB.
  - Limpieza automatica de archivos temporales tras cada operacion.


SOPORTE Y CODIGO FUENTE
-----------------------
  Repositorio oficial : https://github.com/albert-dilas/OpenPDF
  Sitio web           : https://albert-dilas.github.io/OpenPDF
  Licencia            : MIT (consultar LICENSE.txt)
=========================================================================
